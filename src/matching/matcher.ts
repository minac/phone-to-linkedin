import { distance } from 'fastest-levenshtein';
import { Contact } from '../contacts/types.js';
import { LinkedInProfile, Match } from '../linkedin/types.js';

export class ContactMatcher {
  /**
   * Match a contact with LinkedIn profiles and return scored matches
   */
  matchContact(contact: Contact, profiles: LinkedInProfile[]): Match[] {
    const matches: Match[] = [];

    for (const profile of profiles) {
      const score = this.scoreMatch(contact, profile);
      const matchReasons = this.getMatchReasons(contact, profile, score);
      const confidenceLevel = this.getConfidenceLevel(score);

      matches.push({
        contact,
        linkedInUrl: profile.url,
        profileName: profile.name,
        profileHeadline: profile.headline,
        profileCompany: profile.company,
        profileLocation: profile.location,
        score,
        matchReasons,
        confidenceLevel,
      });
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return matches;
  }

  /**
   * Score a match between a contact and a LinkedIn profile
   */
  private scoreMatch(contact: Contact, profile: LinkedInProfile): number {
    let score = 0;

    // Email domain match (0-50 points) - HIGHEST PRIORITY
    if (contact.emails.length && profile.email) {
      score += this.emailMatchScore(contact.emails, profile.email);
    }

    // Name similarity (0-30 points)
    score += this.nameMatchScore(contact.fullName, profile.name);

    // Company match (0-15 points)
    if (contact.company && profile.company) {
      score += this.companyMatchScore(contact.company, profile.company);
    }

    // Location match (0-10 points)
    if (contact.location && profile.location) {
      score += this.locationMatchScore(contact.location, profile.location);
    }

    // Job title/headline similarity (0-5 points)
    if (contact.jobTitle && profile.headline) {
      score += this.titleMatchScore(contact.jobTitle, profile.headline);
    }

    return Math.round(score);
  }

  /**
   * Calculate email match score
   */
  private emailMatchScore(contactEmails: string[], profileEmail: string): number {
    // Exact email match: 50 points
    for (const email of contactEmails) {
      if (email.toLowerCase() === profileEmail.toLowerCase()) {
        return 50;
      }
    }

    // Same domain match: 25 points
    const profileDomain = profileEmail.split('@')[1]?.toLowerCase();
    for (const email of contactEmails) {
      const contactDomain = email.split('@')[1]?.toLowerCase();
      if (contactDomain && profileDomain && contactDomain === profileDomain) {
        return 25;
      }
    }

    return 0;
  }

  /**
   * Calculate name match score using string similarity
   */
  private nameMatchScore(name1: string, name2: string): number {
    if (!name1 || !name2) return 0;

    const similarity = this.stringSimilarity(
      name1.toLowerCase().trim(),
      name2.toLowerCase().trim()
    );

    return similarity * 30;
  }

  /**
   * Calculate company match score
   */
  private companyMatchScore(company1: string, company2: string): number {
    if (!company1 || !company2) return 0;

    // Normalize company names
    const norm1 = this.normalizeCompanyName(company1);
    const norm2 = this.normalizeCompanyName(company2);

    if (norm1 === norm2) {
      return 15;
    }

    const similarity = this.stringSimilarity(norm1, norm2);
    return similarity * 15;
  }

  /**
   * Calculate location match score
   */
  private locationMatchScore(location1: string, location2: string): number {
    if (!location1 || !location2) return 0;

    const norm1 = location1.toLowerCase().trim();
    const norm2 = location2.toLowerCase().trim();

    // Check if one location contains the other
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      return 10;
    }

    const similarity = this.stringSimilarity(norm1, norm2);
    return similarity * 10;
  }

  /**
   * Calculate job title match score
   */
  private titleMatchScore(title: string, headline: string): number {
    if (!title || !headline) return 0;

    const norm1 = title.toLowerCase().trim();
    const norm2 = headline.toLowerCase().trim();

    // Check if headline contains the title
    if (norm2.includes(norm1)) {
      return 5;
    }

    const similarity = this.stringSimilarity(norm1, norm2);
    return similarity * 5;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   * Returns a value between 0 and 1
   */
  private stringSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;

    const dist = distance(str1, str2);
    return 1 - dist / maxLength;
  }

  /**
   * Normalize company name for comparison
   */
  private normalizeCompanyName(company: string): string {
    return company
      .toLowerCase()
      .trim()
      .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b\.?/g, '')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  /**
   * Get confidence level based on score
   */
  private getConfidenceLevel(score: number): Match['confidenceLevel'] {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Very Low';
  }

  /**
   * Generate match reasons for display
   */
  private getMatchReasons(
    contact: Contact,
    profile: LinkedInProfile,
    score: number
  ): string[] {
    const reasons: string[] = [];

    // Check email match
    if (contact.emails.length && profile.email) {
      for (const email of contact.emails) {
        if (email.toLowerCase() === profile.email.toLowerCase()) {
          reasons.push('Exact email match');
          break;
        }
      }
    }

    // Check name similarity
    const nameSimilarity = this.stringSimilarity(
      contact.fullName.toLowerCase(),
      profile.name.toLowerCase()
    );
    if (nameSimilarity > 0.9) {
      reasons.push('Exact name match');
    } else if (nameSimilarity > 0.7) {
      reasons.push(`Similar name (${Math.round(nameSimilarity * 100)}% match)`);
    }

    // Check company match
    if (contact.company && profile.company) {
      const norm1 = this.normalizeCompanyName(contact.company);
      const norm2 = this.normalizeCompanyName(profile.company);
      if (norm1 === norm2) {
        reasons.push(`Company match: ${contact.company}`);
      }
    }

    // Check location match
    if (contact.location && profile.location) {
      const norm1 = contact.location.toLowerCase();
      const norm2 = profile.location.toLowerCase();
      if (norm1.includes(norm2) || norm2.includes(norm1)) {
        reasons.push(`Location match: ${contact.location}`);
      }
    }

    // Check job title
    if (contact.jobTitle && profile.headline) {
      const norm1 = contact.jobTitle.toLowerCase();
      const norm2 = profile.headline.toLowerCase();
      if (norm2.includes(norm1)) {
        reasons.push(`Job title match: ${contact.jobTitle}`);
      }
    }

    if (reasons.length === 0) {
      reasons.push('Partial match based on available data');
    }

    return reasons;
  }
}
