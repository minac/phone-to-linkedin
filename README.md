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

## Quick Start

```bash
# Install dependencies
npm install

# Run the CLI
npm start

# Or with options
npm start -- --source contacts --output results.md --limit 3
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

```
Options:
  -s, --source <sources>    Contact sources (contacts) (default: "contacts")
  -o, --output <file>       Output markdown file (default: "linkedin-matches.md")
  -l, --limit <number>      Number of matches per contact (default: "3")
  -m, --min-score <number>  Minimum match score (default: "40")
  -f, --filter <name>       Filter contacts by name
  --dry-run                 Show what would be searched without executing
  --use-cache               Use cached search results
  -h, --help                Display help
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
- [ ] Phase 1: MVP with Mac Contacts + Google search
- [ ] Phase 2: Enhanced matching algorithm
- [ ] Phase 3: Profile verification
- [ ] Phase 4: Polish and production features

## License

MIT

## Contributing

Contributions welcome! Please read the implementation plan first.
