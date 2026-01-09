import ora from 'ora';
import chalk from 'chalk';
import { ContactParser } from './contacts/parser.js';
import { LinkedInSearcher } from './linkedin/searcher.js';
import { ContactMatcher } from './matching/matcher.js';
import { MarkdownGenerator, ContactWithMatches } from './output/markdown.js';
import { CacheManager } from './cache/cache-manager.js';
import { CLIOptions } from './cli.js';
import { Contact } from './contacts/types.js';
import { createMatchingConfig } from './matching/config.js';

export class PhoneToLinkedInApp {
  private parser: ContactParser;
  private searcher: LinkedInSearcher;
  private matcher: ContactMatcher;
  private generator: MarkdownGenerator;
  private cache: CacheManager;

  constructor(googleApiKey?: string, googleSearchEngineId?: string) {
    this.parser = new ContactParser();
    this.searcher = new LinkedInSearcher(googleApiKey, googleSearchEngineId);
    this.matcher = new ContactMatcher();
    this.generator = new MarkdownGenerator();
    this.cache = new CacheManager();
  }

  /**
   * Configure the matcher with CLI options
   */
  private configureMatcher(options: CLIOptions): void {
    const config = createMatchingConfig({
      algorithm: options.algorithm,
      weights: {
        email: options.emailWeight ?? 50,
        name: options.nameWeight ?? 30,
        company: options.companyWeight ?? 15,
        location: options.locationWeight ?? 10,
        jobTitle: options.jobTitleWeight ?? 5,
      },
      nameThreshold: options.nameThreshold ?? 0.7,
      companyThreshold: options.companyThreshold ?? 0.6,
    });

    this.matcher.setConfig(config);

    // Log matching configuration if any custom weights are set
    const hasCustomWeights =
      options.algorithm ||
      options.emailWeight ||
      options.nameWeight ||
      options.companyWeight ||
      options.locationWeight ||
      options.jobTitleWeight ||
      options.nameThreshold ||
      options.companyThreshold;

    if (hasCustomWeights) {
      console.log(chalk.cyan('Matching Configuration:'));
      console.log(chalk.gray(`  Algorithm: ${config.algorithm}`));
      console.log(chalk.gray(`  Weights: Email=${config.weights.email}, Name=${config.weights.name}, Company=${config.weights.company}, Location=${config.weights.location}, JobTitle=${config.weights.jobTitle}`));
      console.log(chalk.gray(`  Thresholds: Name=${config.nameThreshold}, Company=${config.companyThreshold}\n`));
    }
  }

  /**
   * Main application flow
   */
  async run(options: CLIOptions): Promise<void> {
    console.log(chalk.cyan('\n🚀 Starting Phone-to-LinkedIn search...\n'));

    try {
      // Configure matching algorithm
      this.configureMatcher(options);

      // Step 1: Parse contacts
      const contacts = await this.parseContacts(options);
      console.log(chalk.green(`✓ Parsed ${contacts.length} contacts\n`));

      // Apply filter if specified
      const filteredContacts = this.filterContacts(contacts, options.filter);
      if (filteredContacts.length !== contacts.length) {
        console.log(
          chalk.yellow(
            `  Filtered to ${filteredContacts.length} contacts matching "${options.filter}"\n`
          )
        );
      }

      if (filteredContacts.length === 0) {
        console.log(chalk.yellow('No contacts to process.'));
        return;
      }

      // Dry run mode
      if (options.dryRun) {
        this.showDryRun(filteredContacts);
        return;
      }

      // Step 2: Search LinkedIn for each contact
      const contactsWithMatches = await this.searchAndMatchContacts(
        filteredContacts,
        options
      );

      // Step 3: Generate output
      this.generator.generateReport(contactsWithMatches, options.output);
      console.log(
        chalk.green(`\n✓ Report generated: ${chalk.bold(options.output)}\n`)
      );

      // Show summary
      this.showSummary(contactsWithMatches);
    } finally {
      // Clean up
      await this.searcher.close();
    }
  }

  /**
   * Parse contacts from input files
   */
  private async parseContacts(options: CLIOptions): Promise<Contact[]> {
    const spinner = ora('Parsing contact files...').start();
    const allContacts: Contact[] = [];

    try {
      for (const inputFile of options.input!) {
        // Filter out unsupported formats
        const format =
          options.format === 'whatsapp-chat' ? undefined : options.format;
        const contacts = this.parser.parse(inputFile, format);
        allContacts.push(...contacts);
      }

      spinner.succeed(`Parsed ${allContacts.length} contacts`);
      return allContacts;
    } catch (error) {
      spinner.fail('Failed to parse contacts');
      throw error;
    }
  }

