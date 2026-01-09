# Quick Guide: Exporting Contacts for phone-to-linkedin

This guide shows you how to export contacts from Mac Contacts to use with phone-to-linkedin.

**Note about WhatsApp**: WhatsApp reads contacts directly from your iPhone's contact list, so there's no need to export from WhatsApp separately. Just export your iPhone contacts and you'll have all your WhatsApp contacts included.

## Mac Contacts Export (Recommended)

### Option 1: Using Contacts App (Easiest)

1. Open **Contacts.app** on your Mac
2. Select contacts to export:
   - Press `Cmd+A` to select all contacts
   - Or click individual contacts while holding `Cmd`
3. Go to **File** → **Export** → **Export vCard...**
4. Save the file (e.g., `contacts.vcf`)
5. Done! You now have a vCard file ready to use

### Option 2: Command Line

Run this in Terminal:
```bash
osascript -e 'tell application "Contacts"
  set allPeople to every person
  repeat with aPerson in allPeople
    set vCardData to vcard of aPerson
    return vCardData
  end repeat
end tell' > ~/Desktop/contacts.vcf
```

This will save all contacts to `contacts.vcf` on your Desktop.

## Using Exported Files with phone-to-linkedin

Once you have your exported contact files:

```bash
# Use a single vCard file
phone-to-linkedin --input contacts.vcf

# Use multiple files
phone-to-linkedin --input contacts.vcf --input phone-contacts.vcf

# Specify format explicitly
phone-to-linkedin --input contacts.vcf --format vcard

# Process with custom options
phone-to-linkedin --input contacts.vcf --output results.md --limit 3 --min-score 50
```

## What Data is Extracted?

From vCard files, the app will extract:
- **Name** (First, Last, Full)
- **Email addresses** (all types)
- **Phone numbers** (all types)
- **Organization/Company**
- **Job Title**
- **Address/Location**
- **Notes**

## vCard Format Example

Your exported `.vcf` file will look like this:

```
BEGIN:VCARD
VERSION:3.0
N:Doe;John;;;
FN:John Doe
ORG:Acme Corp
TITLE:Software Engineer
EMAIL;TYPE=WORK:john.doe@acme.com
EMAIL;TYPE=HOME:john@personal.com
TEL;TYPE=CELL:+1-555-123-4567
ADR;TYPE=WORK:;;123 Main St;San Francisco;CA;94101;USA
END:VCARD

BEGIN:VCARD
VERSION:3.0
N:Smith;Jane;;;
FN:Jane Smith
...
END:VCARD
```

Each contact is a separate `VCARD` block in the file.

## Troubleshooting

### "Permission Denied" Error
- Make sure the exported file is readable
- Try moving the file to your Desktop or home directory

### "No Contacts Found"
- Check that the file is actually a vCard format (should have `.vcf` extension)
- Open the file in a text editor to verify it contains `BEGIN:VCARD` entries
- Try exporting again from Contacts.app

### Need WhatsApp Contacts?
- WhatsApp uses your phone's native contact list
- Export from your iPhone/Android Contacts app using the methods above
- Your exported contacts will automatically include all WhatsApp contacts

## Privacy Note

All processing happens locally on your Mac. Your contact data is never uploaded to any server. The exported vCard file remains on your computer.

## Next Steps

After exporting your contacts:

1. Run phone-to-linkedin with your exported file
2. The app will search LinkedIn for each contact
3. Review the generated markdown file with matched profiles
4. Click the LinkedIn URLs to verify the matches

Happy matching!
