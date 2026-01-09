import { readFileSync } from 'fs';
import { Contact } from './types.js';
import vCardParser from 'vcard-parser';

export class ContactParser {
  /**
   * Parse a vCard file and return an array of contacts
   */
  parseVCard(filePath: string): Contact[] {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = vCardParser.parse(content);

    if (!parsed || typeof parsed !== 'object') {
      return [];
    }

    // vcard-parser returns an object with arrays of fields
    // We need to reconstruct individual contacts from parallel arrays
    const numContacts = parsed.fn?.length || 0;
    const contacts: Contact[] = [];

    for (let i = 0; i < numContacts; i++) {
      contacts.push(this.vCardToContact(parsed, i));
    }

    return contacts;
  }

  /**
   * Convert a parsed vCard object to our Contact interface
   * The parsed object contains arrays of all fields, indexed by contact
   */
  private vCardToContact(parsed: any, index: number): Contact {
    // Extract name components
    const n = parsed.n?.[index];
    const fn = parsed.fn?.[index]?.value || '';

    const lastName = n?.value?.[0] || '';
    const firstName = n?.value?.[1] || '';
    const fullName = fn || `${firstName} ${lastName}`.trim();

    // Extract emails
    const emails: string[] = [];
    if (parsed.email && parsed.email[index]) {
      const email = parsed.email[index];
      if (email.value) {
        emails.push(email.value);
      }
    }

    // Extract phone numbers
    const phoneNumbers: string[] = [];
    if (parsed.tel && parsed.tel[index]) {
      const tel = parsed.tel[index];
      if (tel.value) {
        phoneNumbers.push(tel.value);
      }
    }

    // Extract organization/company
    let company: string | undefined;
    if (parsed.org && parsed.org[index]) {
      const org = parsed.org[index];
      if (typeof org.value === 'string') {
        company = org.value;
      } else if (Array.isArray(org.value)) {
        company = org.value[0];
      }
    }

    // Extract job title
    const jobTitle = parsed.title?.[index]?.value;

    // Extract location from address
    let location: string | undefined;
    if (parsed.adr && parsed.adr[index]) {
      const adr = parsed.adr[index].value;
      if (Array.isArray(adr)) {
        // vCard address format: [post-office-box, extended-address, street, locality, region, postal-code, country]
        const [, , , locality, region, , country] = adr;
        const parts = [locality, region, country].filter(Boolean);
        if (parts.length > 0) {
          location = parts.join(', ');
        }
      }
    }

    // Generate a stable ID
    const id = `vcard-${index}-${fullName.toLowerCase().replace(/\s+/g, '-')}`;

    return {
      id,
      firstName,
      lastName,
      fullName,
      phoneNumbers,
      emails,
      company,
      jobTitle,
      location,
      source: 'vcard',
      raw: { index, fullName, company, jobTitle, location },
    };
  }

  /**
   * Parse JSON contact file
   */
  parseJSON(filePath: string): Contact[] {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    if (!Array.isArray(data)) {
      throw new Error('JSON file must contain an array of contacts');
    }

    return data.map((item: any, index: number) => ({
      id: item.id || `json-${index}`,
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      fullName: item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim(),
      phoneNumbers: item.phoneNumbers || [],
      emails: item.emails || [],
      company: item.company,
      jobTitle: item.jobTitle,
      location: item.location,
      source: 'vcard',
      raw: item,
    }));
  }

  /**
   * Auto-detect format and parse accordingly
   */
  parse(filePath: string, format?: 'vcard' | 'json'): Contact[] {
    // Auto-detect format based on file extension if not specified
    if (!format) {
      if (filePath.endsWith('.vcf')) {
        format = 'vcard';
      } else if (filePath.endsWith('.json')) {
        format = 'json';
      } else {
        // Try vCard by default
        format = 'vcard';
      }
    }

    switch (format) {
      case 'vcard':
        return this.parseVCard(filePath);
      case 'json':
        return this.parseJSON(filePath);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}
