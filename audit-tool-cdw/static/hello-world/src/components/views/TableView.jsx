/**
 * TableView
 * Generic table view with optional charts and filters
 * Handles flat issue lists (CDR, CDI)
 */

import React, { useMemo, useState, useCallback } from 'react';
import { Box, xcss } from '@atlaskit/primitives';
import DynamicTable from '@atlaskit/dynamic-table';
import Button from '@atlaskit/button';
import Spinner from '@atlaskit/spinner';
import EmptyState from '@atlaskit/empty-state';
import SectionMessage from '@atlaskit/section-message';

import { useProjectData } from '../../hooks/useProjectData';
import { useAssigneeFilter } from '../../hooks/useAssigneeFilter';
import { getTableConfig } from '../../config/tables';
import {
  buildStatusColorMap,
  buildAgentColorMap,
  transformToStatusData,
  transformToAssigneeData,
} from '../../utils/transformers';
import { sanitizeInvokeError } from '../../utils/formatters';
import { chartsGridStyle } from '../../utils/chartHelper';

import PageContainer from '../layout/PageContainer';
import ContentSection from '../layout/ContentSection';
import ControlBar from '../layout/ControlBar';
import AssigneeFilter from '../filters/AssigneeFilter';
import StatusPieChart from '../charts/StatusPieChart';
import AssigneeBarChart from '../charts/AssigneeBarChart';
import StatusHistoryModal from '../modals/StatusHistoryModal';

import AssigneeCell from '../cells/AssigneeCell';
import StatusCell from '../cells/StatusCell';
import PriorityCell from '../cells/PriorityCell';
import KeyCell from '../cells/KeyCell';
import DurationCell from '../cells/DurationCell';

const spinnerContainer = xcss({
  display: 'flex',
  justifyContent: 'center',
  padding: 'space.400',
});

const chartsGrid = xcss(chartsGridStyle);

export default function TableView({ projectKey, issueType }) {
  const [historyKey, setHistoryKey] = useState(null);

  // Fetch data
  const { loading, error, data: issues, refresh } = useProjectData(
    projectKey,
    issueType
  );

  // Get table configuration
  const config = useMemo(
    () => getTableConfig(projectKey, issueType),
    [projectKey, issueType]
  );

  // Assignee filtering (if enabled)
  const {
    assigneeFilter,
    setAssigneeFilter,
    assigneeOptions,
    filteredIssues,
  } = useAssigneeFilter(issues);

  // Build color maps
  const statusColorMap = useMemo(
    () => buildStatusColorMap(filteredIssues),
    [filteredIssues]
  );

  const agentColorMap = useMemo(
    () => buildAgentColorMap(issues),
    [issues]
  );

  // Transform data for charts
  const statusData = useMemo(
    () => transformToStatusData(filteredIssues, statusColorMap),
    [filteredIssues, statusColorMap]
  );

  const assigneeData = useMemo(
    () => transformToAssigneeData(filteredIssues, 10),
    [filteredIssues]
  );

  // History modal handlers
  const openHistory = useCallback((key) => setHistoryKey(key), []);
  const closeHistory = useCallback(() => setHistoryKey(null), []);

  // Build table head
  const head = useMemo(
    () => ({
      cells: config.columns.map(col => ({
        key: col.id,
        content: col.label,
        width: col.width,
      })),
    }),
    [config.columns]
  );

  // Build table rows
  const rows = useMemo(
    () =>
      (filteredIssues || []).map(issue => {
        const cells = config.columns.map(col => {
          let content;

          switch (col.id) {
            case 'key':
              content = <KeyCell issueKey={issue.key} />;
              break;
            case 'summary':
              content = issue.summary;
              break;
            case 'assignee':
              content = <AssigneeCell assignee={issue.assignee} />;
              break;
            case 'priority':
              content = <PriorityCell priority={issue.priority} />;
              break;
            case 'status':
              content = (
                <StatusCell status={issue.status} colorMap={statusColorMap} />
              );
              break;
            case 'currentStatusDurationMs':
              content = (
                <DurationCell milliseconds={issue.currentStatusDurationMs} />
              );
              break;
            case 'history':
              content = (
                <Button appearance="primary" onClick={() => openHistory(issue.key)}>
                  View Status History
                </Button>
              );
              break;
            default:
              content = issue[col.id] || '';
          }

          return {
            key: col.id,
            content,
          };
        });

        return {
          key: issue.key,
          cells,
        };
      }),
    [filteredIssues, config.columns, statusColorMap, openHistory]
  );

  return (
    <PageContainer>
      {/* Control Bar */}
      <ControlBar>
        <Button appearance="primary" onClick={refresh} isLoading={loading}>
          Refresh
        </Button>
        {config.hasAssigneeFilter && (
          <AssigneeFilter
            options={assigneeOptions}
            value={assigneeFilter}
            onChange={setAssigneeFilter}
          />
        )}
      </ControlBar>

      {/* Charts (if enabled) */}
      {!loading &&
        !error &&
        config.hasCharts &&
        filteredIssues.length > 0 && (
          <Box xcss={chartsGrid}>
            {config.charts.includes('statusPie') && (
              <StatusPieChart data={statusData} />
            )}
            {config.charts.includes('assigneeBar') && (
              <AssigneeBarChart data={assigneeData} colorMap={agentColorMap} />
            )}
          </Box>
        )}

      {/* Table */}
      <ContentSection>
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

        {!loading && !error && filteredIssues.length === 0 && (
          <EmptyState
            header={config.emptyMessage}
            description="Try different filters or check back later."
          />
        )}

        {!loading && !error && filteredIssues.length > 0 && (
          <DynamicTable
            head={head}
            rows={rows}
            rowsPerPage={10}
            defaultPage={1}
            isFixedSize
            loadingSpinnerSize="large"
          />
        )}
      </ContentSection>

      {/* Status History Modal */}
      {historyKey && (
        <StatusHistoryModal
          issueKey={historyKey}
          onClose={closeHistory}
          statusColorMap={statusColorMap}
        />
      )}
    </PageContainer>
  );
}
