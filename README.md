# phone-to-linkedin

A CLI tool that extracts contacts from Mac Contacts and iPhone, then finds matching LinkedIn profiles.

**Note**: WhatsApp contacts don't need separate export since WhatsApp reads from your iPhone's contact list.

## Features

- 📇 Extract contacts from Mac Contacts app
- 🔍 **Enhanced multi-source search**
  - Google search to find LinkedIn profile URLs
  - **LinkedIn profile scraping** with Playwright to extract detailed info (name, headline, company, location)
  - Optional Google Custom Search API for more reliable results
- 🎯 **Enhanced matching algorithm** with Jaro-Winkler similarity
  - Smart name matching with nickname recognition (Bill ↔ William)
  - Advanced company matching with abbreviation handling (IBM ↔ International Business Machines)
  - Location matching with abbreviations (SF ↔ San Francisco)
  - Job title synonym recognition (Engineer ↔ Developer)
- 📊 Score-based ranking with detailed breakdowns
- 🎨 **Configurable weights** for custom scoring priorities
- 📝 Generate markdown report with detailed match reasons
- 🔗 Clickable LinkedIn profile URLs
- ⚙️ Flexible matching algorithm selection (Levenshtein or Jaro-Winkler)
- 💾 Smart caching to avoid redundant searches

## Prerequisites

This project uses **pnpm** as the package manager for faster installs and better disk efficiency.

Install pnpm if you haven't already:
```bash
npm install -g pnpm
# or
brew install pnpm
```

## Quick Start

```bash
# 1. Export contacts from Mac Contacts app:
#    - Open Contacts.app
#    - Select contacts (Cmd+A for all)
#    - File → Export → Export vCard...
#    - Save as contacts.vcf

# 2. Install dependencies (2-3x faster than npm!)
pnpm install

# 3. Run with default settings (optimized for common use case)
pnpm start -- -i contacts.vcf

# Or simply place contacts.vcf in the current directory and run:
pnpm start

# Advanced usage with custom options
pnpm start -- -i contacts.vcf -o results.md -l 5 --min-score 60

# Development mode
pnpm dev
```

## Optional: Google Custom Search API Setup

For more reliable search results, you can optionally configure Google Custom Search API. This provides better quality results than web scraping alone.

### Why Use Google Custom Search API?

- **More Reliable**: Official API with better uptime than web scraping
- **Better Results**: More accurate search results
- **Rate Limits**: Higher rate limits for production use
- **Free Tier**: 100 queries/day free (sufficient for most use cases)

### Setup Instructions

#### 1. Get Google Custom Search API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Custom Search API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Custom Search API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key

#### 2. Create Custom Search Engine

