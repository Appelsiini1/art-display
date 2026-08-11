## Why

The current settings client only lists metadata values, so administrators cannot tell which metadata keys matter or what values are valid. In practice, the only setting that affects display behavior is `currentRating`, but it is mixed into the general metadata list and not surfaced as a first-class control.

## What

- Improve the browser-based settings client UI to highlight `currentRating` separately from the metadata list.
- Add dedicated controls to change `currentRating` between the allowed values: `all`, `sfw`, and `nsfw`.
- Keep the existing metadata list for other values, but treat `currentRating` as a special one that is always present and easy to update.
- Use the existing server metadata API without adding new endpoints.

## Impact

- **Code**: `public/settings.html`, `public/settings.js`, `public/styles.css`
- **User experience**: Administrators can immediately see and change the rating filter that controls image selection, instead of guessing which metadata key matters.
- **Risk**: Minimal; this is a UI-only enhancement that reuses the existing metadata API and server-provided `currentRating` initialization.
