/**
 * TreeView
 * Hierarchical tree view for parent-child relationships
 * Used for CWP GDPR issues with subtasks
 */

import React, { useMemo, useCallback, useState, useRef, useLayoutEffect } from 'react';
import { Box, xcss } from '@atlaskit/primitives';
import Button from '@atlaskit/button';
import Spinner from '@atlaskit/spinner';
import EmptyState from '@atlaskit/empty-state';
import SectionMessage from '@atlaskit/section-message';
import TableTree, { Headers, Header, Rows, Row, Cell } from '@atlaskit/table-tree';
import Flag, { FlagGroup } from '@atlaskit/flag';
import CheckCircleIcon from '@atlaskit/icon/glyph/check-circle';
import ErrorIcon from '@atlaskit/icon/glyph/error';
import InfoIcon from '@atlaskit/icon/glyph/info';

import { useProjectData } from '../../hooks/useProjectData';
import { getTableConfig } from '../../config/tables';
import { buildStatusColorMap } from '../../utils/transformers';
import { sanitizeInvokeError, formatDate } from '../../utils/formatters';

import PageContainer from '../layout/PageContainer';
import ContentSection from '../layout/ContentSection';
import ControlBar from '../layout/ControlBar';
import DateRangeFilter from '../filters/DateRangeFilter';
import CommentsModal from '../modals/CommentsModal';
import ActivityModal from '../modals/ActivityModal';

import AssigneeCell from '../cells/AssigneeCell';
import StatusCell from '../cells/StatusCell';
import KeyCell from '../cells/KeyCell';
import IssueTypeCell from '../cells/IssueTypeCell';

const spinnerContainer = xcss({
  display: 'flex',
  justifyContent: 'center',
  padding: 'space.400',
});

const tableContainer = xcss({
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
});

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  return {
    start: formatDateInput(start),
    end: formatDateInput(end),
  };
}

