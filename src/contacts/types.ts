export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumbers: string[];
  emails: string[];
  company?: string;
  jobTitle?: string;
  location?: string;
  source: 'mac-contacts' | 'whatsapp' | 'vcard';
  raw: any;
}

export interface ContactParserOptions {
  format?: 'vcard' | 'json' | 'whatsapp-chat';
}
