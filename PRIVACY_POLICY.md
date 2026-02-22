# Privacy Policy — UICloner

**Last updated:** February 22, 2026

## Overview

UICloner is a Chrome extension that extracts DOM structure, CSS properties, and Tailwind suggestions from web pages. All processing happens **entirely on your local device**.

## Data Collection

**UICloner does not collect, store, transmit, or share any user data.**

Specifically:

- No personal information is collected
- No browsing history is tracked
- No page content is sent to any server
- No analytics or telemetry data is gathered
- No cookies are set or read
- No third-party services are used

## How It Works

1. When you click "Scan Page" or "Select Element", the extension reads the DOM structure and computed CSS of the current tab
2. The extracted data is displayed in the extension's side panel on your device
3. You can copy or download the JSON output — this stays on your device
4. No data ever leaves your browser

## Permissions

| Permission | Why It's Needed |
|-----------|-----------------|
| `activeTab` | To read the DOM of the page you are currently viewing |
| `sidePanel` | To display the extension UI as a Chrome side panel |
| `scripting` | To inject scripts for React component detection |

These permissions are only activated when you explicitly interact with the extension.

## Changes

If this policy changes, the updated version will be posted here with a new date.

## Contact

For questions or concerns, please open an issue at:
https://github.com/Volkarslan/ui-cloner/issues
