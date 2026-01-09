# Phone-to-LinkedIn CLI App - Implementation Plan

## Overview
A CLI application that extracts contacts from Mac Contacts and WhatsApp, then searches LinkedIn to find matching profiles. Outputs a markdown file with the top 3 most likely profile matches for each contact.

**Key Features:**
- **Simplified Input**: Supports exported vCard files from Mac Contacts (no direct app integration needed)
- **Email-First Matching**: Prioritizes email matching (50 points) over name matching (30 points) for higher accuracy
- **Smart Scoring**: Uses name (30), company (15), location (10), and job title (5) for comprehensive matching
- **Multiple Input Formats**: vCard, JSON, and WhatsApp chat exports

## Architecture

### Technology Stack
- **Language**: Node.js (TypeScript) or Python
  - Node.js recommended for better macOS integration
- **CLI Framework**: Commander.js (Node) or Click (Python)
- **Contact Access**: node-contacts or JXA (JavaScript for Automation)
- **Web Scraping**: Playwright or Puppeteer (with proxy rotation)
- **Matching**: String similarity algorithms (Levenshtein distance, fuzzy matching)
- **Output**: Markdown generation with clickable links

## Exporting Contacts to Files (Simplified Approach)

Before implementing programmatic extraction, you can manually export contacts to files:

### Mac Contacts Export

**Method 1: Using Contacts App (Recommended)**
1. Open **Contacts.app**
2. Select the contacts you want to export:
   - `Cmd+A` to select all contacts
   - Or manually select specific contacts
3. Go to **File** → **Export** → **Export vCard...**
4. Save as `contacts.vcf`
5. The vCard file contains all contact information in a standard format

**Method 2: Command Line Export**
```bash
# Export all contacts to vCard format
contacts -H -l | while read -r id; do
  contacts -H -m -i "$id"
done > contacts.vcf

# Or use this simpler approach
osascript -e 'tell application "Contacts"
  set allPeople to every person
  repeat with aPerson in allPeople
    set vCardData to vcard of aPerson
    return vCardData
  end repeat
end tell' > contacts.vcf
```

**vCard Format Example:**
```
BEGIN:VCARD
VERSION:3.0
N:Doe;John;;;
FN:John Doe
ORG:Acme Corp
TITLE:Software Engineer
EMAIL;TYPE=WORK:john.doe@acme.com
TEL;TYPE=CELL:+1-555-123-4567
ADR;TYPE=WORK:;;123 Main St;San Francisco;CA;94101;USA
END:VCARD
```

### WhatsApp Contacts Export

**Important**: WhatsApp doesn't provide a direct contact export feature, but here are workarounds:

**Method 1: Export Individual Chats (Limited)**
1. Open **WhatsApp** on Mac
2. Select a chat
3. Click the three dots → **Export Chat**
4. Choose **Without Media**
5. Save as `.txt` file
6. The file contains phone numbers and names in the chat

**Method 2: Access WhatsApp Database (Advanced)**
```bash
# WhatsApp stores data in SQLite database
# Location: ~/Library/Application Support/WhatsApp/

# The database is encrypted, but you can view the structure
cd ~/Library/Application\ Support/WhatsApp/
ls -la

# Main database files:
# - ChatStorage.sqlite (encrypted)
# - Contacts.db (may contain contact info)

# If Contacts.db is accessible (not encrypted):
sqlite3 Contacts.db ".schema"
sqlite3 Contacts.db "SELECT * FROM contacts;"
```

**Method 3: Sync from Phone (Easiest)**
Since WhatsApp contacts are actually stored on your iPhone/Android:
1. On iPhone: **Settings** → **Contacts** → **Export Contacts** (via iCloud)
2. Download contacts.vcf from iCloud.com
3. These contacts include WhatsApp contacts already

**Method 4: Use WhatsApp Web Export**
- WhatsApp doesn't officially support bulk contact export
- Contacts are synced from your phone's address book
- **Recommendation**: Export from your phone's native contacts app instead

### Parsing Exported Files

The CLI can support multiple input formats:

```bash
# Parse vCard file
phone-to-linkedin --input contacts.vcf

# Parse WhatsApp chat export
phone-to-linkedin --input whatsapp-export.txt --format whatsapp-chat

# Parse JSON (if converted)
phone-to-linkedin --input contacts.json --format json
```

**Implementation:**
```typescript
class ContactParser {
  parseVCard(filePath: string): Contact[] {
    // Parse vCard format (RFC 6350)
    // Libraries: vcard-parser, vcard4
  }

  parseWhatsAppChat(filePath: string): Contact[] {
    // Extract phone numbers and names from chat export
    // Format: "[Date] Name: Message"
  }

  parseJSON(filePath: string): Contact[] {
    // Parse custom JSON format
  }
}
```

## Components

