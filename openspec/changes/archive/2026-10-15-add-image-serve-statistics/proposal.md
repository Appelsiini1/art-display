## Why

The gallery currently has statistics for scanner runs, but the image-serving layer has no durable record of how the random image endpoint is being used. Without that data, it is difficult to understand which files and artists are most popular, how often the app serves SFW versus NSFW content, and how usage changes over time. Adding a dedicated serve-event log will make the API visible and provide a stable source for aggregate analytics without requiring a broader scanner lifecycle redesign.

## What Changes

- Add a dedicated database table for image serve events recorded when `/img/random` serves an image.
- Capture the serve time, file identity, file path, artist snapshot, and the selected rating at the time of the request.
- Keep the analytics record durable even when files or display rows are later deleted or replaced.
- Provide server-side aggregation queries for total serves, top files, top artists, and SFW/NSFW breakdowns.
- Update the project documentation and relevant README files to describe the new image serve analytics behavior and data retention assumptions.
- Keep the scope limited to the image-serving analytics use case; no broader lifecycle changes to the scanner are included.

## Capabilities

### New Capabilities
- `image-serve-statistics`: analytics for random image serving usage, including historical totals, top files, and artist/rating aggregates.

### Modified Capabilities
- None.

## Impact

- Server database schema in `server/src/modules/database.ts`
- Random image endpoint in `server/src/index.ts`
- New statistics queries for image-serving analytics
- Documentation updates in the relevant README files for backend and frontend usage
- Future frontend statistics dashboard additions using the same time-window pattern as scan-run history
