import { distance } from 'fastest-levenshtein';

/**
 * Calculate Jaro-Winkler similarity between two strings
 * Returns a value between 0 and 1
 */
export function jaroWinklerSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  const jaro = jaroSimilarity(s1, s2);

  // Calculate common prefix up to 4 characters
  let prefix = 0;
  const maxPrefix = Math.min(4, s1.length, s2.length);
  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) {
      prefix++;
    } else {
      break;
    }
  }

  // Apply Winkler modification
  const p = 0.1; // Scaling factor for prefix
  return jaro + prefix * p * (1 - jaro);
}

/**
 * Calculate Jaro similarity between two strings
 * Helper function for Jaro-Winkler
 */
function jaroSimilarity(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0 && len2 === 0) return 1.0;
  if (len1 === 0 || len2 === 0) return 0.0;

  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Find transpositions
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (
    (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) /
    3.0
  );
}

/**
 * Calculate Levenshtein-based similarity
 * Returns a value between 0 and 1
 */
export function levenshteinSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;

  const dist = distance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - dist / maxLength;
}

/**
 * Calculate string similarity using the specified algorithm
 */
export function stringSimilarity(
  str1: string,
  str2: string,
  algorithm: 'levenshtein' | 'jaro-winkler' = 'jaro-winkler'
): number {
  if (algorithm === 'jaro-winkler') {
    return jaroWinklerSimilarity(str1, str2);
  }
  return levenshteinSimilarity(str1, str2);
}

/**
 * Common name nicknames and variations
 */
const NAME_VARIATIONS: Record<string, string[]> = {
  william: ['bill', 'will', 'billy', 'willy'],
  robert: ['rob', 'bob', 'bobby', 'robbie'],
  richard: ['rick', 'dick', 'rich', 'ricky'],
  james: ['jim', 'jimmy', 'jamie'],
  john: ['jack', 'johnny'],
  michael: ['mike', 'mikey', 'mick'],
  david: ['dave', 'davey'],
  joseph: ['joe', 'joey'],
  thomas: ['tom', 'tommy'],
  charles: ['charlie', 'chuck'],
  christopher: ['chris'],
  daniel: ['dan', 'danny'],
  matthew: ['matt', 'matty'],
  anthony: ['tony'],
  donald: ['don', 'donny'],
  steven: ['steve'],
  andrew: ['andy', 'drew'],
  joshua: ['josh'],
  kenneth: ['ken', 'kenny'],
  kevin: ['kev'],
  timothy: ['tim', 'timmy'],
  jonathan: ['jon', 'john'],
  nicholas: ['nick', 'nicky'],
  alexander: ['alex', 'al'],
  benjamin: ['ben', 'benny'],
  zachary: ['zach', 'zack'],
  elizabeth: ['liz', 'beth', 'lizzie', 'betty'],
  margaret: ['maggie', 'meg', 'peggy'],
  catherine: ['cathy', 'kate', 'katie'],
  susan: ['sue', 'susie'],
  jennifer: ['jen', 'jenny'],
  patricia: ['pat', 'patty', 'tricia'],
  barbara: ['barb', 'barbie'],
  jessica: ['jess', 'jessie'],
  rebecca: ['becky', 'becca'],
  stephanie: ['steph'],
  kimberly: ['kim'],
  michelle: ['shelly', 'mich'],
  amanda: ['mandy'],
  christina: ['chris', 'tina', 'christie'],
  samantha: ['sam', 'sammy'],
};

/**
 * Check if two names are variations of each other (e.g., William and Bill)
 */
export function areNameVariations(name1: string, name2: string): boolean {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();

  if (n1 === n2) return true;

  // Check if one name is a nickname of the other
  for (const [formal, nicknames] of Object.entries(NAME_VARIATIONS)) {
    const allVariations = [formal, ...nicknames];
    if (allVariations.includes(n1) && allVariations.includes(n2)) {
      return true;
    }
  }

  return false;
}

/**
 * Enhanced name matching that considers different name orderings and variations
 */
