/**
 * CommentsModal
 * Modal displaying comments/changelog for an issue
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

export default function CommentsModal({ issueKey, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bridge.invoke('getIssueComments', {
        key: issueKey,
      });
      
      if (response?.error) {
        throw new Error(response.error);
      }
      
      setComments(response?.comments || []);
    } catch (err) {
      console.error('[CommentsModal] Failed to fetch comments:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const head = useMemo(
    () => ({
      cells: [
        { key: 'author', content: 'Author', width: 20 },
        { key: 'created', content: 'Created', width: 20 },
        { key: 'body', content: 'Comment', width: 60 },
      ],
    }),
    []
  );

  const rows = useMemo(
    () =>
      (comments || []).map((comment, index) => ({
        key: `${issueKey}-comment-${index}`,
        cells: [
          { key: 'author', content: String(comment.author || 'Unknown') },
          { key: 'created', content: formatDate(comment.created) },
          { key: 'body', content: String(comment.body || '') },
        ],
      })),
    [comments, issueKey]
  );

  return (
    <Modal onClose={onClose} width="x-large">
      <ModalHeader>
        <ModalTitle>Comments — {issueKey}</ModalTitle>
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
            title="Failed to load comments"
          >
            <p>{sanitizeInvokeError(error)}</p>
            <Button appearance="warning" onClick={fetchComments}>
              Retry
            </Button>
          </SectionMessage>
        )}
        
        {!loading && !error && comments.length === 0 && (
          <EmptyState
            header="No comments"
            description="This issue has no comments yet."
          />
        )}
        
        {!loading && !error && comments.length > 0 && (
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
