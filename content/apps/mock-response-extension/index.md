# Mock Response Extension
- Date: 2026-05-06
- Status: new
- Tags: chrome-extension, edge-extension, api-testing, mock
- Disclaimer: Debug/developer workflow tool for local testing.

A Chrome/Edge extension for API mock testing with request interception through the Debugger API using `Fetch.fulfillRequest`.

## Features
- Popup panel with top list of mock APIs.
- List actions: edit, delete, enable/disable.
- Global **Enable All** and **Disable All** controls.
- In-popup editor panel for non-interruptive editing.
- Mock fields:
  - Status code
  - Headers
  - Request HTTP methods (multi-select; applies to all if none selected)
  - Response body (optional)

## Load in Chrome (Debug Mode)
1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder.

## Load in Edge (Debug Mode)
1. Open `edge://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder.

## Usage
1. Click the extension icon to open the popup.
2. Create a mock from **+ New Mock**.
3. Edit the mock in the popup editor panel.
4. Enable or disable per-mock from list or editor.
5. Use **Enable All** and **Disable All** in the header for global control.
6. Visit an HTTP/HTTPS page and call matching APIs from that tab.
