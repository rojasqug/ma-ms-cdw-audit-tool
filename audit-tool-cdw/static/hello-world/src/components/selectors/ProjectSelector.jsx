/**
 * ProjectSelector
 * Two-dropdown selector for Project + Issue Type
 */

import React, { useMemo } from 'react';
import { Box, xcss, Inline } from '@atlaskit/primitives';
import Select from '@atlaskit/select';
import Button from '@atlaskit/button';
import { PROJECTS, getIssueTypes } from '../../config/projects';

const selectorContainer = xcss({
  display: 'flex',
  flexDirection: 'column',
  gap: 'space.200',
  padding: 'space.300',
  backgroundColor: 'elevation.surface',
  borderRadius: 'border.radius.300',
});

export default function ProjectSelector({
  selectedProject,
  selectedIssueType,
  onProjectChange,
  onIssueTypeChange,
  onSubmit,
}) {
  // Build project options
  const projectOptions = useMemo(
    () =>
      PROJECTS.map(p => ({
        label: p.label,
        value: p.key,
      })),
    []
  );

  // Build issue type options based on selected project
  const issueTypeOptions = useMemo(() => {
    if (!selectedProject) return [];

    const issueTypes = getIssueTypes(selectedProject.value);
    return issueTypes.map(it => ({
      label: it.label,
      value: it.type,
    }));
  }, [selectedProject]);

  const canSubmit = selectedProject && selectedIssueType;

  return (
    <Box xcss={selectorContainer}>
      <Inline space="space.200" alignBlock="center">
        <Box style={{ minWidth: 280 }}>
          <Select
            options={projectOptions}
            value={selectedProject}
            onChange={onProjectChange}
            placeholder="Select project"
            aria-label="Select project"
          />
        </Box>

        <Box style={{ minWidth: 280 }}>
          <Select
            options={issueTypeOptions}
            value={selectedIssueType}
            onChange={onIssueTypeChange}
            placeholder="Select issue type"
            aria-label="Select issue type"
            isDisabled={!selectedProject}
          />
        </Box>

        <Button
          appearance="primary"
          onClick={onSubmit}
          isDisabled={!canSubmit}
        >
          Submit
        </Button>
      </Inline>
    </Box>
  );
}