1. Go to [Google Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click "Add" or "Get Started"
3. Configure your search engine:
   - **Sites to search**: Enter `linkedin.com/in/*`
   - **Name**: Give it a descriptive name (e.g., "LinkedIn Profile Search")
4. Click "Create"
5. In the search engine settings:
   - Copy your **Search Engine ID** (looks like `abc123...`)
   - Under "Search Features", enable "Search the entire web"

#### 3. Configure the Tool

Option 1: Environment variables (recommended)
```bash
export GOOGLE_API_KEY="your-api-key-here"
export GOOGLE_SEARCH_ENGINE_ID="your-search-engine-id"

pnpm start -- -i contacts.vcf
```

Option 2: Command line options
```bash
pnpm start -- -i contacts.vcf \
  --google-api-key "your-api-key-here" \
  --google-search-engine-id "your-search-engine-id"
```

Option 3: Add to your shell profile (`.bashrc`, `.zshrc`, etc.)
```bash
echo 'export GOOGLE_API_KEY="your-api-key-here"' >> ~/.zshrc
echo 'export GOOGLE_SEARCH_ENGINE_ID="your-search-engine-id"' >> ~/.zshrc
source ~/.zshrc
```

### Fallback Behavior

If Google Custom Search API is not configured or fails:
- The tool automatically falls back to web scraping
- No configuration required for basic usage
- LinkedIn profile scraping still provides detailed information

## How It Works

1. **Extract**: Reads contacts from Mac Contacts or exported vCard files
2. **Search**: Uses enhanced multi-source search strategy
   - Performs Google search to find LinkedIn profile URLs
   - Scrapes LinkedIn profiles to extract detailed information (name, headline, company, location)
   - Optional: Uses Google Custom Search API for more reliable results
3. **Match**: Scores potential matches based on:
   - Email address (highest priority)
   - Name similarity with nickname recognition
   - Company matching with abbreviations
   - Location matching
   - Job title alignment
4. **Rank**: Orders matches by confidence score with detailed breakdowns
5. **Output**: Generates markdown file with top matches per contact

## Output Example

```markdown
## John Doe
**Company**: Acme Corp | **Location**: San Francisco, CA

### Top 3 Matches:
1. [John Doe](https://linkedin.com/in/johndoe) - Score: 95/100 ⭐ Very High Confidence
2. [John M. Doe](https://linkedin.com/in/johnmdoe) - Score: 72/100 ⭐ High Confidence
3. [Jonathan Doe](https://linkedin.com/in/jonathandoe) - Score: 58/100 ⭐ Medium Confidence
```

## CLI Options

**Optimized Defaults** - The CLI is pre-configured for the most common use case:
- ✅ **Input**: vCard file (recommended - simply export from Contacts.app)
- ✅ **Output**: `linkedin-matches.md` (clean markdown report)
- ✅ **Matches**: Top 3 per contact (optimal for review)
- ✅ **Min Score**: 40 (filters out low-confidence matches)
- ✅ **Cache**: Enabled by default (avoids redundant searches)
- ✅ **Algorithm**: Jaro-Winkler (better for name matching)

```
Basic Options:
  -i, --input <files...>     Input contact files (vCard, JSON, WhatsApp chat)
                             If not specified, looks for contacts.vcf in current directory
  --format <type>            Input format: vcard, json, whatsapp-chat (auto-detected)
  -s, --source <sources>     Contact sources for direct extraction (contacts,whatsapp)
                             Requires system permissions (default: "contacts")
  -o, --output <file>        Output markdown file (default: "linkedin-matches.md")
  -l, --limit <number>       Number of matches per contact (default: 3)
  -m, --min-score <number>   Minimum match score 0-100 (default: 40)
  -f, --filter <name>        Filter contacts by name (partial match)
  --dry-run                  Show what would be searched without executing
  --use-cache                Use cached search results (default: enabled)
  --no-cache                 Disable cache and force fresh searches
  -h, --help                 Display help
  -V, --version              Display version

Search API Options (Optional):
  --google-api-key <key>              Google Custom Search API key for enhanced results
  --google-search-engine-id <id>     Google Custom Search Engine ID
                                     (Can also use GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID env vars)

Advanced Matching Options:
  --algorithm <type>         Matching algorithm: levenshtein or jaro-winkler (default: jaro-winkler)
  --email-weight <number>    Weight for email matching (default: 50)
  --name-weight <number>     Weight for name matching (default: 30)
  --company-weight <number>  Weight for company matching (default: 15)
  --location-weight <number> Weight for location matching (default: 10)
  --job-title-weight <number> Weight for job title matching (default: 5)
  --name-threshold <number>  Minimum name similarity threshold 0-1 (default: 0.7)
  --company-threshold <number> Minimum company similarity threshold 0-1 (default: 0.6)
```

### Examples

```bash
# Basic usage with default settings (uses web scraping)
phone-to-linkedin -i contacts.vcf

# Use Google Custom Search API for better results
phone-to-linkedin -i contacts.vcf \
  --google-api-key "your-key" \
  --google-search-engine-id "your-id"

# Or with environment variables
export GOOGLE_API_KEY="your-key"
export GOOGLE_SEARCH_ENGINE_ID="your-id"
phone-to-linkedin -i contacts.vcf

# Higher quality matches only
phone-to-linkedin -i contacts.vcf --min-score 60

# More matches per contact
phone-to-linkedin -i contacts.vcf -l 5

# Filter specific contacts
phone-to-linkedin -i contacts.vcf -f "John"

# Dry run to preview what will be searched
phone-to-linkedin -i contacts.vcf --dry-run

# Force fresh searches without cache
phone-to-linkedin -i contacts.vcf --no-cache

# Advanced matching options
# Prioritize company matches over name matches
phone-to-linkedin -i contacts.vcf --name-weight 20 --company-weight 25

# Use Levenshtein algorithm instead of Jaro-Winkler
phone-to-linkedin -i contacts.vcf --algorithm levenshtein

# Require stricter name matching
phone-to-linkedin -i contacts.vcf --name-threshold 0.85

# Combine multiple custom options
phone-to-linkedin -i contacts.vcf \
  --algorithm jaro-winkler \
  --name-weight 35 \
  --email-weight 40 \
  --min-score 50 \
  --google-api-key "your-key"
```

## Implementation Plan

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed architecture and development roadmap.

## Privacy & Security

- All processing happens locally on your machine
- No contact data is uploaded to third parties
- LinkedIn credentials are not stored
- Respects rate limits and ToS where possible

## Legal Disclaimer

This tool is for personal use only. Be aware that:
- LinkedIn's Terms of Service prohibit automated scraping
- Use conservative rate limiting to respect services
- Consider using official APIs for production use

## Development Roadmap

- [x] Phase 0: Planning and architecture
- [x] CLI setup with optimized defaults
- [x] Phase 1: MVP with Mac Contacts + Google search
- [x] **Phase 2: Enhanced matching algorithm** ✨
  - [x] Jaro-Winkler algorithm implementation
  - [x] Advanced fuzzy matching with nickname recognition
  - [x] Enhanced company matching with abbreviations
  - [x] Smart location matching with US state codes
  - [x] Job title synonym recognition
  - [x] Configurable scoring weights
  - [x] Detailed score breakdown in match reasons
- [x] **Phase 3: Enhanced Search Sources** 🚀
  - [x] Multi-source search strategy
  - [x] LinkedIn profile web scraping with Playwright
  - [x] Extract detailed profile information (name, headline, company, location)
  - [x] Google Custom Search API integration (optional)
  - [x] Automatic fallback from API to web scraping
  - [x] Smart rate limiting and delays
- [ ] Phase 4: Profile verification
- [ ] Phase 5: Polish and production features

## License

MIT

## Contributing

Contributions welcome! Please read the implementation plan first.
