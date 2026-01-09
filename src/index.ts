#!/usr/bin/env node
import { createCLI, parseCLIOptions } from './cli.js';
import { existsSync } from 'fs';
import { resolve } from 'path';

async function main() {
  const program = createCLI();

  program.action(async () => {
    const options = parseCLIOptions(program);

    console.log('🔍 Phone-to-LinkedIn CLI\n');
    console.log('Configuration:');
    console.log(`  Input: ${options.input ? options.input.join(', ') : 'contacts.vcf (default)'}`);
    console.log(`  Output: ${options.output}`);
    console.log(`  Matches per contact: ${options.limit}`);
    console.log(`  Minimum score: ${options.minScore}`);
    console.log(`  Use cache: ${options.useCache ? 'Yes' : 'No'}`);

    if (options.filter) {
      console.log(`  Filter: ${options.filter}`);
    }

    if (options.dryRun) {
      console.log('\n⚠️  DRY RUN MODE - No searches will be executed\n');
    }

    console.log('\n' + '='.repeat(50));

    // Check for default input file
    if (!options.input) {
      const defaultFile = resolve(process.cwd(), 'contacts.vcf');
      if (existsSync(defaultFile)) {
        console.log(`\n✓ Found default input file: ${defaultFile}`);
        options.input = [defaultFile];
      } else {
        console.log('\n⚠️  No input file specified and contacts.vcf not found.');
        console.log('\nTo get started:');
        console.log('  1. Export contacts from Mac Contacts app:');
        console.log('     - Open Contacts.app');
        console.log('     - Select contacts (Cmd+A for all)');
        console.log('     - File → Export → Export vCard...');
        console.log('     - Save as contacts.vcf');
        console.log('  2. Run: phone-to-linkedin -i contacts.vcf');
        console.log('\nOr specify a custom input file:');
        console.log('  phone-to-linkedin -i /path/to/your/contacts.vcf');
        console.log('\nFor more options, run: phone-to-linkedin --help');
        process.exit(1);
      }
    }

    // Validate input files exist
    for (const inputFile of options.input) {
      if (!existsSync(inputFile)) {
        console.error(`\n❌ Error: Input file not found: ${inputFile}`);
        process.exit(1);
      }
    }

    console.log('\n📝 Implementation Status:');
    console.log('  This is a preliminary version with CLI setup complete.');
    console.log('  Core functionality (contact parsing, LinkedIn search, matching) is in development.');
    console.log('\n✓ CLI defaults are optimized for the most common use case:');
    console.log('  • Input: vCard file (exported from Mac Contacts)');
    console.log('  • Output: Markdown report (linkedin-matches.md)');
    console.log('  • Top 3 matches per contact');
    console.log('  • Minimum score: 40 (filters low-confidence matches)');
    console.log('  • Cache enabled (avoids redundant searches)');

    // TODO: Implement core functionality
    // 1. Parse vCard files
    // 2. Search LinkedIn via Google
    // 3. Match and score profiles
    // 4. Generate markdown output
  });

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
