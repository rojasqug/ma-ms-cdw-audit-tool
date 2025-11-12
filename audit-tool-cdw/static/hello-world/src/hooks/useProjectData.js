/**
 * useProjectData Hook
 * Generic hook for fetching issue data from backend resolvers
 */

import { useState, useEffect, useCallback } from 'react';
import * as bridge from '@forge/bridge';
import { getResolverName, getResolverPayload } from '../config/resolvers';

export function useProjectData(projectKey, issueType, extraParams = {}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  const fetchData = useCallback(async () => {
    if (!projectKey || !issueType) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const resolverName = getResolverName(projectKey, issueType);
      const basePayload = getResolverPayload(projectKey, issueType);
      
      // Merge extra parameters (like date range) into payload
      const payload = { ...basePayload, ...extraParams };

      console.log(`[useProjectData] Calling resolver: ${resolverName}`, payload);

      const response = await bridge.invoke(resolverName, payload);

      if (response?.error) {
        throw new Error(response.error);
      }

      // Handle different response formats
      // Legacy resolvers return { issues: [] }
      // Tree resolvers return { items: [] }
      const issues = response?.issues || response?.items || [];
      
      console.log(`[useProjectData] Received ${issues.length} issues`);
      setData(issues);
    } catch (err) {
      console.error('[useProjectData] Error fetching data:', err);
      setError(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [projectKey, issueType, JSON.stringify(extraParams)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    data,
    refresh: fetchData,
  };
}
