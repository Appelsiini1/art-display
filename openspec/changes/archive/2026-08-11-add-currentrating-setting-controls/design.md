## Design

1. Add a dedicated `Current Rating` section at the top of `public/settings.html`.
   - Display the current `currentRating` value.
   - Render three buttons for the allowed values: `all`, `sfw`, and `nsfw`.
   - The active button should be visually distinct.

2. Load the current `currentRating` value on page startup.
   - Fetch `/metadata/get?name=currentRating` using the existing same-origin API base URL.
   - If the row is missing, fall back to `sfw` and save it back to the server.

3. When a rating button is clicked:
   - Send `POST /metadata?name=currentRating&value=<selected>` to update the value.
   - Update the button state immediately after a successful save.
   - Refresh the metadata list below.

4. Keep the general metadata list visible, but treat `currentRating` as a separate control.
   - Exclude `currentRating` from the generic metadata table so it does not appear twice.
   - Continue to support loading and saving arbitrary metadata keys via the existing key/value inputs.

5. Add lightweight CSS styling for the rating controls and active state.
   - Keep the style consistent with the current dark UI theme used by `public/styles.css`.
   - Ensure the rating buttons are accessible and easy to use on desktop and mobile.
