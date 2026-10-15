## 1. API and summary contract

- [x] 1.1 Extend the current catalog summary query to compute the top 5 artists by NSFW-heavy share and the top 5 artists by SFW-heavy share
- [x] 1.2 Add the top-10 artists share value to the aggregate response payload
- [x] 1.3 Keep the result aligned with the live `display_files` snapshot and avoid using historical serve data

## 2. Client dashboard updates

- [x] 2.1 Add a ranked list for the top 5 NSFW-heavy artists
- [x] 2.2 Add a ranked list for the top 5 SFW-heavy artists
- [x] 2.3 Add a summary metric for the share of the top 10 artists in the full catalogue
- [x] 2.4 Add a tooltip to the concentration-ratio card that explains the formula and meaning in plain terms

## 3. Rendering and validation

- [x] 3.1 Update the dashboard rendering logic to populate the new ranked lists and summary values from the API response
- [x] 3.2 Verify the top-10 share and artist-rank metrics match the current `display_files` totals in the local database
- [x] 3.3 Check the tooltip renders correctly and does not disrupt the existing layout or accessibility behavior
