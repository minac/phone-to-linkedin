import { writeFileSync } from 'fs';
import { Contact } from '../contacts/types.js';
import { Match } from '../linkedin/types.js';

export interface ContactWithMatches {
  contact: Contact;
  matches: Match[];
}

export class MarkdownGenerator {
  /**
   * Generate a markdown report with all contact matches
   */
  generateReport(
    contactsWithMatches: ContactWithMatches[],
    outputPath: string
  ): void {
    const content = this.buildMarkdownContent(contactsWithMatches);
    writeFileSync(outputPath, content, 'utf-8');
  }

  /**
   * Build the markdown content
   */
  private buildMarkdownContent(contactsWithMatches: ContactWithMatches[]): string {
    const lines: string[] = [];

    // Header
    lines.push('# LinkedIn Contact Matches');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString().split('T')[0]}`);
    lines.push('');

    // Summary
    const totalContacts = contactsWithMatches.length;
    const contactsWithMatchesCount = contactsWithMatches.filter(
      (cwm) => cwm.matches.length > 0
    ).length;
    const noMatches = totalContacts - contactsWithMatchesCount;

    lines.push('## Summary');
    lines.push(`- Total Contacts: ${totalContacts}`);
    lines.push(`- Contacts with Matches: ${contactsWithMatchesCount}`);
    lines.push(`- No Matches Found: ${noMatches}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // Individual contacts
    for (const { contact, matches } of contactsWithMatches) {
      lines.push(...this.buildContactSection(contact, matches));
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Build a section for a single contact
   */
  private buildContactSection(contact: Contact, matches: Match[]): string[] {
    const lines: string[] = [];

    // Contact header
    lines.push(`## ${contact.fullName}`);

    // Contact details
    const details: string[] = [];
    if (contact.company) {
      details.push(`**Company**: ${contact.company}`);
    }
    if (contact.jobTitle) {
      details.push(`**Job Title**: ${contact.jobTitle}`);
    }
    if (contact.location) {
      details.push(`**Location**: ${contact.location}`);
    }
    if (contact.emails.length > 0) {
      details.push(`**Email**: ${contact.emails[0]}`);
    }

    if (details.length > 0) {
      lines.push(details.join(' | '));
      lines.push('');
    }

    // Matches
    if (matches.length === 0) {
      lines.push('*No LinkedIn matches found*');
      return lines;
    }

    lines.push(`### Top ${Math.min(matches.length, 3)} Matches:`);
    lines.push('');

    for (let i = 0; i < Math.min(matches.length, 3); i++) {
      const match = matches[i];
      lines.push(...this.buildMatchEntry(match, i + 1));
      lines.push('');
    }

    return lines;
  }

  /**
   * Build a match entry
   */
  private buildMatchEntry(match: Match, index: number): string[] {
    const lines: string[] = [];

    // Match header with score and confidence
    const emoji = this.getConfidenceEmoji(match.confidenceLevel);
    lines.push(
      `#### ${index}. [${match.profileName}](${match.linkedInUrl}) - Score: ${match.score}/100 ${emoji} ${match.confidenceLevel} Confidence`
    );

    // Profile details
    if (match.profileHeadline) {
      lines.push(`- **Headline**: ${match.profileHeadline}`);
    }
    if (match.profileCompany) {
      lines.push(`- **Company**: ${match.profileCompany}`);
    }
    if (match.profileLocation) {
      lines.push(`- **Location**: ${match.profileLocation}`);
    }

    // Match reasons
    if (match.matchReasons.length > 0) {
      lines.push('- **Match Reasons**:');
      for (const reason of match.matchReasons) {
        lines.push(`  - ${reason}`);
      }
    }

    return lines;
  }

  /**
   * Get emoji for confidence level
   */
  private getConfidenceEmoji(level: Match['confidenceLevel']): string {
    switch (level) {
      case 'Very High':
        return '⭐⭐⭐';
      case 'High':
        return '⭐⭐';
      case 'Medium':
        return '⭐';
      case 'Low':
        return '❓';
      case 'Very Low':
        return '❔';
      default:
        return '';
    }
  }
}
