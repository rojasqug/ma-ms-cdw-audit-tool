import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as bridge from '@forge/bridge';
import { Box, xcss } from '@atlaskit/primitives';
import SectionMessage from '@atlaskit/section-message';
import Spinner from '@atlaskit/spinner';
import Button from '@atlaskit/button';
import TableTree, { Headers, Header, Rows, Row, Cell } from '@atlaskit/table-tree';

const wrapStyles = xcss({
  display: 'flex',
  flexDirection: 'column',
  rowGap: 'space.300',
});

const controlsRow = xcss({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
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

function useGdprTree(projectKey, projectLabel, requestType) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await bridge.invoke('searchCwpGdprTree', { projectKey, projectLabel, requestType });
      if (resp?.error) throw new Error(resp.error);
      setItems(Array.isArray(resp?.items) ? resp.items : []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[GDPRTable] searchCwpGdprTree failed', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [projectKey, projectLabel, requestType]);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  return { loading, error, items, refresh: fetchTree };
}

export default function GDPRTable({ projectKey = 'CWP', projectLabel = 'Core Workflow Privacy Request', requestType = 'GDPR' }) {
  const { loading, error, items, refresh } = useGdprTree(projectKey, projectLabel, requestType);

  const columns = useMemo(() => ([
    { key: 'key', name: 'Key', width: 140 },
    { key: 'summary', name: 'Summary', width: 420 },
    { key: 'type', name: 'Type', width: 160 },
    { key: 'assignee', name: 'Assignee', width: 220 },
    { key: 'status', name: 'Status', width: 160 },
  ]), []);

  const renderRow = useCallback((item) => (
    <Row
      itemId={item.key}
      items={item.children || []}
      hasChildren={(item.children || []).length > 0}
      isDefaultExpanded={false}
    >
      <Cell width={columns[0].width}>
        <a href={`/browse/${item.key}`} target="_blank" rel="noopener noreferrer">{item.key}</a>
      </Cell>
      <Cell width={columns[1].width}>{item.summary}</Cell>
      <Cell width={columns[2].width}>{item.type}</Cell>
      <Cell width={columns[3].width}>{item.assignee || 'Unassigned'}</Cell>
      <Cell width={columns[4].width}>{item.status}</Cell>
    </Row>
  ), [columns]);

  return (
    <Box xcss={wrapStyles}>
      <Box xcss={controlsRow}>
        <Button appearance="primary" onClick={refresh} isLoading={loading}>Refresh</Button>
      </Box>

      <Box xcss={tableWrap}>
        {loading && (
          <Box xcss={xcss({ display: 'flex', justifyContent: 'center', padding: 'space.400' })}>
            <Spinner size="large" />
          </Box>
        )}
        {!loading && error && (
          <SectionMessage appearance="error" title="Failed to load GDPR issues">
            <p>{sanitizeInvokeError(error)}</p>
            <Button appearance="warning" onClick={refresh}>Retry</Button>
          </SectionMessage>
        )}
        {!loading && !error && (
          <TableTree>
            <Headers>
              {columns.map(col => (
                <Header key={col.key} width={col.width}>{col.name}</Header>
              ))}
            </Headers>
            <Rows
              items={items}
              render={renderRow}
            />
          </TableTree>
        )}
      </Box>
    </Box>
  );
}