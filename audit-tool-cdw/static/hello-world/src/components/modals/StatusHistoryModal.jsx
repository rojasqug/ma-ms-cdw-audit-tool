/**
 * StatusHistoryModal
 * Modal displaying status change history for an issue
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, xcss } from '@atlaskit/primitives';
import Modal, {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@atlaskit/modal-dialog';
import Button from '@atlaskit/button';
import Spinner from '@atlaskit/spinner';
import EmptyState from '@atlaskit/empty-state';
import SectionMessage from '@atlaskit/section-message';
import DynamicTable from '@atlaskit/dynamic-table';
import * as bridge from '@forge/bridge';
import StatusCell from '../cells/StatusCell';
import { formatDate, formatDuration, sanitizeInvokeError } from '../../utils/formatters';

const spinnerContainer = xcss({
  display: 'flex',
  justifyContent: 'center',
  padding: 'space.400',
});

export default function StatusHistoryModal({ issueKey, onClose, statusColorMap }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [segments, setSegments] = useState([]);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bridge.invoke('getIssueStatusHistory', {
        key: issueKey,
      });
      
      if (response?.error) {
        throw new Error(response.error);
      }
      
      setSegments(response?.segments || []);
    } catch (err) {
      console.error('[StatusHistoryModal] Failed to fetch history:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const head = useMemo(
    () => ({
      cells: [
        { key: 'status', content: 'Status' },
        { key: 'started', content: 'Started' },
        { key: 'ended', content: 'Ended' },
        { key: 'duration', content: 'Time Spent' },
      ],
    }),
    []
  );

  const rows = useMemo(
    () =>
      (segments || []).map((segment, index) => ({
        key: `${issueKey}-${index}`,
        cells: [
          {
            key: 'status',
            content: (
              <StatusCell
                status={segment.status}
                colorMap={statusColorMap}
              />
            ),
          },
          { key: 'started', content: formatDate(segment.started) },
          { key: 'ended', content: formatDate(segment.ended) },
          { key: 'duration', content: formatDuration(segment.durationMs) },
        ],
      })),
    [segments, issueKey, statusColorMap]
  );

  return (
    <Modal onClose={onClose} width="x-large">
      <ModalHeader>
        <ModalTitle>Status history — {issueKey}</ModalTitle>
      </ModalHeader>
      
      <ModalBody>
        {loading && (
          <Box xcss={spinnerContainer}>
            <Spinner size="large" />
          </Box>
        )}
        
        {!loading && error && (
          <SectionMessage
            appearance="error"
            title="Failed to load status history"
          >
            <p>{sanitizeInvokeError(error)}</p>
            <Button appearance="warning" onClick={fetchHistory}>
              Retry
            </Button>
          </SectionMessage>
        )}
        
        {!loading && !error && segments.length === 0 && (
          <EmptyState
            header="No status changes"
            description="This issue shows no recorded movement between statuses."
          />
        )}
        
        {!loading && !error && segments.length > 0 && (
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
        <Button appearance="primary" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
