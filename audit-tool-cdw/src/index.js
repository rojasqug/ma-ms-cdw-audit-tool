import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

// Utility to fetch all changelog pages for an issue
async function fetchAllChangelog(issueKey) {
  const pageSize = 100;
  let startAt = 0;
  let histories = [];
  while (true) {
    const res = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/changelog?maxResults=${pageSize}&startAt=${startAt}`);
    if (!res.ok) throw new Error(`Failed changelog for ${issueKey}: ${res.status}`);
    const data = await res.json();
    histories = histories.concat(data.values || data.histories || []);
    const total = data.total ?? histories.length;
    startAt += pageSize;
    if (startAt >= total || !data.values || data.values.length === 0) break;
  }
  return histories;
}

function msBetween(a, b) {
  return Math.max(0, new Date(b).getTime() - new Date(a).getTime());
}

resolver.define('searchCDROpenRemediation', async () => {
  try {
    const jql = 'project = CDR AND issuetype = "Remediation Request" AND statusCategory != Done ORDER BY updated DESC';
    const pageSize = 100;
    // CHANGE-2046 migration: use enhanced search endpoint and nextPageToken pagination
    // https://developer.atlassian.com/changelog/#CHANGE-2046
    let nextPageToken = undefined;
    let all = [];
    while (true) {
      const body = {
        jql,
        maxResults: pageSize,
        // Use statuscategorychangedate to avoid changelog calls for current status age
        fields: ['summary', 'assignee', 'status', 'priority', 'created', 'statuscategorychangedate'],
        ...(nextPageToken ? { nextPageToken } : {})
      };
      const res = await api.asUser().requestJira(route`/rest/api/3/search/jql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const text = await res.text();
        return { issues: [], error: `Jira search error ${res.status}: ${text}` };
      }
      const data = await res.json();
      const pageIssues = data.issues || [];
      all = all.concat(pageIssues);
      nextPageToken = data.nextPageToken || null;
      if (!nextPageToken || pageIssues.length === 0) break;
    }

    const now = new Date().toISOString();
    const issues = all.map((it) => {
      const started = it.fields.statuscategorychangedate || it.fields.created;
      return {
        key: it.key,
        summary: it.fields.summary,
        assignee: it.fields.assignee ? {
          name: it.fields.assignee.displayName,
          avatarUrl: it.fields.assignee.avatarUrls?.['24x24'] || it.fields.assignee.avatarUrls?.['32x32'] || null
        } : null,
        status: it.fields.status?.name || 'Unassigned',
        priority: it.fields.priority?.name || 'None',
        currentStatusDurationMs: msBetween(started, now)
      };
    });

    return { issues };
  } catch (e) {
    return { issues: [], error: e?.message || String(e) };
  }
});

