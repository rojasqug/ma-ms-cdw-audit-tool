// edit this file please
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, xcss } from '@atlaskit/primitives';
import DynamicTable from '@atlaskit/dynamic-table';
import Button from '@atlaskit/button';
import Avatar from '@atlaskit/avatar';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '@atlaskit/modal-dialog';
import Spinner from '@atlaskit/spinner';
import EmptyState from '@atlaskit/empty-state';
import SectionMessage from '@atlaskit/section-message';
import * as bridge from '@forge/bridge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import Select from '@atlaskit/select';

const wrapStyles = xcss({
  display: 'flex',
  flexDirection: 'column',
  rowGap: 'space.300',
});

const tableWrap = xcss({
  backgroundColor: 'elevation.surface',
  borderColor: 'color.border',
  borderStyle: 'solid',
  borderWidth: 'border.width',
  borderRadius: 'border.radius.300',
  padding: 'space.200',
  overflowX: 'auto',
});

const chartCard = xcss({
  backgroundColor: 'elevation.surface',
  borderColor: 'color.border',
  borderStyle: 'solid',
  borderWidth: 'border.width',
  borderRadius: 'border.radius.300',
  padding: 'space.200',
});

// Center the inner chart area within a card
const chartInner = xcss({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
});

// Softer, lighter fallback palette (distinct but less contrasty)
const CHART_COLORS = ['#2684FF', '#FF7452', '#57D9A3', '#FFE380', '#8777D9', '#79E2F2', '#FFB57D', '#B3D4FF', '#F797FF', '#A5D6A7'];

const chartsGrid = xcss({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  columnGap: 'space.300',
  rowGap: 'space.300',
});

// Optional explicit status colors; fallback covers others
const STATUS_COLORS = {
  'NEW TICKET': '#2684FF',
  'INITIAL REVIEW': '#FFAB00',
  'EMAIL TO VENDOR': '#FF7452',
  'DATA REMEDIATION IN PROGRESS': '#00B8D9',
  'DATA REMEDIATION COMPLETED': '#36B37E',
  'NEED MORE INFO': '#8777D9',
  'DECLINED': '#FFB57D',
  'DONE': '#4CC3A6',
};

function normalizeStatus(name) {
  return String(name || 'Unknown').trim().toUpperCase();
}

function getStatusTextColor(status, baseHex) {
  const norm = normalizeStatus(status);
  if (norm === 'INITIAL REVIEW') {
    return '#CC8B00';
  }
  return getAccessibleTextColor(baseHex);
}

