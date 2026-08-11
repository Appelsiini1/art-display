## Why

The current metadata management workflow relies on an outdated Python CLI under `client/`. That CLI is not user-friendly for non-developers, and it creates an unnecessary dependency on Python tooling to update display settings.

A browser-based settings client will make the same metadata operations easier to access, more maintainable, and more appropriate for the existing `public/` web frontend.

## What

- Build a new web-based metadata/settings client UI in `public/`.
- Allow users to view all metadata values, load a specific key, and add or update setting values using the existing server API.
- Replace the legacy Python metadata-management path with a browser-first experience while keeping the current API unchanged.

## Impact

- **Code**: `public/index.html`, `public/main.js`, `public/styles.css`, and possibly new `public/settings.html`/`public/settings.js` files.
- **User experience**: Administrators can manage metadata values from a web browser instead of running the Python CLI.
- **Risk**: The change should avoid altering kiosk display behavior and keep the new client isolated to an admin/settings page.
- **Scope**: This change focuses on metadata/settings management only, not the full file upload or scanner workflows.
