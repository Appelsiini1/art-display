## 1. API and query foundations

- [x] 1.1 Define the current-catalog statistics response contract for totals, artist breakdown, and summary metrics
- [x] 1.2 Add aggregate SQL for total files, artist counts, SFW/NSFW splits, and percentage share
- [x] 1.3 Add aggregate SQL for average, median, and concentration summary metrics from the current `display_files` snapshot
- [x] 1.4 Expose a read-only statistics endpoint for the live catalog snapshot

## 2. Server-side validation and integration

- [x] 2.1 Validate endpoint behavior for empty catalog states and valid aggregate outputs
- [x] 2.2 Confirm the API response structure matches the dashboard expectations for totals and artist rows
- [x] 2.3 Verify the endpoint does not depend on historical serve logs or time-window semantics

## 3. Client dashboard

- [x] 3.1 Add the overview stat cards for inventory totals and SFW/NSFW split
- [x] 3.2 Add the per-artist table with file counts, rating split, and share of total inventory
- [x] 3.3 Add the summary metric cards for average files per artist, median files per artist, and concentration/skew
- [x] 3.4 Keep the page scoped to the first-pass current-snapshot metrics and note deferred future metrics separately

## 4. Documentation updates

- [x] 4.1 Update the project documentation to describe the new current-catalog statistics dashboard
- [x] 4.2 Document the current-snapshot semantics and clarify that these metrics are derived from `display_files`, not historical logs
- [x] 4.3 Add a short note documenting future deferred metrics that were intentionally excluded from the first release

## 5. Verification

- [x] 5.1 Confirm the totals match the current `display_files` contents in a local seeded dataset
- [x] 5.2 Confirm artist percentages sum to the current total inventory
- [x] 5.3 Check the summary metrics behave sensibly for a skewed catalog and a balanced catalog
- [x] 5.4 Review the deferred metrics record to ensure it stays out of scope for this initial implementation
