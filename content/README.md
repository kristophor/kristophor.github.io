# Content Editing Guide

The homepage now loads one entry per folder.

## Root folders

- content/apps/
- content/blog/

Each entry must be in its own subfolder and use an `index.md` file:

- content/apps/<slug>/index.md
- content/blog/<slug>/index.md

## Entry format

```md
# Entry Title
- Date: 2026-05-06
- Status: active
- Tags: tag1, tag2
- Disclaimer: Optional note

Write markdown body text here.
```

Rules:
- `Date` should be `YYYY-MM-DD` so sorting works correctly.
- `Status` and `Disclaimer` are mostly for Apps but optional everywhere.
- `Tags` are optional but recommended.
- Body supports standard markdown.

## Adding new content

1. Create a new slug folder under apps or blog.
2. Add `index.md` in that folder.
3. Commit and push.

On github.io hosting, the site auto-discovers new subfolders and renders them ordered by date (newest first).

## Local preview note

For local preview outside github.io hostname, folder discovery falls back to:

- content/apps/index.json
- content/blog/index.json

If you add a new entry, also add its slug to the matching `index.json` file.
