/**
 * Main Forge Resolver Entry Point
 * Pure orchestrator - registers all resolver functions
 * All business logic is delegated to resolvers/ and services/
 */

import Resolver from '@forge/resolver';
import * as IssueResolvers from './resolvers/issueResolver.js';
import * as HistoryResolvers from './resolvers/historyResolver.js';
import * as PdfResolvers from './resolvers/pdfResolver.js';

const resolver = new Resolver();

// Register generic issue search resolver
resolver.define('searchIssues', IssueResolvers.searchIssues);

// Register legacy resolvers for backward compatibility
resolver.define('searchCDROpenRemediation', IssueResolvers.searchCDROpenRemediation);
resolver.define('searchCDIOpenIngestion', IssueResolvers.searchCDIOpenIngestion);

// Register GDPR tree resolver
resolver.define('searchCwpGdprTree', IssueResolvers.searchCwpGdprTree);

// Register history resolver
resolver.define('getIssueStatusHistory', HistoryResolvers.getIssueStatusHistory);

// Register comments and activity resolvers
resolver.define('getIssueComments', IssueResolvers.getIssueComments);
resolver.define('getIssueActivity', IssueResolvers.getIssueActivity);

// Register PDF report resolver
resolver.define('generateGDPRPdfReport', PdfResolvers.generateGDPRPdfReport);

export const handler = resolver.getDefinitions();