export default function TreeView({ projectKey, issueType }) {
  const defaultRange = useMemo(getDefaultDateRange, []);
  // Date range state defaults to last 30 days
  const [fromDate, setFromDate] = useState(defaultRange.start);
  const [toDate, setToDate] = useState(defaultRange.end);
  
  // Modal state
  const [commentsKey, setCommentsKey] = useState(null);
  const [activityKey, setActivityKey] = useState(null);
  
  // PDF export state
  const [exportingPdf, setExportingPdf] = useState(null);
  // Flags (toaster) state
  const [flags, setFlags] = useState([]);

  const addFlag = useCallback((flag) => {
    setFlags((prev) => [...prev, flag]);
  }, []);

  const dismissFlag = useCallback((id) => {
    setFlags((prev) => prev.filter((f) => f.id !== id));
  }, []);
  
  // Fetch data with date range
  const { loading, error, data: items, refresh } = useProjectData(
    projectKey,
    issueType,
    { fromDate, toDate }
  );

  // Get base table configuration
  const config = useMemo(
    () => getTableConfig(projectKey, issueType),
    [projectKey, issueType]
  );

  // Measure container width to stretch the table dynamically
  const sectionRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    const computeWidth = () => {
      const element = sectionRef.current;
      if (!element) return;
      const width = element.getBoundingClientRect?.().width || element.offsetWidth || 0;
      const styles = window.getComputedStyle(element);
      const paddingLeft = parseFloat(styles.paddingLeft) || 0;
      const paddingRight = parseFloat(styles.paddingRight) || 0;
      const borderLeft = parseFloat(styles.borderLeftWidth) || 0;
      const borderRight = parseFloat(styles.borderRightWidth) || 0;
      const available = width - paddingLeft - paddingRight - borderLeft - borderRight;
      if (available > 0) setContainerWidth(Math.floor(available));
    };

    const raf = requestAnimationFrame(computeWidth);

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => computeWidth());
      const element = sectionRef.current;
      if (element) ro.observe(element);
    }

    window.addEventListener('resize', computeWidth);
    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', computeWidth);
    };
  }, []);

  // Compute columns with equal widths to fill container
  const displayColumns = useMemo(() => {
    const cols = config.columns || [];
    if (!cols.length) return cols;
    
    // If containerWidth isn't available yet, use base widths from config
    if (!containerWidth) return cols;

    const availableWidth = containerWidth;
    const equalWidth = Math.floor(availableWidth / cols.length);
    const remainder = availableWidth - equalWidth * cols.length;

    return cols.map((c, index) => ({
      ...c,
      width: equalWidth + (index === 0 ? remainder : 0),
    }));
  }, [config.columns, containerWidth]);

  // Build color map for status badges
  const statusColorMap = useMemo(
    () => buildStatusColorMap(items),
    [items]
  );

  // Handle PDF export
  const handleExportPdf = useCallback(async (issueKey) => {
    try {
      setExportingPdf(issueKey);
      const inProgressId = `pdf-${issueKey}-${Date.now()}`;
      addFlag({
        id: inProgressId,
        appearance: 'info',
        title: 'Generating PDF Report…',
        description: 'Fetching comments and activity. This may take up to a minute.',
        icon: <InfoIcon label="info" />,
      });
      
      console.log('[TreeView] Exporting PDF for:', issueKey);
      
      const response = await require('@forge/bridge').invoke('generateGDPRPdfReport', {
        issueKey: issueKey
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      console.log('[TreeView] PDF generated, size:', response.size, 'bytes');
      
      // Convert base64 to blob
      const binaryString = atob(response.pdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      
      // Trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('[TreeView] PDF downloaded successfully');
      // Success toast
      dismissFlag(inProgressId);
      const successId = `pdf-success-${Date.now()}`;
      addFlag({
        id: successId,
        appearance: 'success',
        title: 'PDF report ready',
        description: response.filename,
        icon: <CheckCircleIcon label="success" />,
      });
      setTimeout(() => dismissFlag(successId), 3000);
    } catch (err) {
      console.error('[TreeView] PDF export failed:', err);
      // Error toast
      const errorId = `pdf-error-${Date.now()}`;
      addFlag({
        id: errorId,
        appearance: 'error',
        title: 'Failed to export PDF',
        description: err.message,
        icon: <ErrorIcon label="error" />,
      });
    } finally {
      setExportingPdf(null);
    }
  }, []);

  // Render a single row with its cells
  const renderRow = useCallback(
    (item) => {
      const hasChildren = item.children && item.children.length > 0;

      return (
        <Row
          itemId={item.key}
          hasChildren={hasChildren}
          items={item.children}
        >
          {displayColumns.map(col => {
            let content;

            switch (col.id) {
              case 'key':
                content = <KeyCell issueKey={item.key} />;
                break;
              case 'summary':
                content = item.summary;
                break;
              case 'type':
                content = (
                  <IssueTypeCell
                    name={item.type}
                    iconUrl={item.typeIcon}
                  />
                );
                break;
              case 'assignee':
                content = <AssigneeCell assignee={item.assignee} />;
                break;
              case 'status':
                content = (
                  <StatusCell status={item.status} colorMap={statusColorMap} />
                );
                break;
              case 'resolutiondate':
                content = formatDate(item.resolutiondate);
                break;
              case 'comments':
                content = (
                  <Button 
                    appearance="primary"
                    spacing="compact"
                    onClick={() => setCommentsKey(item.key)}
                    style={{ width: '100%' }}
                  >
                    Show Comments
                  </Button>
                );
                break;
              case 'activity':
                content = (
                  <Button 
                    appearance="primary"
                    spacing="compact"
                    onClick={() => setActivityKey(item.key)}
                    style={{ width: '100%' }}
                  >
                    Show Activity
                  </Button>
                );
                break;
              case 'report':
                // Only show export button for parent issues (items with children)
                content = hasChildren ? (
                  <Button 
                    appearance="primary"
                    spacing="compact"
                    onClick={() => handleExportPdf(item.key)}
                    isLoading={exportingPdf === item.key}
                    style={{ width: '100%' }}
                  >
                    Export PDF Report
                  </Button>
                ) : null;
                break;
              default:
                content = item[col.id] || '';
            }

            return (
              <Cell key={col.id} width={col.width}>
                {content}
              </Cell>
            );
          })}
        </Row>
      );
    },
    [displayColumns, statusColorMap, exportingPdf, handleExportPdf]
  );

  return (
    <PageContainer>
      {/* Control Bar */}
      <ControlBar>
        <Button appearance="primary" onClick={refresh} isLoading={loading}>
          Refresh
        </Button>
        <DateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          onFromChange={setFromDate}
          onToChange={setToDate}
        />
      </ControlBar>

      {/* Tree Table */}
      <ContentSection ref={sectionRef}>
        {loading && (
          <Box xcss={spinnerContainer}>
            <Spinner size="large" />
          </Box>
        )}

        {!loading && error && (
          <SectionMessage appearance="error" title="Failed to load issues">
            <p>{sanitizeInvokeError(error)}</p>
            <Button appearance="warning" onClick={refresh}>
              Retry
            </Button>
          </SectionMessage>
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState
            header={config.emptyMessage}
            description="Check back later or verify the project configuration."
          />
        )}

        {!loading && !error && items.length > 0 && (
          <Box xcss={tableContainer}>
            <TableTree style={{ width: containerWidth ? `${containerWidth}px` : '100%' }}>
              <Headers>
                {displayColumns.map(col => (
                  <Header key={col.id} width={col.width}>
                    {col.label}
                  </Header>
                ))}
              </Headers>
              <Rows items={items} render={renderRow} />
            </TableTree>
          </Box>
        )}
      </ContentSection>
      
      {/* Comments Modal */}
      {commentsKey && (
        <CommentsModal
          issueKey={commentsKey}
          onClose={() => setCommentsKey(null)}
        />
      )}
      
      {/* Activity Modal */}
      {activityKey && (
        <ActivityModal
          issueKey={activityKey}
          onClose={() => setActivityKey(null)}
        />
      )}

      {/* Toasts */}
      <FlagGroup onDismiss={(id) => dismissFlag(id)}>
        {flags.map((flag) => (
          <Flag
            key={flag.id}
            id={flag.id}
            appearance={flag.appearance}
            title={flag.title}
            description={flag.description}
            icon={flag.icon}
            isDismissAllowed
            onDismissed={() => dismissFlag(flag.id)}
          />
        ))}
      </FlagGroup>
    </PageContainer>
  );
}
