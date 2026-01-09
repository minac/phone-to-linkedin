import { chromium, Browser, Page } from 'playwright';
import { Contact } from '../contacts/types.js';
import { LinkedInProfile } from './types.js';
import * as cheerio from 'cheerio';
import axios from 'axios';

export class LinkedInSearcher {
  private browser?: Browser;
  private isInitialized = false;
  private googleApiKey?: string;
  private googleSearchEngineId?: string;

  constructor(googleApiKey?: string, googleSearchEngineId?: string) {
    this.googleApiKey = googleApiKey;
    this.googleSearchEngineId = googleSearchEngineId;
  }

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
      // Try Google Custom Search API first if credentials are available
      let profiles: LinkedInProfile[] = [];

      if (this.googleApiKey && this.googleSearchEngineId) {
        profiles = await this.executeGoogleCustomSearch(query);
      }

      // Fallback to web scraping if API search fails or returns no results
      if (profiles.length === 0) {
        profiles = await this.executeGoogleSearch(query);
      }

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

    // Scrape detailed information from the top LinkedIn profiles
    const enrichedProfiles = await this.enrichProfilesWithLinkedInData(allProfiles);

    return enrichedProfiles;
  }

  /**
   * Enrich profiles by scraping actual LinkedIn pages
   */
  private async enrichProfilesWithLinkedInData(
    profiles: LinkedInProfile[]
  ): Promise<LinkedInProfile[]> {
    const enrichedProfiles: LinkedInProfile[] = [];

    // Limit to top 20 profiles to avoid excessive scraping
    const profilesToScrape = profiles.slice(0, 20);

    for (const profile of profilesToScrape) {
      try {
        const scrapedData = await this.scrapeLinkedInProfile(profile.url);
        enrichedProfiles.push({
          ...profile,
          ...scrapedData,
        });

        // Add delay to be respectful
        await this.delay(1500 + Math.random() * 1000);
      } catch (error) {
        console.error(`Failed to scrape ${profile.url}:`, error);
        // Keep the original profile data if scraping fails
        enrichedProfiles.push(profile);
      }
    }

    return enrichedProfiles;
  }

  /**
   * Scrape a LinkedIn profile page for detailed information
   */
  private async scrapeLinkedInProfile(url: string): Promise<Partial<LinkedInProfile>> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    const profileData: Partial<LinkedInProfile> = {};

    try {
      // Navigate to the LinkedIn profile
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

      // Wait for content to load
      await this.delay(2000);

      // Get the page content
      const content = await page.content();
      const $ = cheerio.load(content);

      // Extract name (multiple selectors for different LinkedIn layouts)
      const name =
        $('h1.text-heading-xlarge').first().text().trim() ||
        $('h1.top-card-layout__title').first().text().trim() ||
        $('.pv-text-details__left-panel h1').first().text().trim() ||
        $('h1').first().text().trim();

      if (name) {
        profileData.name = name;
      }

      // Extract headline
      const headline =
        $('.text-body-medium.break-words').first().text().trim() ||
        $('.top-card-layout__headline').first().text().trim() ||
        $('.pv-text-details__left-panel .text-body-medium').first().text().trim();

      if (headline) {
        profileData.headline = headline;
      }

      // Extract location
      const location =
        $('.text-body-small.inline.t-black--light.break-words').first().text().trim() ||
        $('.top-card-layout__location').first().text().trim() ||
        $('.pv-text-details__left-panel .text-body-small').first().text().trim();

      if (location) {
        profileData.location = location;
      }

      // Extract current company from experience section
      const experienceSection = $('#experience').parent();
      const firstExperience = experienceSection.find('li').first();
      const company =
        firstExperience.find('.t-14.t-normal span[aria-hidden="true"]').first().text().trim() ||
        firstExperience.find('.t-14.t-normal').first().text().trim();

      if (company) {
        profileData.company = company;
      }

      // If company not found in experience, try to extract from headline
      if (!profileData.company && headline) {
        const companyMatch = headline.match(/(?:at|@)\s+([^|•]+)/i);
        if (companyMatch) {
          profileData.company = companyMatch[1].trim();
        }
      }

      return profileData;
    } catch (error) {
      console.error(`Error scraping LinkedIn profile ${url}:`, error);
      return profileData;
    } finally {
      await page.close();
    }
  }

  /**
   * Build search queries for a contact
   */
  private buildSearchQueries(contact: Contact): string[] {
    const queries: string[] = [];

    // Query 1: Name + Company (highest priority)
    if (contact.fullName && contact.company) {
      queries.push(
        `site:linkedin.com/in/ "${contact.fullName}" "${contact.company}"`
      );
    }

    // Query 2: Name + Job Title
    if (contact.fullName && contact.jobTitle) {
      queries.push(
        `site:linkedin.com/in/ "${contact.fullName}" "${contact.jobTitle}"`
      );
    }

    // Query 3: Name + Location
    if (contact.fullName && contact.location) {
      queries.push(
        `site:linkedin.com/in/ "${contact.fullName}" "${contact.location}"`
      );
    }

    // Query 4: Name + Company (without quotes for fuzzy matching)
    if (contact.fullName && contact.company && queries.length < 3) {
      queries.push(
        `site:linkedin.com/in/ ${contact.fullName} ${contact.company}`
      );
    }

    // Query 5: Just name (fallback)
    if (contact.fullName && queries.length === 0) {
      queries.push(`site:linkedin.com/in/ "${contact.fullName}"`);
    }

    // Return up to 3 queries to balance thoroughness and speed
    return queries.slice(0, 3);
  }

  /**
   * Execute a Google Custom Search API query
   */
  private async executeGoogleCustomSearch(query: string): Promise<LinkedInProfile[]> {
    if (!this.googleApiKey || !this.googleSearchEngineId) {
      return [];
    }

    try {
      const url = 'https://www.googleapis.com/customsearch/v1';
      const params = {
        key: this.googleApiKey,
        cx: this.googleSearchEngineId,
        q: query,
        num: 10, // Max results per query
      };

      const response = await axios.get(url, { params, timeout: 10000 });
      const profiles: LinkedInProfile[] = [];

      if (response.data.items) {
        for (const item of response.data.items) {
          const linkedInUrl = item.link;

          // Verify it's a LinkedIn profile URL
          if (!linkedInUrl || !linkedInUrl.includes('linkedin.com/in/')) {
            continue;
          }

          // Extract name from title or URL
          let name = item.title || '';

          // Remove common suffixes from title
          name = name.replace(/\s*-\s*LinkedIn.*$/i, '').trim();

          if (!name) {
            const urlParts = linkedInUrl.split('/in/');
            if (urlParts.length > 1) {
              name = urlParts[1]
                .split('/')[0]
                .replace(/-/g, ' ')
                .replace(/\b\w/g, (l: string) => l.toUpperCase());
            }
          }

          profiles.push({
            url: this.cleanLinkedInUrl(linkedInUrl),
            name: name.trim(),
            headline: item.snippet || undefined,
          });
        }
      }

      return profiles;
    } catch (error) {
      console.error(`Error using Google Custom Search API for query: ${query}`, error);
      return [];
    }
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
      // Set a realistic user agent to avoid blocking
      await page.setExtraHTTPHeaders({
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      });

      // Navigate to Google search
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait a bit for content to load
      await this.delay(1500);

      // Get the page content
      const content = await page.content();

      // Parse with Cheerio
      const $ = cheerio.load(content);
      const profiles: LinkedInProfile[] = [];
      const seenUrls = new Set<string>();

      // Extract LinkedIn URLs from search results using multiple selectors
      const linkSelectors = [
        'a[href*="linkedin.com/in/"]',
        'a[href*="/url?"]', // Google redirect links
        'div.g a',
        'div[data-sokoban-container] a',
      ];

      for (const selector of linkSelectors) {
        $(selector).each((i, element) => {
          const href = $(element).attr('href');
          if (!href || !href.includes('linkedin.com/in/')) return;

          // Extract the actual LinkedIn URL from Google's redirect
          let linkedInUrl = this.extractLinkedInUrl(href);
          if (!linkedInUrl || seenUrls.has(linkedInUrl)) return;

          seenUrls.add(linkedInUrl);

          // Clean up the URL
          linkedInUrl = this.cleanLinkedInUrl(linkedInUrl);

          // Extract profile name from the search result
          const resultContainer = $(element).closest('.g, div[data-sokoban-container], div[data-hveid]');
          let name = resultContainer.find('h3').first().text();

          // If we can't find the name in the result, try to extract from the URL
          if (!name || name.length < 2) {
            const urlParts = linkedInUrl.split('/in/');
            if (urlParts.length > 1) {
              name = urlParts[1]
                .split('/')[0]
                .replace(/-/g, ' ')
                .replace(/\b\w/g, (l: string) => l.toUpperCase());
            }
          }

          // Extract snippet that might contain headline/company
          const snippet =
            resultContainer.find('.VwiC3b').text() ||
            resultContainer.find('.yXK7lf').text() ||
            resultContainer.find('.st').text() ||
            resultContainer.find('span.aCOpRe').text();

          profiles.push({
            url: linkedInUrl,
            name: name.trim(),
            headline: snippet ? snippet.trim() : undefined,
          });
        });
      }

      // Limit to top 15 results per query
      return profiles.slice(0, 15);
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
