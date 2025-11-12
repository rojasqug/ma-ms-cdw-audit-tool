/**
 * Resolver Configuration
 * Maps (projectKey, issueType) combinations to backend resolver names
 */

/**
 * Get the resolver name for fetching data
 */
export function getResolverName(projectKey, issueType) {
  const key = `${projectKey}_${issueType}`;
  
  const resolverMap = {
    'CDR_Remediation Request': 'searchCDROpenRemediation',
    'CDI_Remediation Request': 'searchIssues',
    'CDI_Ingestion': 'searchCDIOpenIngestion',
    'CWP_GDPR': 'searchCwpGdprTree',
  };
  
  return resolverMap[key] || 'searchIssues';
}

/**
 * Get payload for resolver call
 */
export function getResolverPayload(projectKey, issueType) {
  const resolverName = getResolverName(projectKey, issueType);
  
  // Legacy resolvers use projectKey in payload
  // Generic resolver uses both projectKey and issueType
  if (['searchCDROpenRemediation', 'searchCDIOpenIngestion', 'searchCwpGdprTree'].includes(resolverName)) {
    return { projectKey };
  }
  
  // Generic resolver
  return { projectKey, issueType };
}
