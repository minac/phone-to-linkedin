export interface LinkedInProfile {
  url: string;
  name: string;
  headline?: string;
  company?: string;
  location?: string;
  email?: string;
}

export interface Match {
  contact: Contact;
  linkedInUrl: string;
  profileName: string;
  profileHeadline?: string;
  profileCompany?: string;
  profileLocation?: string;
  score: number;
  matchReasons: string[];
  confidenceLevel: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
}

import { Contact } from '../contacts/types.js';
