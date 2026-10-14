## 1. Statistics landing page

- [x] 1.1 Create a dedicated `/statistics` landing page with buttons or cards for the available statistics domains.
- [x] 1.2 Add navigation links to both the scanner-run page and the image-serve page.
- [x] 1.3 Keep the landing page lightweight, read-only, and consistent with the existing static frontend design language.

## 2. Scanner-run subpage

- [x] 2.1 Move or duplicate the existing scan-run statistics content under `/statistics/scan-runs`.
- [x] 2.2 Preserve the current time-window filtering and summary behavior for scanner history.
- [x] 2.3 Add a clear return path back to the statistics landing page.

## 3. Image-serve subpage

- [x] 3.1 Create a dedicated `/statistics/image-serves` page for image-specific aggregates.
- [x] 3.2 Fetch data from the new `/statistics/image_serves` API.
- [x] 3.3 Render total serves, rating percentages, top files, and top artists in a focused dashboard layout.
- [x] 3.4 Add a clear return path back to the statistics landing page.

## 4. Documentation and validation

- [x] 4.1 Update the public README to describe the landing page and the dedicated statistics page structure.
- [x] 4.2 Ensure each statistics page shares a consistent navigation pattern and remains easy to extend later.
- [x] 4.3 Validate that the static page structure works without breaking the existing gallery or settings flows.
