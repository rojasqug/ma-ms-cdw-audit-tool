/**
 * ActivityModal
 * Modal displaying activity/changelog for an issue
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
import { formatDate, sanitizeInvokeError } from '../../utils/formatters';

const spinnerContainer = xcss({
  display: 'flex',
  justifyContent: 'center',
  padding: 'space.400',
});

export default function ActivityModal({ issueKey, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activities, setActivities] = useState([]);

  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bridge.invoke('getIssueActivity', {
        key: issueKey,
      });
      
      if (response?.error) {
        throw new Error(response.error);
      }
      
      setActivities(response?.activities || []);
    } catch (err) {
      console.error('[ActivityModal] Failed to fetch activity:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const head = useMemo(
    () => ({
      cells: [
        { key: 'created', content: 'Date', width: 15 },
        { key: 'author', content: 'User', width: 20 },
        { key: 'field', content: 'Field', width: 15 },
        { key: 'fromString', content: 'From', width: 25 },
        { key: 'toString', content: 'To', width: 25 },
      ],
    }),
    []
  );

  const rows = useMemo(
    () =>
      (activities || []).map((activity, index) => ({
        key: `${issueKey}-activity-${index}`,
        cells: [
          { key: 'created', content: formatDate(activity.created) },
          { key: 'author', content: String(activity.author || 'System') },
          { key: 'field', content: String(activity.field || '') },
          { key: 'fromString', content: String(activity.fromString || '(empty)') },
          { key: 'toString', content: String(activity.toString || '(empty)') },
        ],
      })),
    [activities, issueKey]
  );

  return (
    <Modal onClose={onClose} width="x-large">
      <ModalHeader>
        <ModalTitle>Activity — {issueKey}</ModalTitle>
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
            title="Failed to load activity"
          >
            <p>{sanitizeInvokeError(error)}</p>
            <Button appearance="warning" onClick={fetchActivity}>
              Retry
            </Button>
          </SectionMessage>
        )}
        
        {!loading && !error && activities.length === 0 && (
          <EmptyState
            header="No activity"
            description="This issue has no recorded activity."
          />
        )}
        
        {!loading && !error && activities.length > 0 && (
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
