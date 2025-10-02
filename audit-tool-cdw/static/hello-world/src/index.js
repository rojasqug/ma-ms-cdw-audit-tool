import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import AppProvider from '@atlaskit/app-provider';
import { Box, xcss } from '@atlaskit/primitives';
import * as bridge from '@forge/bridge';

import '@atlaskit/css-reset';
// Styles are handled via Atlaskit primitives/xcss within components

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[audit-tool-cdw] ErrorBoundary caught', error, info);
  }
  render() {
    if (this.state.hasError) {
      const errorWrap = xcss({ padding: 'space.300' });
      return (
        <Box xcss={errorWrap}>
          <h3>Something went wrong.</h3>
          <Box as="pre" style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</Box>
        </Box>
      );
    }
    return this.props.children;
  }
}

function Root() {
  const [mode, setMode] = useState('auto');

  useEffect(() => {
    let unsub = null;
    // Try to read theme from Forge host (Jira). Fallback to auto.
    (async () => {
      try {
        const ctx = await (bridge?.view?.getContext?.() ?? Promise.resolve(null));
        if (ctx && (ctx.theme === 'dark' || ctx.theme === 'light')) {
          setMode(ctx.theme);
        }
      } catch (_) {}

      // Listen for changes if available
      try {
        const off = bridge?.events?.on?.('themeChange', (e) => {
          if (e && (e.theme === 'dark' || e.theme === 'light')) setMode(e.theme);
        });
        if (typeof off === 'function') unsub = off;
      } catch (_) {}
    })();

    return () => { try { if (unsub) unsub(); } catch (_) {} };
  }, []);

  return (
    <ErrorBoundary>
      <AppProvider mode={mode}>
        <App />
      </AppProvider>
    </ErrorBoundary>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<Root />);
