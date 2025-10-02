import React, { useEffect, useMemo, useState } from 'react';
import Select from '@atlaskit/select';
import Button from '@atlaskit/button';
import { Box, xcss } from '@atlaskit/primitives';
import CDRTable from './components/CDRTable';
import CDITable from './components/CDITable';
import GDPRTable from './components/GDPRTable';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box xcss={xcss({ padding: 'space.400' })}>
          <div role="alert" style={{ color: 'var(--ds-text-danger, #DE350B)' }}>
            <strong>Something went wrong.</strong>
            <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</div>
          </div>
        </Box>
      );
    }
    // @ts-ignore
    return this.props.children;
  }
}

function App() {
  // Local state managed here
  const [project, setProject] = useState(null);
  const [requestType, setRequestType] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Options
  const projectOptions = useMemo(
    () => [
      { label: 'Core Data Remediation', value: 'CDR' },
      { label: 'Core Data Alert Events', value: 'CDI' },
      { label: 'Core Workflow Privacy Request', value: 'CWP' },
    ],
    []
  );

  const remediationRequest = useMemo(
    () => [{ label: 'Remediation Request', value: 'remediation-request' }],
    []
  );
  const ingestionRemediation = useMemo(
    () => [{ label: 'Ingestion Remediation', value: 'ingestion-remediation' }],
    []
  );

  const privacyRequestGdpr = useMemo(
    () => [{ label: 'GDPR', value: 'GDPR' }],
    []
  );

  // Placeholder continue action (no backend yet)
  const onSubmit = (formData) => {
    // Dummy submit: no backend for now
    // eslint-disable-next-line no-console
    console.log('[audit-tool-cdw] submit', formData);
  };

  // Debug mount to validate rendering during forge tunnel
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[audit-tool-cdw] App mounted');
  }, []);

  // xcss styles using Atlassian tokens (theme-aware)
  const pageStyles = xcss({
    padding: 'space.400',
    backgroundColor: 'elevation.surface',
  });
  const cardStyles = xcss({
    backgroundColor: 'elevation.surface',
    borderRadius: 'border.radius.300',
    padding: 'space.800',
    borderColor: 'color.border',
    borderWidth: 'border.width',
    borderStyle: 'solid',
    width: 'size.2000',
    marginInline: 'space.0',
    marginBlockStart: 'space.400',
  });
  const containerCenter = xcss({
    display: 'flex',
    justifyContent: 'center',
  });
  const headingStyles = xcss({
    marginBlockEnd: 'space.400',
    color: 'color.text',
    fontWeight: 'font.weight.bold',
  });
  const descStyles = xcss({
    marginBlockEnd: 'space.600',
    color: 'color.text.subtle',
  });
  const fieldStyles = xcss({ marginBlockEnd: 'space.600' });
  const actionsStyles = xcss({ marginBlockStart: 'space.600', display: 'flex', alignItems: 'center', columnGap: 'space.400' });

  if (submitted) {
    const isCDRRemediation = project?.value === 'CDR' && requestType?.value === 'remediation-request';
    const isCDIIngestion = project?.value === 'CDI' && requestType?.value === 'ingestion-remediation';
    const isCwpGdpr = project?.value === 'CWP' && requestType?.value === 'GDPR';
    if (isCDRRemediation) {
      return (
        <Box xcss={pageStyles} style={{ minHeight: '100vh' }}>
          <Box xcss={containerCenter}>
            <Box xcss={xcss({ width: 'size.2000', marginBlockStart: 'space.200' })}>
              <Box xcss={headingStyles} role="heading" aria-level={2}>CDR — Remediation Request</Box>
              <ErrorBoundary>
                <CDRTable />
              </ErrorBoundary>
              <Box xcss={actionsStyles}>
                <Button appearance="default" onClick={() => setSubmitted(false)}>Back</Button>
              </Box>
            </Box>
          </Box>
        </Box>
      );
    } else if (isCDIIngestion) {
      return (
        <Box xcss={pageStyles} style={{ minHeight: '100vh' }}>
          <Box xcss={containerCenter}>
            <Box xcss={xcss({ width: 'size.2000', marginBlockStart: 'space.200' })}>
              <Box xcss={headingStyles} role="heading" aria-level={2}>CDI — Ingestion Remediation</Box>
              <ErrorBoundary>
                <CDITable />
              </ErrorBoundary>
              <Box xcss={actionsStyles}>
                <Button appearance="default" onClick={() => setSubmitted(false)}>Back</Button>
              </Box>
            </Box>
          </Box>
        </Box>
      );
    } else if (isCwpGdpr) {
      return (
        <Box xcss={pageStyles} style={{ minHeight: '100vh' }}>
          <Box xcss={containerCenter}>
            <Box xcss={xcss({ width: 'size.2000', marginBlockStart: 'space.200' })}>
              <Box xcss={headingStyles} role="heading" aria-level={2}>CWP — GDPR</Box>
              <ErrorBoundary>
                <GDPRTable projectKey={project.value} projectLabel={project.label} requestType={requestType.value} />
              </ErrorBoundary>
              <Box xcss={actionsStyles}>
                <Button appearance="default" onClick={() => setSubmitted(false)}>Back</Button>
              </Box>
            </Box>
          </Box>
        </Box>
      );
    }

    // Fallback for other selections (keeps prior behavior)
    return (
      <Box xcss={pageStyles} style={{ minHeight: '100vh' }}>
        <Box xcss={containerCenter}>
          <Box xcss={cardStyles}>
            <Box xcss={headingStyles} role="heading" aria-level={2}>Next step</Box>
            <Box as="p" xcss={descStyles}>Mock next screen. You selected:</Box>
            <Box as="ul" xcss={xcss({ color: 'color.text' })}>
              <li><strong>Project:</strong> {project?.label}</li>
              <li><strong>Request type:</strong> {requestType?.label}</li>
            </Box>
            <Box xcss={actionsStyles}>
              <Button appearance="default" onClick={() => setSubmitted(false)}>Back</Button>
              <Button appearance="primary" isDisabled>Proceed</Button>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box xcss={pageStyles} style={{ minHeight: '100vh' }}>
      <Box xcss={containerCenter}>
        <Box xcss={cardStyles}>
          <Box xcss={headingStyles} role="heading" aria-level={2}>Audit & Reporting</Box>
          <Box as="p" xcss={descStyles}>Select a project and request type to continue. Data fetching will be wired via Forge Bridge next.</Box>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit({ project, requestType });
              setSubmitted(true);
            }}
            noValidate
          >
            <Box xcss={fieldStyles}>
              <Box as="label" htmlFor="project" xcss={xcss({ color: 'color.text.subtle', fontWeight: 'font.weight.bold', marginBlockEnd: 'space.100' })}>Project</Box>
              <Select
                inputId="project"
                placeholder="Select a project"
                options={projectOptions}
                value={project}
                onChange={(opt) => {
                  setProject(opt);
                  setRequestType(null);
                }}
                isClearable
              />
            </Box>

            <Box xcss={fieldStyles}>
              <Box as="label" htmlFor="requestType" xcss={xcss({ color: 'color.text.subtle', fontWeight: 'font.weight.bold', marginBlockEnd: 'space.100' })}>Request type</Box>
              <Select
                inputId="requestType"
                placeholder={project ? 'Select a request type' : 'Select a project first'}
                options={
                  project?.value === 'CDR'
                    ? remediationRequest
                    : project?.value === 'CDI'
                      ? ingestionRemediation
                      : project?.value === 'CWP'
                        ? privacyRequestGdpr
                        : []
                }
                value={project ? requestType : null}
                onChange={(opt) => setRequestType(opt)}
                isDisabled={!project}
                isClearable
              />
            </Box>

            <Box xcss={actionsStyles}>
              <Button appearance="primary" type="submit" isDisabled={!project || !requestType}>
                Continue
              </Button>
            </Box>
          </form>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
