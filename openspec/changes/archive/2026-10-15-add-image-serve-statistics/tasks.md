## 1. Database and schema

- [x] 1.1 Add `image_serve_events` table with timestamp, file identity, file path, artist snapshot, and rating columns.
- [x] 1.2 Add indexes for time-window queries and aggregation fields.
- [x] 1.3 Document the snapshot behavior in the schema and any relevant comments so future maintainers know artist is historical data, not a live lookup.

## 2. Serve-event insert path

- [x] 2.1 Update the random image serving flow to insert a row after a valid image is selected and before the response is returned.
- [x] 2.2 Include the current rating and the serve-time artist snapshot in the inserted event.
- [x] 2.3 Ensure failed or empty matches do not create serve-event records.

## 3. Aggregation queries

- [x] 3.1 Implement total serve count query with SFW/NSFW split for a selected time range.
- [x] 3.2 Implement top-file aggregation query ordered by serve count.
- [x] 3.3 Implement top-artist aggregation query ordered by serve count.
- [x] 3.4 Implement per-artist SFW vs NSFW breakdown query.
- [x] 3.5 Implement percentage view in SQL so the API can return consistent ratios.

## 4. API exposure and validation

- [x] 4.1 Expose the aggregated stats via an endpoint under the statistics surface.
- [x] 4.2 Validate the payload shape for the frontend and ensure it matches the selected time-window requirement.
- [x] 4.3 Confirm that deleting a file or display row does not invalidate historical serve totals or artist summaries.

## 5. Documentation updates

- [x] 5.1 Update the server README to document the new image serve analytics table, how it is populated, and the historical snapshot behavior for artist data.
- [x] 5.2 Update the public/frontend README as needed to document the new statistics surface and any aggregate metrics exposed for the random image endpoint.
- [x] 5.3 Add any implementation notes or guidance that future maintainers will need when working with the image serve statistics data model.
