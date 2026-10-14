## 1. Frontend scaffolding

- [x] 1.1 Create a new statistics page and browser script under the static `public/` frontend.
- [x] 1.2 Add the page to the existing public asset pattern so it is served alongside the gallery and settings screens.

## 2. Dashboard layout

- [x] 2.1 Design the page shell with a header, time-range selector, KPI cards, and a recent run history section.
- [x] 2.2 Add empty, loading, and error states to keep the page resilient when no data or failures are returned.

## 3. Data integration

- [x] 3.1 Fetch run-history data from `/statistics/run_history` using the selected time window.
- [x] 3.2 Map the returned run summaries into a UI-friendly structure for KPI cards and the history table.
- [x] 3.3 Render the recent run rows in descending time order with key operational details.

## 4. Validation

- [x] 4.1 Verify the page renders correctly in the browser and the API data flows into the UI.
- [x] 4.2 Confirm the page remains read-only and does not interfere with the gallery or settings workflows.

## 5. Documentation
- [x] 5.1 Document the changes to the `public/README.md` readme file.