function hexToRgba(hex, alpha) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(145,158,171,${alpha})`;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function darkenHex(hex, amount = 0.35) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return '#172B4D';
  const r = Math.max(0, Math.floor(parseInt(m[1], 16) * (1 - amount)));
  const g = Math.max(0, Math.floor(parseInt(m[2], 16) * (1 - amount)));
  const b = Math.max(0, Math.floor(parseInt(m[3], 16) * (1 - amount)));
  const toHex = (v) => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getAccessibleTextColor(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return '#172B4D';
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  const brightness = 0.299 * r + 0.587 * g + 0.114 * b; // 0-255
  return brightness > 170 ? darkenHex(hex, 0.35) : hex;
}

function getStatusColor(name) {
  const norm = normalizeStatus(name);
  if (STATUS_COLORS[norm]) return STATUS_COLORS[norm];
  let hash = 0;
  for (let i = 0; i < norm.length; i++) hash = (hash * 31 + norm.charCodeAt(i)) >>> 0;
  const idx = hash % CHART_COLORS.length;
  return CHART_COLORS[idx];
}

function getAgentColor(name) {
  const key = String(name || 'Unassigned');
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const idx = hash % CHART_COLORS.length;
  return CHART_COLORS[idx];
}

function getBarFill(name, map) {
  if (map && map.has(name)) return map.get(name);
  const used = new Set(map ? Array.from(map.values()) : []);
  for (let i = 0; i < CHART_COLORS.length; i++) {
    const c = CHART_COLORS[i];
    if (!used.has(c)) return c;
  }
  return getAgentColor(name);
}

function StatusBadge({ status, colorMap }) {
  const norm = normalizeStatus(status);
  const base = colorMap?.get(norm) || getStatusColor(status);
  const bg = hexToRgba(base, 0.1);
  const border = hexToRgba(base, 0.5);
  const color = getStatusTextColor(status, base);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        maxWidth: 'none',
        padding: '2px 8px',
        borderRadius: 0,
        border: `1px solid ${border}`,
        backgroundColor: bg,
        color,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
      title={status}
    >
      {status || 'Unknown'}
    </span>
  );
}

function ChartLegend({ payload = [] }) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'center',
      marginTop: 8,
    }}>
      {payload.map((item, idx) => (
        <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color || '#A5ADBA' }} />
          <span style={{ color: '#172B4D', fontSize: 12 }}>{item.value}</span>
        </span>
      ))}
    </div>
  );
}

const PRIORITY_ICON_BASE = 'https://moodysdatapipeline.atlassian.net/images/icons/priorities/';
const PRIORITY_ICON_MAP = {
  HIGHEST: 'highest_new.svg',
  HIGH: 'high.svg',
  MEDIUM: 'medium.svg',
  LOW: 'low.svg',
  LOWEST: 'lowest.svg',
};

function normalizePriority(name) { return String(name || 'None').trim().toUpperCase(); }

function PriorityIcon({ priority }) {
  const key = normalizePriority(priority);
  const file = PRIORITY_ICON_MAP[key];
  if (!file) return <span title={priority || 'None'} />;
  const src = `${PRIORITY_ICON_BASE}${file}`;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }} title={priority}>
      <img src={src} alt={priority} width={16} height={16} style={{ display: 'block' }} />
    </span>
  );
}

function looksHtml(str) {
  if (!str || typeof str !== 'string') return false;
  const s = str.toLowerCase();
  return s.includes('<html') || s.includes('<!doctype');
}

function sanitizeInvokeError(err) {
  const raw = err?.message || String(err || 'Unknown error');
  if (looksHtml(raw)) return 'Unexpected HTML error response received. See console for details.';
  return raw;
}

function shortenName(name, max = 14) {
  if (!name) return 'Unassigned';
  const parts = String(name).split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const lastInitial = parts[1].slice(0, 1).toUpperCase();
    return `${parts[0]} ${lastInitial}.`;
  }
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

function AssigneeTick(props) {
  const { x, y, payload } = props;
  const label = shortenName(payload?.value || '');
  const dy = 12;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={dy} textAnchor="end" transform={`rotate(-30)`} fill="#6B778C" fontSize="11">
        {label}
      </text>
    </g>
  );
}

// All data fetching for lists and history is done via backend resolvers

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

function AssigneeCell({ assignee }) {
  if (!assignee) return <span style={{ color: 'var(--ds-text-subtle, #6B778C)' }}>Unassigned</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <Avatar size="small" src={assignee.avatarUrl || undefined} name={assignee.name} />
      <span>{assignee.name}</span>
    </span>
  );
}

function StatusTag({ status, colorMap }) { return <StatusBadge status={status} colorMap={colorMap} />; }

function HistoryModal({ issueKey, onClose, colorMap }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [segments, setSegments] = useState([]);

  const fetchHistory = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await bridge.invoke('getIssueStatusHistory', { key: issueKey });
      if (resp?.error) throw new Error(resp.error);
      setSegments(resp?.segments || []);
    } catch (primaryErr) {
      // eslint-disable-next-line no-console
      console.error('[CDITable] getIssueStatusHistory failed', primaryErr);
      setError(primaryErr);
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const head = useMemo(() => ({
    cells: [
      { key: 'status', content: 'Status' },
      { key: 'started', content: 'Started' },
      { key: 'ended', content: 'Ended' },
      { key: 'duration', content: 'Time Spent' },
    ],
  }), []);

  const rows = useMemo(() => (
    (segments || []).map((s, idx) => ({
      key: `${issueKey}-${idx}`,
      cells: [
        { key: 'status', content: <StatusTag status={s.status} colorMap={colorMap} /> },
        { key: 'started', content: new Date(s.started).toLocaleString() },
        { key: 'ended', content: new Date(s.ended).toLocaleString() },
        { key: 'duration', content: formatDuration(s.durationMs) },
      ],
    }))
  ), [segments, issueKey, colorMap]);

  return (
    <Modal onClose={onClose} width="x-large">
      <ModalHeader>
        <ModalTitle>Status history — {issueKey}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        {loading && (
          <Box xcss={xcss({ display: 'flex', justifyContent: 'center', padding: 'space.400' })}>
            <Spinner size="large" />
          </Box>
        )}
        {!loading && error && (
          <SectionMessage appearance="error" title="Failed to load status history">
            <p>{sanitizeInvokeError(error)}</p>
            <Button appearance="warning" onClick={fetchHistory}>Retry</Button>
          </SectionMessage>
        )}
        {!loading && !error && segments?.length === 0 && (
          <EmptyState header="No status changes" description="This issue shows no recorded movement between statuses." />
        )}
        {!loading && !error && segments?.length > 0 && (
          <DynamicTable
            head={head}
            rows={rows}
            rowsPerPage={10}
            defaultPage={1}
            isFixedSize={false}
            loadingSpinnerSize="large"
          />
        )}
      </ModalBody>
      <ModalFooter>
        <Button appearance="primary" onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
}

export default function CDITable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [issues, setIssues] = useState([]);
  const [assigneeFilter, setAssigneeFilter] = useState(null); // null or {label,value}

  const [historyKey, setHistoryKey] = useState(null);
  const openHistory = useCallback((key) => setHistoryKey(key), []);
  const closeHistory = useCallback(() => setHistoryKey(null), []);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await bridge.invoke('searchCDIOpenIngestion');
      if (resp?.error) throw new Error(resp.error);
      setIssues(resp?.issues || []);
    } catch (primaryErr) {
      // eslint-disable-next-line no-console
      console.error('[CDITable] searchCDIOpenIngestion failed', primaryErr);
      setError(primaryErr);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const assigneeOptions = useMemo(() => {
    const names = new Set();
    for (const it of issues || []) {
      const nm = it.assignee?.name;
      if (nm && nm.trim()) names.add(nm.trim());
    }
    const opts = [{ label: 'All', value: '__ALL__' }, { label: 'Unassigned', value: '__UNASSIGNED__' }];
    return opts.concat(Array.from(names).sort((a, b) => a.localeCompare(b)).map(n => ({ label: n, value: n })));
  }, [issues]);

  const filteredIssues = useMemo(() => {
    const all = issues || [];
    const sel = assigneeFilter?.value;
    if (!sel || sel === '__ALL__') return all;
    if (sel === '__UNASSIGNED__') return all.filter(it => !it.assignee?.name);
    return all.filter(it => (it.assignee?.name || '') === sel);
  }, [issues, assigneeFilter]);

  const head = useMemo(() => ({
    cells: [
      { key: 'key', content: 'Key' },
      { key: 'summary', content: 'Summary' },
      { key: 'assignee', content: 'Assignee' },
      { key: 'priority', content: 'Priority' },
      { key: 'status', content: 'Status' },
      { key: 'currentStatus', content: 'Current Status Time' },
      { key: 'history', content: 'Status History' },
    ],
  }), []);

  const statusColorMap = useMemo(() => {
    const present = new Set((filteredIssues || []).map(it => normalizeStatus(it.status || 'Unknown')));
    const map = new Map();
    let i = 0;
    const used = new Set();
    present.forEach(name => {
      if (STATUS_COLORS[name]) {
        map.set(name, STATUS_COLORS[name]);
        used.add(STATUS_COLORS[name]);
      }
    });
    present.forEach(name => {
      if (map.has(name)) return;
      while (used.has(CHART_COLORS[i % CHART_COLORS.length])) i++;
      map.set(name, CHART_COLORS[i % CHART_COLORS.length]);
      used.add(CHART_COLORS[i % CHART_COLORS.length]);
      i++;
    });
    return map;
  }, [filteredIssues]);

  const statusData = useMemo(() => {
    const counts = {};
    for (const it of filteredIssues || []) {
      const name = it.status || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: statusColorMap.get(normalizeStatus(name)) || getStatusColor(name) }));
  }, [filteredIssues, statusColorMap]);

  const rows = useMemo(() => (
    (filteredIssues || []).map((it) => ({
      key: it.key,
      cells: [
        {
          key: 'key',
          content: (
            <a href={`/browse/${it.key}`} target="_blank" rel="noopener noreferrer">{it.key}</a>
          ),
        },
        { key: 'summary', content: it.summary },
        { key: 'assignee', content: <AssigneeCell assignee={it.assignee} /> },
        { key: 'priority', content: <PriorityIcon priority={it.priority} /> },
        { key: 'status', content: <StatusTag status={it.status} colorMap={statusColorMap} /> },
        { key: 'currentStatus', content: formatDuration(it.currentStatusDurationMs || 0) },
        { key: 'history', content: (
            <Button appearance="primary" onClick={() => openHistory(it.key)}>View Status History</Button>
          ) },
      ],
    }))
  ), [filteredIssues, openHistory, statusColorMap]);

  const assigneeData = useMemo(() => {
    const counts = {};
    for (const it of filteredIssues || []) {
      const name = it.assignee?.name || 'Unassigned';
      counts[name] = (counts[name] || 0) + 1;
    }
    const topN = 10;
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top = entries.slice(0, topN);
    const rest = entries.slice(topN);
    const otherCount = rest.reduce((acc, [, c]) => acc + c, 0);
    const rows = top.map(([name, count]) => ({ name, count }));
    if (otherCount > 0) rows.push({ name: 'Others', count: otherCount });
    return rows;
  }, [filteredIssues]);

  const agentColorMap = useMemo(() => {
    const names = new Set();
    for (const it of issues || []) names.add(it.assignee?.name || 'Unassigned');
    const list = Array.from(names).sort((a, b) => a.localeCompare(b));
    const map = new Map();
    list.forEach((n, i) => {
      if (i < CHART_COLORS.length) {
        map.set(n, CHART_COLORS[i]);
      } else {
        const hue = Math.floor((360 / list.length) * i);
        map.set(n, `hsl(${hue}, 60%, 65%)`);
      }
    });
    return map;
  }, [issues]);

  const totalByStatus = useMemo(() => statusData.reduce((acc, s) => acc + s.value, 0), [statusData]);

  return (
    <Box xcss={wrapStyles}>
      <Box xcss={xcss({ display: 'flex', alignItems: 'center', justifyContent: 'space-between' })}>
        <Button appearance="primary" onClick={fetchIssues} isLoading={loading}>Refresh</Button>
        <Box style={{ minWidth: 280 }}>
          <Select
            options={assigneeOptions}
            value={assigneeFilter || assigneeOptions[0]}
            onChange={setAssigneeFilter}
            placeholder="Filter by assignee"
            aria-label="Filter by assignee"
          />
        </Box>
      </Box>

      {!loading && !error && (filteredIssues?.length || 0) > 0 && (
        <Box xcss={chartsGrid}>
          <Box xcss={chartCard}>
            <h4 style={{ margin: 0, marginBottom: 8 }}>Issues by Status</h4>
            <Box xcss={chartInner}>
              <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    labelLine={{ stroke: '#DFE1E6' }}
                    label={({ cx, cy, midAngle, outerRadius, percent }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 18;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text x={x} y={y} fill="#42526E" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight={600} stroke="#FFFFFF" strokeWidth={3} paintOrder="stroke">
                          {`${Math.round(percent * 100)}%`}
                        </text>
                      );
                    }}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}`, 'Cases']} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Box xcss={xcss({ display: 'flex', justifyContent: 'center', marginBlockStart: 'space.100' })}>
              <ChartLegend payload={statusData.map(d => ({ color: d.color, value: d.name }))} />
            </Box>
          </Box>

          <Box xcss={chartCard}>
            <h4 style={{ margin: 0, marginBottom: 8 }}>Issues per Agent</h4>
            <Box xcss={chartInner}>
              <ResponsiveContainer width="100%" height={460}>
                <BarChart data={assigneeData} margin={{ top: 8, right: 24, left: 24, bottom: 52 }} barCategoryGap="6%" barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DFE1E6" />
                  <XAxis dataKey="name" tick={<AssigneeTick />} interval={0} height={84} padding={{ left: 48, right: 48 }} tickMargin={10} />
                  <YAxis allowDecimals={false} tick={{ fill: '#6B778C', fontSize: 11 }} width={36} />
                  <Tooltip formatter={(v) => [`${v}`, 'Issues']} />
                  <Bar dataKey="count" name="Issues" maxBarSize={64}>
                    {assigneeData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={getBarFill(entry.name, agentColorMap)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </Box>
      )}

      <Box xcss={tableWrap}>
        {loading && (
          <Box xcss={xcss({ display: 'flex', justifyContent: 'center', padding: 'space.400' })}>
            <Spinner size="large" />
          </Box>
        )}
        {!loading && error && (
          <SectionMessage appearance="error" title="Failed to load issues">
            <p>{sanitizeInvokeError(error)}</p>
            <Button appearance="warning" onClick={fetchIssues}>Retry</Button>
          </SectionMessage>
        )}
        {!loading && !error && (filteredIssues?.length || 0) === 0 && (
          <EmptyState header="No open Ingestion issues in CDI" description="Try different filters or check back later." />
        )}
        {!loading && !error && (filteredIssues?.length || 0) > 0 && (
          <DynamicTable
            head={head}
            rows={rows}
            rowsPerPage={10}
            defaultPage={1}
            isFixedSize
            loadingSpinnerSize="large"
          />
        )}
      </Box>

      {historyKey && (
        <HistoryModal issueKey={historyKey} onClose={closeHistory} colorMap={statusColorMap} />
      )}
    </Box>
  );
}