### 1. Contact Extraction Module

#### 1.1 Mac Contacts Reader
**Approach Options:**
- **Option A**: Use JXA (JavaScript for Automation) via `osascript`
  ```javascript
  const app = Application('Contacts')
  const people = app.people()
  ```
- **Option B**: SQLite database direct access
  - Location: `~/Library/Application Support/AddressBook/Sources/`
  - Requires privacy permissions

**Data to Extract:**
- First Name
- Last Name
- Phone Numbers (all types)
- Email Addresses (all types)
- Organization/Company
- Job Title
- Address/Location
- Notes

**Implementation:**
```
class MacContactsReader {
  async extractContacts(): Promise<Contact[]>
  private parseContactData(raw: any): Contact
  async requestPermissions(): Promise<boolean>
}
```

#### 1.2 WhatsApp Contacts Reader
**Challenges:**
- WhatsApp stores contacts in encrypted SQLite database
- Location: `~/Library/Application Support/WhatsApp/Databases/`
- Database is encrypted with user's key

**Approach Options:**
- **Option A**: Read from WhatsApp.app's contact cache (if accessible)
- **Option B**: Parse WhatsApp chat exports
- **Option C**: Use WhatsApp Web automation (Puppeteer)
- **Option D**: Skip WhatsApp initially due to encryption complexity

**Recommended**: Start with Option D (Mac Contacts only), add WhatsApp in Phase 2

#### 1.3 Contact Data Model
```typescript
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumbers: string[];
  emails: string[];
  company?: string;
  jobTitle?: string;
  location?: string;
  source: 'mac-contacts' | 'whatsapp';
  raw: any; // Original data for reference
}
```

### 2. LinkedIn Search Module

#### 2.1 Search Strategies

**Option A: LinkedIn API** (Limited)
- Requires LinkedIn app registration
- Very limited search capabilities
- Rate limited
- Not recommended for this use case

**Option B: Web Scraping with Playwright**
- Most flexible approach
- Requires LinkedIn account
- Handle CAPTCHA/verification
- Rotate user agents and proxies
- Respect rate limits (3-5 searches per minute)

**Option C: Google/Bing Search**
- Use `site:linkedin.com/in/ "John Doe" "Company"`
- More reliable, less likely to be blocked
- Parse search results for LinkedIn URLs
- **Recommended approach**

**Option D: Hybrid Approach**
- Use Google/Bing for initial search
- Optionally scrape LinkedIn profile for verification
- Best balance of reliability and data quality

#### 2.2 Search Query Construction
```typescript
class LinkedInSearcher {
  buildSearchQuery(contact: Contact): string[] {
    // Generate multiple search variations
    const queries = [
      `site:linkedin.com/in/ "${contact.fullName}" ${contact.company}`,
      `site:linkedin.com/in/ "${contact.firstName} ${contact.lastName}" ${contact.location}`,
      `"${contact.fullName}" ${contact.jobTitle} site:linkedin.com`,
    ];
    return queries;
  }
}
```

#### 2.3 Profile Scraping (Optional)
If scraping LinkedIn directly:
```typescript
class LinkedInProfileScraper {
  async scrapeProfile(url: string): Promise<ProfileData> {
    // Extract: name, headline, location, company, education
  }

  async authenticateWithLinkedIn(): Promise<void> {
    // Handle LinkedIn login
  }
}
```

### 3. Matching & Scoring Module

#### 3.1 Matching Algorithm
```typescript
interface Match {
  contact: Contact;
  linkedInUrl: string;
  profileName: string;
  score: number;
  matchReasons: string[];
}

class ContactMatcher {
  scoreMatch(contact: Contact, profile: LinkedInProfile): number {
    let score = 0;

    // Email domain match (0-50 points) - HIGHEST PRIORITY
    // Email is the strongest signal for identity matching
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

    // Job title similarity (0-5 points)
    if (contact.jobTitle && profile.headline) {
      score += this.titleMatchScore(contact.jobTitle, profile.headline);
    }

    return score;
  }

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

  private nameMatchScore(name1: string, name2: string): number {
    // Use Levenshtein distance or Jaro-Winkler
    const similarity = stringSimilarity(name1, name2);
    return similarity * 30;
  }
}
```

#### 3.2 Ranking System
- Score range: 0-100
- Thresholds:
  - 80-100: Very High Confidence
  - 60-79: High Confidence
  - 40-59: Medium Confidence
  - 20-39: Low Confidence
  - 0-19: Very Low Confidence

### 4. Output Generator