// Fetch open CDI Ingestion issues (mirrors CDR resolver)
resolver.define('searchCDIOpenIngestion', async () => {
  try {
    const jql = 'project = CDI AND issuetype = "Ingestion" AND statusCategory != Done ORDER BY updated DESC';
    const pageSize = 100;
    // CHANGE-2046 migration: use enhanced search endpoint and nextPageToken pagination
    let nextPageToken = undefined;
    let all = [];
    while (true) {
      const body = {
        jql,
        maxResults: pageSize,
        fields: ['summary', 'assignee', 'status', 'priority', 'created', 'statuscategorychangedate'],
        ...(nextPageToken ? { nextPageToken } : {})
      };
      const res = await api.asUser().requestJira(route`/rest/api/3/search/jql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const text = await res.text();
        return { issues: [], error: `Jira search error ${res.status}: ${text}` };
      }
      const data = await res.json();
      const pageIssues = data.issues || [];
      all = all.concat(pageIssues);
      nextPageToken = data.nextPageToken || null;
      if (!nextPageToken || pageIssues.length === 0) break;
    }
    const now = new Date().toISOString();
    const issues = all.map((it) => {
      const started = it.fields.statuscategorychangedate || it.fields.created;
      return {
        key: it.key,
        summary: it.fields.summary,
        assignee: it.fields.assignee ? {
          name: it.fields.assignee.displayName,
          avatarUrl: it.fields.assignee.avatarUrls?.['24x24'] || it.fields.assignee.avatarUrls?.['32x32'] || null
        } : null,
        status: it.fields.status?.name || 'Unassigned',
        priority: it.fields.priority?.name || 'None',
        currentStatusDurationMs: msBetween(started, now)
      };
    });
    return { issues };
  } catch (e) {
    return { issues: [], error: e?.message || String(e) };
  }
});

// Fetch GDPR and GDPR Task issues for a given project (default CWP) and return a parent-children tree
resolver.define('searchCwpGdprTree', async (req) => {
  try {
    const projectKey = (req?.payload?.projectKey || 'CWP').trim();
    const requestType = (req?.payload?.requestType || 'GDPR').trim();
    const projectLabel = (req?.payload?.projectLabel || '').trim();

    const base = `project = ${projectKey} AND issuetype in ("GDPR","GDPR Task")`;
    // Support both JSM field aliases: "Request Type" and "Customer Request Type"
    const rtExactA = requestType ? `"Request Type" = "${requestType}"` : '';
    const rtExactB = requestType ? `"Customer Request Type" = "${requestType}"` : '';
    const rtWithPortalA = requestType && projectLabel ? `"Request Type" = "${projectLabel} / ${requestType}"` : '';
    const rtWithPortalB = requestType && projectLabel ? `"Customer Request Type" = "${projectLabel} / ${requestType}"` : '';
    const rtParts = [rtExactA, rtExactB, rtWithPortalA, rtWithPortalB].filter(Boolean);
    const rtClause = rtParts.length ? `(${rtParts.join(' OR ')})` : '';

    async function runSearchLoop(jql) {
      const pageSize = 100;
      let nextPageToken = undefined;
      let all = [];
      while (true) {
        const body = {
          jql,
          maxResults: pageSize,
          fields: ['summary', 'issuetype', 'assignee', 'status', 'created', 'parent'],
          ...(nextPageToken ? { nextPageToken } : {})
        };
        const res = await api.asUser().requestJira(route`/rest/api/3/search/jql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const text = await res.text();
          const err = new Error(`Jira search error ${res.status}: ${text}`);
          // Attach status for fallback logic
          // @ts-ignore
          err.status = res.status;
          throw err;
        }
        const data = await res.json();
        const pageIssues = data.issues || [];
        all = all.concat(pageIssues);
        nextPageToken = data.nextPageToken || null;
        if (!nextPageToken || pageIssues.length === 0) break;
      }
      return all;
    }

    let jql = rtClause ? `${base} AND ${rtClause} ORDER BY updated DESC` : `${base} ORDER BY updated DESC`;
    let all = [];
    try {
      all = await runSearchLoop(jql);
    } catch (e) {
      const msg = e?.message || '';
      const status = e?.status;
      const fieldMissing = /Field 'Request Type' does not exist/i.test(msg) || /Field 'Request Type' was not found/i.test(msg);
      // Fallback: drop Request Type filter if field is missing or forbidden
      if (rtClause && (status === 400 || status === 403 || fieldMissing)) {
        jql = `${base} ORDER BY updated DESC`;
        all = await runSearchLoop(jql);
      } else {
        throw e;
      }
    }

    // Build tree with GDPR as parent and GDPR Task as children via fields.parent.key
    const nodeByKey = new Map();
    const roots = [];
    for (const it of all) {
      nodeByKey.set(it.key, {
        key: it.key,
        summary: it.fields.summary,
        type: it.fields.issuetype?.name || 'Unknown',
        assignee: it.fields.assignee?.displayName || null,
        status: it.fields.status?.name || 'Unknown',
        children: []
      });
    }
    for (const it of all) {
      const node = nodeByKey.get(it.key);
      const parentKey = it.fields.parent?.key || null;
      if (parentKey && nodeByKey.has(parentKey)) {
        nodeByKey.get(parentKey).children.push(node);
      } else {
        roots.push(node);
      }
    }

    return { items: roots };
  } catch (e) {
    return { items: [], error: e?.message || String(e) };
  }
});

resolver.define('getIssueStatusHistory', async (req) => {
  try {
    const { key } = req.payload || {};
    if (!key) return { key: null, segments: [], error: 'Missing issue key' };

    // Fetch changelog and issue fields for baseline timestamps
    const [issueRes, histories] = await Promise.all([
      api.asUser().requestJira(route`/rest/api/3/issue/${key}?fields=created,status`),
      fetchAllChangelog(key)
    ]);
    if (!issueRes.ok) {
      const text = await issueRes.text();
      return { key, segments: [], error: `Failed to fetch issue ${key}: ${text}` };
    }
    const issue = await issueRes.json();

    const statusChanges = histories
      .flatMap(h => (h.items || [] ).filter(i => i.field === 'status').map(i => ({ created: h.created, from: i.fromString, to: i.toString })))
      .sort((a,b) => new Date(a.created) - new Date(b.created));

    // Build segments of time spent per status
    const segments = [];
    let cursorTime = issue.fields.created;
    let cursorStatus = statusChanges.length ? statusChanges[0].from : issue.fields.status?.name;
    for (const sc of statusChanges) {
      if (cursorStatus) {
        segments.push({ status: cursorStatus, started: cursorTime, ended: sc.created, durationMs: msBetween(cursorTime, sc.created) });
      }
      cursorStatus = sc.to;
      cursorTime = sc.created;
    }
    const now = new Date().toISOString();
    if (cursorStatus) {
      segments.push({ status: cursorStatus, started: cursorTime, ended: now, durationMs: msBetween(cursorTime, now) });
    }

    return { key, segments };
  } catch (e) {
    return { key: req?.payload?.key || null, segments: [], error: e?.message || String(e) };
  }
});

export const handler = resolver.getDefinitions();

