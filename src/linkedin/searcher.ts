import { chromium, Browser, Page } from 'playwright';
import { Contact } from '../contacts/types.js';
import { LinkedInProfile } from './types.js';
import * as cheerio from 'cheerio';

export class LinkedInSearcher {
  private browser?: Browser;
  private isInitialized = false;

  /**
   * Initialize the browser instance
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    this.isInitialized = true;
  }

  /**
   * Close the browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.isInitialized = false;
    }
  }

  /**
   * Search for LinkedIn profiles matching a contact
   */
  async searchLinkedInProfiles(contact: Contact): Promise<LinkedInProfile[]> {
    await this.initialize();

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const queries = this.buildSearchQueries(contact);
    const allProfiles: LinkedInProfile[] = [];
    const seenUrls = new Set<string>();

    for (const query of queries) {
      const profiles = await this.executeGoogleSearch(query);

      // Deduplicate profiles
      for (const profile of profiles) {
        if (!seenUrls.has(profile.url)) {
          seenUrls.add(profile.url);
          allProfiles.push(profile);
        }
      }

      // Add a small delay to avoid rate limiting
      await this.delay(2000 + Math.random() * 1000);
    }

    return allProfiles;
  }

  /**
   * Build search queries for a contact
   */
  private buildSearchQueries(contact: Contact): string[] {
    const queries: string[] = [];

    // Query 1: Name + Company
    if (contact.fullName && contact.company) {
      queries.push(
        `site:linkedin.com/in/ "${contact.fullName}" "${contact.company}"`
      );
    }

    // Query 2: Name + Location
    if (contact.fullName && contact.location) {
      queries.push(
        `site:linkedin.com/in/ "${contact.fullName}" "${contact.location}"`
      );
    }

    // Query 3: Name + Job Title
    if (contact.fullName && contact.jobTitle) {
      queries.push(
        `site:linkedin.com/in/ "${contact.fullName}" "${contact.jobTitle}"`
      );
    }

    // Query 4: Just name (fallback)
    if (contact.fullName && queries.length === 0) {
      queries.push(`site:linkedin.com/in/ "${contact.fullName}"`);
    }

    // Limit to first 2 queries to avoid excessive searching
    return queries.slice(0, 2);
  }

  /**
   * Execute a Google search and extract LinkedIn profile URLs
   */
  private async executeGoogleSearch(query: string): Promise<LinkedInProfile[]> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();

    try {
      // Navigate to Google search
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait a bit for content to load
      await this.delay(1000);

      // Get the page content
      const content = await page.content();

      // Parse with Cheerio
      const $ = cheerio.load(content);
      const profiles: LinkedInProfile[] = [];

      // Extract LinkedIn URLs from search results
      $('a[href*="linkedin.com/in/"]').each((i, element) => {
        const href = $(element).attr('href');
        if (!href) return;

        // Extract the actual LinkedIn URL from Google's redirect
        let linkedInUrl = this.extractLinkedInUrl(href);
        if (!linkedInUrl) return;

        // Clean up the URL
        linkedInUrl = this.cleanLinkedInUrl(linkedInUrl);

        // Extract profile name from the search result
        const resultContainer = $(element).closest('.g, div[data-sokoban-container]');
        let name = resultContainer.find('h3').first().text();

        // If we can't find the name in the result, try to extract from the URL
        if (!name) {
          const urlParts = linkedInUrl.split('/in/');
          if (urlParts.length > 1) {
            name = urlParts[1]
              .split('/')[0]
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase());
          }
        }

        // Extract snippet that might contain headline/company
        const snippet = resultContainer.find('.VwiC3b, .yXK7lf').text();

        profiles.push({
          url: linkedInUrl,
          name: name.trim(),
          headline: snippet ? snippet.trim() : undefined,
        });
      });

      // Limit to top 10 results per query
      return profiles.slice(0, 10);
    } catch (error) {
      console.error(`Error searching Google for query: ${query}`, error);
      return [];
    } finally {
      await page.close();
    }
  }

  /**
   * Extract LinkedIn URL from Google redirect URL
   */
  private extractLinkedInUrl(href: string): string | null {
    // Check if it's a direct LinkedIn URL
    if (href.includes('linkedin.com/in/')) {
      return href;
    }

    // Try to extract from Google redirect URL
    try {
      const url = new URL(href, 'https://www.google.com');
      const actualUrl = url.searchParams.get('q') || url.searchParams.get('url');
      if (actualUrl && actualUrl.includes('linkedin.com/in/')) {
        return actualUrl;
      }
    } catch (e) {
      // Invalid URL, skip
    }

    return null;
  }

  /**
   * Clean and normalize LinkedIn URL
   */
  private cleanLinkedInUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Keep only the base profile URL without query params
      return `https://www.linkedin.com${urlObj.pathname.split('?')[0]}`;
    } catch (e) {
      return url;
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
