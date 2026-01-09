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
  };
}
