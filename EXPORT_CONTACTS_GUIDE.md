# Quick Guide: Exporting Contacts for phone-to-linkedin

This guide shows you how to export contacts from Mac Contacts and WhatsApp to use with phone-to-linkedin.

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

## WhatsApp Contacts Export

WhatsApp doesn't have a built-in bulk export feature. Here are your options:

### Option 1: Export from iPhone/Android (Best Method)

Since WhatsApp syncs contacts from your phone:

**On iPhone:**

**Option A: If you already have iCloud sync enabled on your Mac**
1. Open **Contacts.app** on your Mac (your iPhone contacts should already be there)
2. Press `Cmd+A` to select all contacts
3. Go to **File** → **Export** → **Export vCard...**
4. Save the file - you're done!

**Option B: Using iCloud.com**
1. On your iPhone, go to **Settings** → **[Your Name]** (at the very top with your photo)
2. Tap **iCloud**
3. Turn on the **Contacts** toggle (if it's not already on)
4. Wait 2-5 minutes for contacts to sync to iCloud
5. On your Mac (or any computer), open a web browser
6. Go to [iCloud.com](https://www.icloud.com)
7. Sign in with your Apple ID and password
8. Click on **Contacts** (the address book icon)
9. Click any contact, then press `Cmd+A` (or Ctrl+A on Windows) to select all
10. Click the **gear icon** (⚙️) at the bottom left corner
11. Select **Export vCard...**
12. Save the `vCard.vcf` file to your Mac

**On Android:**
1. Open the **Contacts** or **People** app on your phone
2. Tap the **Menu** button (three horizontal lines ☰ or three dots ⋮)
3. Look for **Settings**, **Manage contacts**, or **Import/Export**
4. Tap **Export** or **Export contacts**
5. Choose **Export to .vcf file** or **Export to storage**
6. Select a save location:
   - **Internal storage/Downloads** (then transfer via USB)
   - **Google Drive** (easiest - access from any computer)
   - **Email** (send to yourself)
7. On your Mac, download the file from where you saved it

### Option 2: Export Individual WhatsApp Chats

For a smaller subset of contacts:

1. Open **WhatsApp** on Mac
2. Select a chat
3. Click **three dots** (⋮) → **Export Chat**
4. Choose **Without Media**
5. Save as `.txt` file
6. Repeat for other chats

Note: This gives you a chat export with phone numbers, not a full contact list.

### Option 3: Access WhatsApp Database (Advanced)

WhatsApp stores data in:
```
~/Library/Application Support/WhatsApp/
```

However, most files are encrypted and not easily accessible.

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

### iPhone: Can't Find iCloud Export Option
- Make sure you're signed in to iCloud on your iPhone (Settings → [Your Name])
- The Contacts toggle must be ON in iCloud settings
- After enabling, wait 5-10 minutes for the initial sync
- If still not syncing, try: Settings → [Your Name] → iCloud → toggle Contacts OFF then back ON
- Check your Mac's Contacts.app - if iPhone contacts appear there, you can export directly from the Mac

### iPhone: Contacts Not Syncing to iCloud
- Go to Settings → [Your Name] → iCloud → turn off Contacts, wait 10 seconds, turn back on
- Make sure you have iCloud storage available
- Check your internet connection
- Try restarting your iPhone
- Alternative: Export directly from Mac Contacts.app if you use the same Apple ID

### "Permission Denied" Error
- Make sure the exported file is readable
- Try moving the file to your Desktop or home directory

### "No Contacts Found"
- Check that the file is actually a vCard format (should have `.vcf` extension)
- Open the file in a text editor to verify it contains `BEGIN:VCARD` entries
- Try exporting again from Contacts.app

### WhatsApp Contacts Not Showing
- Remember: WhatsApp uses your phone's contacts
- Export from your phone's native Contacts app instead
- The contacts will include all your WhatsApp contacts automatically
- WhatsApp doesn't have a separate contact database - it reads from your phone's address book

## Privacy Note

All processing happens locally on your Mac. Your contact data is never uploaded to any server. The exported vCard file remains on your computer.

## Next Steps

After exporting your contacts:

1. Run phone-to-linkedin with your exported file
2. The app will search LinkedIn for each contact
3. Review the generated markdown file with matched profiles
4. Click the LinkedIn URLs to verify the matches

Happy matching!
