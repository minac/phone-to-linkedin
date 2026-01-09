import NodeCache from 'node-cache';
import { createHash } from 'crypto';
import { Contact } from '../contacts/types.js';
import { LinkedInProfile } from '../linkedin/types.js';

export class CacheManager {
  private cache: NodeCache;

  constructor(ttlSeconds: number = 86400) {
    // Default TTL: 24 hours
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: 600, // Check for expired entries every 10 minutes
    });
  }

  /**
   * Generate a cache key for a contact
   */
  private generateKey(contact: Contact): string {
    // Use contact's name and company to generate a stable key
    const keyData = `${contact.fullName}-${contact.company || ''}-${contact.location || ''}`;
    return createHash('md5').update(keyData.toLowerCase()).digest('hex');
  }

  /**
   * Get cached profiles for a contact
   */
  get(contact: Contact): LinkedInProfile[] | undefined {
    const key = this.generateKey(contact);
    return this.cache.get<LinkedInProfile[]>(key);
  }

  /**
   * Set cached profiles for a contact
   */
  set(contact: Contact, profiles: LinkedInProfile[]): void {
    const key = this.generateKey(contact);
    this.cache.set(key, profiles);
  }

  /**
   * Check if contact has cached results
   */
  has(contact: Contact): boolean {
    const key = this.generateKey(contact);
    return this.cache.has(key);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }
}
