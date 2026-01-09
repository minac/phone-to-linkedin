#!/usr/bin/env node
import { Command } from 'commander';

export interface CLIOptions {
  input?: string[];
  format?: 'vcard' | 'json' | 'whatsapp-chat';
  source?: string;
  output: string;
  limit: number;
  minScore: number;
  filter?: string;
  dryRun: boolean;
  useCache: boolean;
  // Search API options
  googleApiKey?: string;
  googleSearchEngineId?: string;
  // Advanced matching options
  algorithm?: 'levenshtein' | 'jaro-winkler';
  emailWeight?: number;
  nameWeight?: number;
  companyWeight?: number;
  locationWeight?: number;
  jobTitleWeight?: number;
  nameThreshold?: number;
  companyThreshold?: number;
}

export function createCLI() {
  const program = new Command();

  program
    .name('phone-to-linkedin')
    .description('Find LinkedIn profiles for your contacts')
    .version('0.1.0')
    // Input options - vCard file is the recommended approach
    .option(
      '-i, --input <files...>',
      'Input contact files (vCard, JSON, WhatsApp chat). If not specified, will look for contacts.vcf in current directory'
    )
    .option(
      '--format <type>',
      'Input format: vcard, json, whatsapp-chat (auto-detected if not specified)'
    )
    // Legacy source option for direct extraction (future feature)
    .option(
      '-s, --source <sources>',
      'Contact sources for direct extraction (contacts,whatsapp) - requires system permissions',
      'contacts'
    )
    // Output options
    .option(
      '-o, --output <file>',
      'Output markdown file',
      'linkedin-matches.md'
    )
    // Matching options - optimized defaults for common use case
    .option(
      '-l, --limit <number>',
      'Number of matches per contact',
      '3'
    )
    .option(
      '-m, --min-score <number>',
      'Minimum match score (0-100)',
      '40'
    )
    // Filtering options
    .option(
      '-f, --filter <name>',
      'Filter contacts by name (partial match)'
    )
    // Execution options - cache enabled by default for common use case
    .option(
      '--dry-run',
      'Show what would be searched without executing',
      false
    )
    .option(
      '--use-cache',
      'Use cached search results to avoid redundant searches (recommended)',
      true
    )
    .option(
      '--no-cache',
      'Disable cache and force fresh searches'
    )
    // Search API options
    .option(
      '--google-api-key <key>',
      'Google Custom Search API key for enhanced search results (optional)'
    )
    .option(
      '--google-search-engine-id <id>',
      'Google Custom Search Engine ID (required if using API key)'
    )
    // Advanced matching options
    .option(
      '--algorithm <type>',
      'Matching algorithm: levenshtein or jaro-winkler (default: jaro-winkler)'
    )
    .option(
      '--email-weight <number>',
      'Weight for email matching (default: 50)'
    )
    .option(
      '--name-weight <number>',
      'Weight for name matching (default: 30)'
    )
    .option(
      '--company-weight <number>',
      'Weight for company matching (default: 15)'
    )
    .option(
      '--location-weight <number>',
      'Weight for location matching (default: 10)'
    )
    .option(
      '--job-title-weight <number>',
      'Weight for job title matching (default: 5)'
    )
    .option(
      '--name-threshold <number>',
      'Minimum name similarity threshold 0-1 (default: 0.7)'
    )
    .option(
      '--company-threshold <number>',
      'Minimum company similarity threshold 0-1 (default: 0.6)'
    );

  return program;
}

export function parseCLIOptions(program: Command): CLIOptions {
  const options = program.opts();

  return {
    input: options.input,
    format: options.format,
    source: options.source || 'contacts',
    output: options.output || 'linkedin-matches.md',
    limit: parseInt(options.limit || '3', 10),
    minScore: parseInt(options.minScore || '40', 10),
    filter: options.filter,
    dryRun: options.dryRun || false,
    // Handle --use-cache (default true) and --no-cache
    useCache: options.cache !== false,
    // Search API options
    googleApiKey: options.googleApiKey || process.env.GOOGLE_API_KEY,
    googleSearchEngineId: options.googleSearchEngineId || process.env.GOOGLE_SEARCH_ENGINE_ID,
    // Advanced matching options
    algorithm: options.algorithm as 'levenshtein' | 'jaro-winkler' | undefined,
    emailWeight: options.emailWeight ? parseFloat(options.emailWeight) : undefined,
    nameWeight: options.nameWeight ? parseFloat(options.nameWeight) : undefined,
    companyWeight: options.companyWeight ? parseFloat(options.companyWeight) : undefined,
    locationWeight: options.locationWeight ? parseFloat(options.locationWeight) : undefined,
    jobTitleWeight: options.jobTitleWeight ? parseFloat(options.jobTitleWeight) : undefined,
    nameThreshold: options.nameThreshold ? parseFloat(options.nameThreshold) : undefined,
    companyThreshold: options.companyThreshold ? parseFloat(options.companyThreshold) : undefined,
  };
}
