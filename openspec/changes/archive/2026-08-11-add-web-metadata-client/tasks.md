## Tasks

- [x] Add a browser-based metadata/settings page to the public frontend.
  - [x] Create `public/settings.html` with a form for metadata key/value input and controls for loading/updating values.
- [x] Implement `public/settings.js` to interact with the metadata API.
  - [x] Derive the API base URL from `window.location.origin` for same-origin fetches.
  - [x] Support POST `/metadata` to add/update values and GET `/metadata/get` and `/metadata/get/all` to read values.
  - [x] Refresh the metadata list after saving a value.
- [x] Update `public/styles.css` with minimal styles for the settings page.
- [x] Validate the metadata settings page loads correctly and can read, add, and update metadata values through the server.
- [x] Confirm the legacy Python metadata client is no longer required for basic settings management.
