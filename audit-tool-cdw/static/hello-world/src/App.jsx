/**
 * App.jsx
 * Main application component using configuration-driven architecture
 * Routes to appropriate view based on project + issue type selection
 */

import React from 'react';
import { Box, xcss } from '@atlaskit/primitives';

import { useProjectContext } from './hooks/useProjectContext';
import { getViewComponent } from './config/routing';

import ProjectSelector from './components/selectors/ProjectSelector';
import TableView from './components/views/TableView';
import TreeView from './components/views/TreeView';
import EmptyView from './components/views/EmptyView';

const appContainer = xcss({
  padding: 'space.400',
  minHeight: '100vh',
  backgroundColor: 'elevation.surface',
});

const headerStyle = xcss({
  marginBlockEnd: 'space.300',
});

function App() {
  const {
    selectedProject,
    selectedIssueType,
    submitted,
    setSelectedProject,
    setSelectedIssueType,
    handleSubmit,
  } = useProjectContext();

  // Determine which view to render
  const viewType = submitted
    ? getViewComponent(selectedProject?.value, selectedIssueType?.value)
    : 'empty';

  return (
    <Box xcss={appContainer}>
      <Box xcss={headerStyle}>
        <h1>Audit Tool Dashboard</h1>
      </Box>

      <ProjectSelector
        selectedProject={selectedProject}
        selectedIssueType={selectedIssueType}
        onProjectChange={setSelectedProject}
        onIssueTypeChange={setSelectedIssueType}
        onSubmit={handleSubmit}
      />

      <Box xcss={xcss({ marginBlockStart: 'space.400' })}>
        {viewType === 'table' && (
          <TableView
            projectKey={selectedProject.value}
            issueType={selectedIssueType.value}
          />
        )}

        {viewType === 'tree' && (
          <TreeView
            projectKey={selectedProject.value}
            issueType={selectedIssueType.value}
          />
        )}

        {viewType === 'empty' && <EmptyView />}
      </Box>
    </Box>
  );
}

export default App;
