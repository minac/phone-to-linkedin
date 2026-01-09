# phone-to-linkedin

A CLI tool that extracts contacts from Mac Contacts and iPhone, then finds matching LinkedIn profiles.

**Note**: WhatsApp contacts don't need separate export since WhatsApp reads from your iPhone's contact list.

## Features

- 📇 Extract contacts from Mac Contacts app
- 🔍 Search LinkedIn for matching profiles
- 🎯 Smart matching algorithm using name, company, location, job title
- 📊 Score-based ranking of matches
- 📝 Generate markdown report with top 3 matches per contact
- 🔗 Clickable LinkedIn profile URLs

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

## How It Works

1. **Extract**: Reads contacts from Mac Contacts or exported vCard files
2. **Search**: Uses Google search to find LinkedIn profiles
3. **Match**: Scores potential matches based on name, company, location, job title
4. **Rank**: Orders matches by confidence score
5. **Output**: Generates markdown file with top 3 matches per contact

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

```
Options:
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
```

### Examples

```bash
# Basic usage with default settings
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
- [ ] Phase 2: Enhanced matching algorithm
- [ ] Phase 3: Profile verification
- [ ] Phase 4: Polish and production features

## License

MIT

## Contributing

Contributions welcome! Please read the implementation plan first.