export function matchNames(
  name1: string,
  name2: string,
  algorithm: 'levenshtein' | 'jaro-winkler' = 'jaro-winkler'
): number {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();

  // Exact match
  if (n1 === n2) return 1.0;

  // Parse names into parts
  const parts1 = n1.split(/\s+/);
  const parts2 = n2.split(/\s+/);

  // Try different matching strategies
  let bestSimilarity = 0;

  // Strategy 1: Direct similarity
  const directSimilarity = stringSimilarity(n1, n2, algorithm);
  bestSimilarity = Math.max(bestSimilarity, directSimilarity);

  // Strategy 2: First and last name match
  if (parts1.length >= 2 && parts2.length >= 2) {
    const firstName1 = parts1[0];
    const lastName1 = parts1[parts1.length - 1];
    const firstName2 = parts2[0];
    const lastName2 = parts2[parts2.length - 1];

    // Check if first names are variations
    const firstNameMatch = areNameVariations(firstName1, firstName2)
      ? 1.0
      : stringSimilarity(firstName1, firstName2, algorithm);
    const lastNameMatch = stringSimilarity(lastName1, lastName2, algorithm);

    const componentMatch = (firstNameMatch + lastNameMatch) / 2;
    bestSimilarity = Math.max(bestSimilarity, componentMatch);
  }

  // Strategy 3: Last name only (for cases like "J. Smith" vs "John Smith")
  if (parts1.length >= 1 && parts2.length >= 1) {
    const lastName1 = parts1[parts1.length - 1];
    const lastName2 = parts2[parts2.length - 1];
    const lastNameSimilarity = stringSimilarity(lastName1, lastName2, algorithm);

    // If last names match well, give partial credit
    if (lastNameSimilarity > 0.9) {
      bestSimilarity = Math.max(bestSimilarity, 0.7);
    }
  }

  return bestSimilarity;
}

/**
 * Common company name suffixes and abbreviations
 */
const COMPANY_SUFFIXES = [
  'inc', 'incorporated', 'llc', 'ltd', 'limited', 'corp', 'corporation',
  'company', 'co', 'group', 'holdings', 'enterprises', 'international',
  'global', 'technologies', 'tech', 'solutions', 'services', 'consulting'
];

const COMPANY_ABBREVIATIONS: Record<string, string[]> = {
  'ibm': ['international business machines'],
  'aws': ['amazon web services'],
  'ge': ['general electric'],
  'hp': ['hewlett packard', 'hewlett-packard'],
  'at&t': ['att', 'at&amp;t'],
  'pwc': ['pricewaterhousecoopers'],
  'kpmg': ['klynveld peat marwick goerdeler'],
  'p&g': ['procter & gamble', 'procter and gamble'],
};

/**
 * Normalize company name for better matching
 */
