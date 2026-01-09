import { Contact } from '../contacts/types.js';
import { LinkedInProfile, Match } from '../linkedin/types.js';
import { MatchingConfig, DEFAULT_MATCHING_CONFIG } from './config.js';
import {
  matchNames,
  matchCompanies,
  matchLocations,
  matchJobTitles,
  areNameVariations,
} from './fuzzy.js';

/**
 * Detailed score breakdown for a match
 */
interface ScoreBreakdown {
  email: number;
  name: number;
  company: number;
  location: number;
  jobTitle: number;
  total: number;
}

export class ContactMatcher {
  private config: MatchingConfig;

  constructor(config: MatchingConfig = DEFAULT_MATCHING_CONFIG) {
    this.config = config;
  }

  /**
   * Update the matching configuration
   */
  setConfig(config: MatchingConfig): void {
    this.config = config;
  }

  /**
   * Match a contact with LinkedIn profiles and return scored matches
   */
  matchContact(contact: Contact, profiles: LinkedInProfile[]): Match[] {
    const matches: Match[] = [];

    for (const profile of profiles) {
      const breakdown = this.scoreMatch(contact, profile);
      const matchReasons = this.getMatchReasons(contact, profile, breakdown);
      const confidenceLevel = this.getConfidenceLevel(breakdown.total);

      matches.push({
        contact,
        linkedInUrl: profile.url,
        profileName: profile.name,
        profileHeadline: profile.headline,
        profileCompany: profile.company,
        profileLocation: profile.location,
        score: breakdown.total,
        matchReasons,
        confidenceLevel,
      });
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return matches;
  }

  /**
   * Score a match between a contact and a LinkedIn profile with detailed breakdown
   */
  private scoreMatch(contact: Contact, profile: LinkedInProfile): ScoreBreakdown {
    const breakdown: ScoreBreakdown = {
      email: 0,
      name: 0,
      company: 0,
      location: 0,
      jobTitle: 0,
      total: 0,
    };

    // Email match (0-50 points by default) - HIGHEST PRIORITY
    if (contact.emails.length && profile.email) {
      breakdown.email = this.emailMatchScore(contact.emails, profile.email);
    }

    // Name similarity (0-30 points by default)
    breakdown.name = this.nameMatchScore(contact.fullName, profile.name);

    // Company match (0-15 points by default)
    if (contact.company && profile.company) {
      breakdown.company = this.companyMatchScore(contact.company, profile.company);
    }

    // Location match (0-10 points by default)
    if (contact.location && profile.location) {
      breakdown.location = this.locationMatchScore(contact.location, profile.location);
    }

    // Job title/headline similarity (0-5 points by default)
    if (contact.jobTitle && profile.headline) {
      breakdown.jobTitle = this.titleMatchScore(contact.jobTitle, profile.headline);
    }

    breakdown.total = Math.round(
      breakdown.email +
        breakdown.name +
        breakdown.company +
        breakdown.location +
        breakdown.jobTitle
    );

    return breakdown;
  }

  /**
   * Calculate email match score
   */
  private emailMatchScore(contactEmails: string[], profileEmail: string): number {
    const maxScore = this.config.weights.email;

    // Exact email match: full points
    for (const email of contactEmails) {
      if (email.toLowerCase() === profileEmail.toLowerCase()) {
        return maxScore;
      }
    }

    // Same domain match: half points
    const profileDomain = profileEmail.split('@')[1]?.toLowerCase();
    for (const email of contactEmails) {
      const contactDomain = email.split('@')[1]?.toLowerCase();
      if (contactDomain && profileDomain && contactDomain === profileDomain) {
        return maxScore * 0.5;
      }
    }

    return 0;
  }

  /**
   * Calculate name match score using enhanced fuzzy matching
   */
  private nameMatchScore(name1: string, name2: string): number {
    if (!name1 || !name2) return 0;

    const similarity = matchNames(name1, name2, this.config.algorithm);
    const maxScore = this.config.weights.name;

    // Apply threshold
    if (similarity < this.config.nameThreshold) {
      return 0;
    }

    return similarity * maxScore;
  }

  /**
   * Calculate company match score using enhanced matching
   */
  private companyMatchScore(company1: string, company2: string): number {
    if (!company1 || !company2) return 0;

    const similarity = matchCompanies(company1, company2, this.config.algorithm);
    const maxScore = this.config.weights.company;

    // Apply threshold
    if (similarity < this.config.companyThreshold) {
      return 0;
    }

    return similarity * maxScore;
  }

  /**
   * Calculate location match score using enhanced matching
   */
  private locationMatchScore(location1: string, location2: string): number {
    if (!location1 || !location2) return 0;

    const similarity = matchLocations(location1, location2, this.config.algorithm);
    const maxScore = this.config.weights.location;

    return similarity * maxScore;
  }

  /**
   * Calculate job title match score using enhanced matching
   */
  private titleMatchScore(title: string, headline: string): number {
    if (!title || !headline) return 0;

    const similarity = matchJobTitles(title, headline, this.config.algorithm);
    const maxScore = this.config.weights.jobTitle;

    return similarity * maxScore;
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
   * Generate detailed match reasons with score breakdown
   */
  private getMatchReasons(
    contact: Contact,
    profile: LinkedInProfile,
    breakdown: ScoreBreakdown
  ): string[] {
    const reasons: string[] = [];

    // Email match details
    if (breakdown.email > 0) {
      const emailScore = Math.round(breakdown.email);
      if (breakdown.email >= this.config.weights.email) {
        reasons.push(`✓ Exact email match (+${emailScore} points)`);
      } else {
        reasons.push(`✓ Same email domain (+${emailScore} points)`);
      }
    }

    // Name match details
    if (breakdown.name > 0) {
      const nameScore = Math.round(breakdown.name);
      const nameSimilarity = matchNames(contact.fullName, profile.name, this.config.algorithm);

      // Check for name variations
      const parts1 = contact.fullName.toLowerCase().split(/\s+/);
      const parts2 = profile.name.toLowerCase().split(/\s+/);
      const hasVariation =
        parts1.length > 0 &&
        parts2.length > 0 &&
        areNameVariations(parts1[0], parts2[0]);

      if (nameSimilarity >= 0.95) {
        reasons.push(`✓ Exact name match (+${nameScore} points)`);
      } else if (hasVariation) {
        reasons.push(
          `✓ Name variation match: ${contact.fullName} ↔ ${profile.name} (+${nameScore} points)`
        );
      } else {
        const percentage = Math.round(nameSimilarity * 100);
        reasons.push(`✓ Similar name (${percentage}% match, +${nameScore} points)`);
      }
    }

    // Company match details
    if (breakdown.company > 0) {
      const companyScore = Math.round(breakdown.company);
      const companySimilarity = matchCompanies(
        contact.company!,
        profile.company!,
        this.config.algorithm
      );

      if (companySimilarity >= 0.95) {
        reasons.push(`✓ Company match: ${contact.company} (+${companyScore} points)`);
      } else {
        const percentage = Math.round(companySimilarity * 100);
        reasons.push(`✓ Similar company (${percentage}% match, +${companyScore} points)`);
      }
    }

    // Location match details
    if (breakdown.location > 0) {
      const locationScore = Math.round(breakdown.location);
      const locationSimilarity = matchLocations(
        contact.location!,
        profile.location!,
        this.config.algorithm
      );

      if (locationSimilarity >= 0.9) {
        reasons.push(`✓ Location match: ${contact.location} (+${locationScore} points)`);
      } else {
        const percentage = Math.round(locationSimilarity * 100);
        reasons.push(`✓ Similar location (${percentage}% match, +${locationScore} points)`);
      }
    }

    // Job title match details
    if (breakdown.jobTitle > 0) {
      const titleScore = Math.round(breakdown.jobTitle);
      const titleSimilarity = matchJobTitles(
        contact.jobTitle!,
        profile.headline!,
        this.config.algorithm
      );

      if (titleSimilarity >= 0.9) {
        reasons.push(`✓ Job title match (+${titleScore} points)`);
      } else {
        const percentage = Math.round(titleSimilarity * 100);
        reasons.push(`✓ Similar job title (${percentage}% match, +${titleScore} points)`);
      }
    }

    // Add score breakdown summary
    if (reasons.length > 0) {
      reasons.push(`Total Score: ${breakdown.total}/110 points`);
    } else {
      reasons.push('Low confidence match - minimal similarity found');
    }

    return reasons;
  }
}