#### 4.1 Markdown Format
```markdown
# LinkedIn Contact Matches

Generated: 2026-01-09

## Summary
- Total Contacts: 150
- Contacts with Matches: 120
- No Matches Found: 30

---

## John Doe
**Source**: Mac Contacts
**Company**: Acme Corp
**Location**: San Francisco, CA

### Top 3 Matches:

#### 1. [John Doe](https://linkedin.com/in/johndoe) - Score: 95/100 (Very High Confidence)
- **Headline**: Software Engineer at Acme Corp
- **Location**: San Francisco Bay Area
- **Match Reasons**:
  - Exact name match
  - Company match: Acme Corp
  - Location match: San Francisco

#### 2. [John M. Doe](https://linkedin.com/in/johnmdoe) - Score: 72/100 (High Confidence)
- **Headline**: Senior Developer at Tech Co
- **Location**: San Francisco, CA
- **Match Reasons**:
  - Similar name match (95%)
  - Location match: San Francisco

#### 3. [Jonathan Doe](https://linkedin.com/in/jonathandoe) - Score: 58/100 (Medium Confidence)
- **Headline**: Product Manager at Acme Corp
- **Location**: Oakland, CA
- **Match Reasons**:
  - Partial name match (80%)
  - Company match: Acme Corp

---
```

#### 4.2 Output Options
- Single file with all matches
- Separate files per contact
- JSON export option for programmatic use
- HTML output with styling

### 5. CLI Interface

```bash
# Basic usage (extract from Mac Contacts)
phone-to-linkedin

# Use exported vCard file (RECOMMENDED - simpler approach)
phone-to-linkedin --input contacts.vcf

# Use multiple input files
phone-to-linkedin --input contacts.vcf --input whatsapp-export.txt

# With options
phone-to-linkedin --source contacts,whatsapp --output results.md --limit 3 --min-score 40

# Filter by name
phone-to-linkedin --filter "John Doe"

# Specify input format
phone-to-linkedin --input contacts.vcf --format vcard

# Dry run (show what would be searched)
phone-to-linkedin --dry-run

# Use cached results
phone-to-linkedin --use-cache
```

#### CLI Commands
```typescript
program
  .name('phone-to-linkedin')
  .description('Find LinkedIn profiles for your contacts')
  .option('-i, --input <files...>', 'Input contact files (vCard, JSON, WhatsApp chat)')
  .option('--format <type>', 'Input format: vcard, json, whatsapp-chat (auto-detected if not specified)')
  .option('-s, --source <sources>', 'Contact sources (contacts,whatsapp) - for direct extraction', 'contacts')
  .option('-o, --output <file>', 'Output markdown file', 'linkedin-matches.md')
  .option('-l, --limit <number>', 'Number of matches per contact', '3')
  .option('-m, --min-score <number>', 'Minimum match score', '40')
  .option('-f, --filter <name>', 'Filter contacts by name')
  .option('--dry-run', 'Show what would be searched without executing')
  .option('--use-cache', 'Use cached search results')
  .option('--no-browser', 'Use search API instead of browser automation')
  .action(async (options) => {
    await runPhoneToLinkedIn(options);
  });
```

## Implementation Phases

### Phase 1: MVP (Minimum Viable Product)
**Goal**: Basic working version with Mac Contacts and Google search

**Tasks:**
1. Set up project structure (Node.js + TypeScript)
2. Implement Mac Contacts reader using JXA
3. Implement Google search-based LinkedIn finder
4. Basic name matching algorithm
5. Simple markdown output generator
6. CLI interface with basic options

**Estimated Complexity**: Medium

**Deliverables:**
- Working CLI that reads Mac Contacts
- Searches LinkedIn via Google
- Outputs markdown with top 3 matches per contact

### Phase 2: Enhanced Matching
**Goal**: Improve match accuracy and add more data points

**Tasks:**
1. Implement advanced fuzzy matching
2. Add scoring system with configurable weights
3. Company and location matching
4. Job title similarity
5. Confidence levels in output
6. Match reason explanations

### Phase 3: WhatsApp Integration
**Goal**: Add WhatsApp as a contact source

**Tasks:**
1. Research WhatsApp data access methods
2. Implement chosen approach (likely Web automation)
3. Merge contacts from multiple sources
4. Deduplicate contacts

### Phase 4: Profile Verification
**Goal**: Optionally scrape LinkedIn profiles for better matching

**Tasks:**
1. Implement Playwright-based LinkedIn scraper
2. Handle authentication and session management
3. Respect rate limits and anti-bot measures
4. Extract profile details for scoring
5. Cache profile data

### Phase 5: Polish & Features
**Goal**: Production-ready application

**Tasks:**
1. Progress bars and status updates
2. Error handling and retry logic
3. Configuration file support
4. Export formats (JSON, CSV, HTML)
5. Contact filtering and search
6. Statistics and analytics
7. Documentation and README
8. Unit and integration tests

## Technical Considerations

### Privacy & Permissions
- Request macOS contacts permission
- Securely handle LinkedIn credentials
- Don't store sensitive contact data
- Clear disclosure of data usage
- Option to exclude specific contacts