export function normalizeCompanyName(company: string): string {
  let normalized = company
    .toLowerCase()
    .trim()
    .replace(/&amp;/g, '&')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ');

  // Remove common suffixes
  const suffixPattern = new RegExp(`\\b(${COMPANY_SUFFIXES.join('|')})\\b`, 'g');
  normalized = normalized.replace(suffixPattern, '').trim();

  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Enhanced company matching with abbreviation handling
 */
export function matchCompanies(
  company1: string,
  company2: string,
  algorithm: 'levenshtein' | 'jaro-winkler' = 'jaro-winkler'
): number {
  const c1 = normalizeCompanyName(company1);
  const c2 = normalizeCompanyName(company2);

  // Exact match after normalization
  if (c1 === c2) return 1.0;

  // Check abbreviations
  for (const [abbrev, fullNames] of Object.entries(COMPANY_ABBREVIATIONS)) {
    if ((c1 === abbrev && fullNames.some(fn => c2.includes(fn))) ||
        (c2 === abbrev && fullNames.some(fn => c1.includes(fn)))) {
      return 1.0;
    }
  }

  // Check if one is contained in the other (e.g., "Google" vs "Google LLC")
  if (c1.includes(c2) || c2.includes(c1)) {
    return 0.95;
  }

  // Calculate similarity
  return stringSimilarity(c1, c2, algorithm);
}

/**
 * Location abbreviations and variations
 */
const LOCATION_ABBREVIATIONS: Record<string, string[]> = {
  'ny': ['new york', 'new york city', 'nyc'],
  'sf': ['san francisco', 'san fran'],
  'la': ['los angeles'],
  'dc': ['washington dc', 'washington d.c.', 'washington'],
  'philly': ['philadelphia'],
  'vegas': ['las vegas'],
};

const US_STATE_ABBREVIATIONS: Record<string, string> = {
  'al': 'alabama', 'ak': 'alaska', 'az': 'arizona', 'ar': 'arkansas', 'ca': 'california',
  'co': 'colorado', 'ct': 'connecticut', 'de': 'delaware', 'fl': 'florida', 'ga': 'georgia',
  'hi': 'hawaii', 'id': 'idaho', 'il': 'illinois', 'in': 'indiana', 'ia': 'iowa',
  'ks': 'kansas', 'ky': 'kentucky', 'la': 'louisiana', 'me': 'maine', 'md': 'maryland',
  'ma': 'massachusetts', 'mi': 'michigan', 'mn': 'minnesota', 'ms': 'mississippi',
  'mo': 'missouri', 'mt': 'montana', 'ne': 'nebraska', 'nv': 'nevada', 'nh': 'new hampshire',
  'nj': 'new jersey', 'nm': 'new mexico', 'ny': 'new york', 'nc': 'north carolina',
  'nd': 'north dakota', 'oh': 'ohio', 'ok': 'oklahoma', 'or': 'oregon', 'pa': 'pennsylvania',
  'ri': 'rhode island', 'sc': 'south carolina', 'sd': 'south dakota', 'tn': 'tennessee',
  'tx': 'texas', 'ut': 'utah', 'vt': 'vermont', 'va': 'virginia', 'wa': 'washington',
  'wv': 'west virginia', 'wi': 'wisconsin', 'wy': 'wyoming'
};

/**
 * Normalize location for better matching
 */
export function normalizeLocation(location: string): string {
  let normalized = location
    .toLowerCase()
    .trim()
    .replace(/[.,]/g, '')
    .replace(/\s+area$/i, '')
    .replace(/\s+metro(politan)?$/i, '')
    .replace(/greater\s+/i, '');

  // Expand state abbreviations
  const words = normalized.split(/\s+/);
  const expandedWords = words.map(word => {
    if (US_STATE_ABBREVIATIONS[word]) {
      return US_STATE_ABBREVIATIONS[word];
    }
    return word;
  });

  return expandedWords.join(' ').trim();
}

/**
 * Enhanced location matching with abbreviation handling
 */
export function matchLocations(
  location1: string,
  location2: string,
  algorithm: 'levenshtein' | 'jaro-winkler' = 'jaro-winkler'
): number {
  const l1 = normalizeLocation(location1);
  const l2 = normalizeLocation(location2);

  // Exact match
  if (l1 === l2) return 1.0;

  // Check if one contains the other
  if (l1.includes(l2) || l2.includes(l1)) {
    return 0.9;
  }

  // Check abbreviations
  for (const [abbrev, fullNames] of Object.entries(LOCATION_ABBREVIATIONS)) {
    if ((l1 === abbrev && fullNames.some(fn => l2.includes(fn))) ||
        (l2 === abbrev && fullNames.some(fn => l1.includes(fn)))) {
      return 1.0;
    }
  }

  // Check if they share the same city or state
  const parts1 = l1.split(/\s+/);
  const parts2 = l2.split(/\s+/);
  for (const part1 of parts1) {
    for (const part2 of parts2) {
      if (part1.length > 3 && part2.length > 3 && part1 === part2) {
        return 0.8; // Partial match on significant shared component
      }
    }
  }

  // Calculate similarity
  return stringSimilarity(l1, l2, algorithm);
}

/**
 * Job title synonyms and seniority levels
 */
const JOB_TITLE_SYNONYMS: Record<string, string[]> = {
  'engineer': ['developer', 'programmer', 'coder', 'software engineer', 'swe'],
  'manager': ['mgr', 'lead', 'director'],
  'senior': ['sr', 'principal', 'lead', 'staff'],
  'junior': ['jr', 'associate', 'entry level'],
  'vice president': ['vp', 'v.p.'],
  'chief executive officer': ['ceo', 'c.e.o.'],
  'chief technology officer': ['cto', 'c.t.o.'],
  'chief financial officer': ['cfo', 'c.f.o.'],
  'chief operating officer': ['coo', 'c.o.o.'],
};

/**
 * Normalize job title for better matching
 */
export function normalizeJobTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Enhanced job title matching with synonym recognition
 */
export function matchJobTitles(
  title1: string,
  title2: string,
  algorithm: 'levenshtein' | 'jaro-winkler' = 'jaro-winkler'
): number {
  const t1 = normalizeJobTitle(title1);
  const t2 = normalizeJobTitle(title2);

  // Exact match
  if (t1 === t2) return 1.0;

  // Check if one contains the other
  if (t1.includes(t2) || t2.includes(t1)) {
    return 0.9;
  }

  // Check synonyms
  for (const [key, synonyms] of Object.entries(JOB_TITLE_SYNONYMS)) {
    const allVariations = [key, ...synonyms];
    const foundInT1 = allVariations.find(v => t1.includes(v));
    const foundInT2 = allVariations.find(v => t2.includes(v));

    if (foundInT1 && foundInT2) {
      return 0.85;
    }
  }

  // Calculate similarity
  return stringSimilarity(t1, t2, algorithm);
}
