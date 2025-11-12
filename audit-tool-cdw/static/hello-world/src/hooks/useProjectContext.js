/**
 * useProjectContext Hook
 * Manages project and issue type selection state
 * Can be extended to use React Context if needed
 */

import { useState } from 'react';

export function useProjectContext() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedIssueType, setSelectedIssueType] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleProjectChange = (project) => {
    setSelectedProject(project);
    setSelectedIssueType(null); // Reset issue type when project changes
    setSubmitted(false);
  };

  const handleIssueTypeChange = (issueType) => {
    setSelectedIssueType(issueType);
  };

  const handleSubmit = () => {
    if (selectedProject && selectedIssueType) {
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setSelectedProject(null);
    setSelectedIssueType(null);
    setSubmitted(false);
  };

  return {
    selectedProject,
    selectedIssueType,
    submitted,
    setSelectedProject: handleProjectChange,
    setSelectedIssueType: handleIssueTypeChange,
    handleSubmit,
    handleReset,
  };
}