  /**
   * Filter contacts by name
   */
  private filterContacts(contacts: Contact[], filter?: string): Contact[] {
    if (!filter) return contacts;

    const lowerFilter = filter.toLowerCase();
    return contacts.filter((contact) =>
      contact.fullName.toLowerCase().includes(lowerFilter)
    );
  }

  /**
   * Show what would be searched in dry run mode
   */
  private showDryRun(contacts: Contact[]): void {
    console.log(chalk.cyan('Dry Run - Contacts that would be searched:\n'));

    for (let i = 0; i < Math.min(contacts.length, 10); i++) {
      const contact = contacts[i];
      console.log(chalk.bold(`${i + 1}. ${contact.fullName}`));
      if (contact.company) console.log(`   Company: ${contact.company}`);
      if (contact.jobTitle) console.log(`   Title: ${contact.jobTitle}`);
      if (contact.location) console.log(`   Location: ${contact.location}`);
      console.log('');
    }

    if (contacts.length > 10) {
      console.log(chalk.gray(`... and ${contacts.length - 10} more contacts`));
    }
  }

  /**
   * Search LinkedIn and match contacts
   */
  private async searchAndMatchContacts(
    contacts: Contact[],
    options: CLIOptions
  ): Promise<ContactWithMatches[]> {
    const results: ContactWithMatches[] = [];
    let processed = 0;
    let cacheHits = 0;

    console.log(chalk.cyan(`Searching LinkedIn for ${contacts.length} contacts...\n`));

    for (const contact of contacts) {
      processed++;
      const progress = `[${processed}/${contacts.length}]`;

      // Check cache first
      let profiles = options.useCache ? this.cache.get(contact) : undefined;

      if (profiles) {
        cacheHits++;
        console.log(
          chalk.gray(`${progress} ${contact.fullName} (cached) - ${profiles.length} profiles`)
        );
      } else {
        const spinner = ora(`${progress} Searching for ${contact.fullName}...`).start();

        try {
          profiles = await this.searcher.searchLinkedInProfiles(contact);

          // Cache the results
          if (options.useCache) {
            this.cache.set(contact, profiles);
          }

          spinner.succeed(
            `${progress} ${contact.fullName} - Found ${profiles.length} profiles`
          );
        } catch (error) {
          spinner.fail(`${progress} ${contact.fullName} - Search failed`);
          console.error(chalk.red(`  Error: ${error}`));
          profiles = [];
        }
      }

      // Match and score profiles
      let matches = this.matcher.matchContact(contact, profiles);

      // Filter by minimum score
      matches = matches.filter((match) => match.score >= options.minScore);

      // Limit to top N matches
      matches = matches.slice(0, options.limit);

      results.push({
        contact,
        matches,
      });

      // Small delay between contacts to avoid rate limiting
      if (processed < contacts.length && !profiles) {
        await this.delay(2000);
      }
    }

    if (cacheHits > 0) {
      console.log(chalk.gray(`\n  (Used cached results for ${cacheHits} contacts)`));
    }

    return results;
  }

  /**
   * Show summary statistics
   */
  private showSummary(contactsWithMatches: ContactWithMatches[]): void {
    const total = contactsWithMatches.length;
    const withMatches = contactsWithMatches.filter((cwm) => cwm.matches.length > 0).length;
    const noMatches = total - withMatches;

    console.log(chalk.cyan('Summary:'));
    console.log(`  Total Contacts: ${total}`);
    console.log(chalk.green(`  ✓ With Matches: ${withMatches}`));
    if (noMatches > 0) {
      console.log(chalk.yellow(`  ✗ No Matches: ${noMatches}`));
    }

    // Show confidence distribution
    const confidenceCounts = {
      'Very High': 0,
      High: 0,
      Medium: 0,
      Low: 0,
      'Very Low': 0,
    };

    for (const { matches } of contactsWithMatches) {
      for (const match of matches) {
        confidenceCounts[match.confidenceLevel]++;
      }
    }

    console.log(chalk.cyan('\nMatch Quality:'));
    if (confidenceCounts['Very High'] > 0)
      console.log(chalk.green(`  ⭐⭐⭐ Very High: ${confidenceCounts['Very High']}`));
    if (confidenceCounts['High'] > 0)
      console.log(chalk.green(`  ⭐⭐ High: ${confidenceCounts['High']}`));
    if (confidenceCounts['Medium'] > 0)
      console.log(chalk.yellow(`  ⭐ Medium: ${confidenceCounts['Medium']}`));
    if (confidenceCounts['Low'] > 0)
      console.log(chalk.gray(`  ❓ Low: ${confidenceCounts['Low']}`));
    if (confidenceCounts['Very Low'] > 0)
      console.log(chalk.gray(`  ❔ Very Low: ${confidenceCounts['Very Low']}`));

    console.log('');
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