### Rate Limiting
- Google search: Max 100 queries per day (free tier)
- LinkedIn: 3-5 requests per minute to avoid detection
- Implement exponential backoff
- Cache results to avoid re-searching

### Error Handling
- Network failures
- Permission denials
- CAPTCHA challenges
- Invalid contact data
- No matches found

### Performance
- Parallel search requests (with rate limiting)
- Cache search results
- Incremental processing
- Progress indicators

### Anti-Bot Measures
- Rotate user agents
- Random delays between requests
- Use residential proxies (optional)
- Respect robots.txt
- Don't overwhelm LinkedIn servers

## Dependencies (Node.js)

```json
{
  "dependencies": {
    "commander": "^11.1.0",
    "vcard-parser": "^2.0.0",
    "playwright": "^1.40.0",
    "cheerio": "^1.0.0-rc.12",
    "string-similarity": "^4.0.4",
    "cli-progress": "^3.12.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.1",
    "node-cache": "^5.1.2"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"
  }
}
```

## File Structure

```
phone-to-linkedin/
├── src/
│   ├── index.ts                 # CLI entry point
│   ├── cli.ts                   # Command definitions
│   ├── contacts/
│   │   ├── mac-contacts.ts      # Mac Contacts reader
│   │   ├── whatsapp.ts          # WhatsApp reader
│   │   ├── types.ts             # Contact data types
│   │   └── parser.ts            # Contact data parser
│   ├── linkedin/
│   │   ├── searcher.ts          # LinkedIn search
│   │   ├── scraper.ts           # Profile scraper
│   │   ├── google-search.ts     # Google search wrapper
│   │   └── types.ts             # LinkedIn data types
│   ├── matching/
│   │   ├── matcher.ts           # Matching algorithm
│   │   ├── scorer.ts            # Scoring logic
│   │   └── fuzzy.ts             # Fuzzy string matching
│   ├── output/
│   │   ├── markdown.ts          # Markdown generator
│   │   ├── json.ts              # JSON export
│   │   └── html.ts              # HTML export
│   ├── cache/
│   │   └── cache-manager.ts     # Result caching
│   └── utils/
│       ├── logger.ts            # Logging
│       ├── permissions.ts       # macOS permissions
│       └── rate-limiter.ts      # Rate limiting
├── scripts/
│   └── mac-contacts.jxa         # JXA script for contacts
├── tests/
│   └── ...
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
└── IMPLEMENTATION_PLAN.md
```

## Security & Legal Considerations

### Terms of Service
- LinkedIn's ToS prohibits automated scraping
- Use at own risk or consider official LinkedIn API
- Google's ToS for automated queries
- Stay within reasonable use limits

### Data Privacy
- Don't upload contact data to third parties
- Process locally only
- Don't store LinkedIn credentials in plain text
- Allow users to exclude sensitive contacts

### Recommendations
- Add disclaimer about ToS risks
- Implement conservative rate limiting
- Offer "respectful mode" with longer delays
- Consider manual verification workflow

## Alternative Approaches

### 1. Manual Workflow Helper
Instead of full automation:
- Generate search URLs
- User clicks to verify
- User pastes LinkedIn URL back
- App validates match

### 2. Chrome Extension
- Access LinkedIn directly from browser
- Use existing session
- Fewer anti-bot issues
- Better UX for verification

### 3. API-First Approach
- Use only official APIs
- More limited functionality
- Fully compliant with ToS
- May require paid LinkedIn API access

## Success Metrics

- **Match Rate**: >70% of contacts should have at least one match
- **Accuracy**: Top match should be correct >80% of time
- **Performance**: Process 100 contacts in <5 minutes
- **Reliability**: <5% error rate on searches

## Next Steps

1. Review and approve implementation plan
2. Choose primary approach (recommend Phase 1 MVP with Google search)
3. Set up development environment
4. Begin Phase 1 implementation
5. Test with small contact sample
6. Iterate based on results

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LinkedIn blocks requests | High | Use Google search, add delays, rotate IPs |
| WhatsApp data inaccessible | Medium | Skip WhatsApp, focus on Mac Contacts |
| Low match accuracy | Medium | Implement robust scoring algorithm |
| macOS permission denied | High | Clear permission prompts, fallback options |
| Rate limit violations | Medium | Conservative limits, caching, backoff |
| Google CAPTCHA | Medium | Use official Search API (paid) or manual fallback |

## Conclusion

This implementation plan provides a roadmap for building a functional phone-to-linkedin CLI app. The phased approach allows for iterative development, starting with a working MVP and progressively adding features. The recommended approach uses Google search to find LinkedIn profiles, which is more reliable than direct scraping while still providing good results.

**Recommended Starting Point**: Phase 1 MVP using Mac Contacts + Google Search + Basic Matching
