## Purpose

This capability gives the statistics area a clearer structure by separating scanner-run metrics from other analytics domains and providing a landing page for discovery and navigation.

## ADDED Requirements

### Requirement: Statistics landing page is available
The system SHALL provide a dedicated landing page for statistics that lets operators choose between the different statistics domains.

#### Scenario: Opening the statistics landing page
- **WHEN** a user navigates to `/statistics`
- **THEN** the system renders a page with clear navigation options for the available statistics views
- **AND** the page remains lightweight and focused on routing to the relevant dashboards

#### Scenario: Choosing a statistics domain
- **WHEN** a user selects a statistics area from the landing page
- **THEN** the system navigates to the corresponding subpage for that domain

### Requirement: Scanner-run statistics have a dedicated page
The system SHALL provide a dedicated scanner-run statistics page that displays historical scanner activity without mixing it with other analytics categories.

#### Scenario: Viewing scan run statistics
- **WHEN** a user opens `/statistics/scan-runs`
- **THEN** the page presents the existing scanner run history and related metrics for that domain
- **AND** the view remains focused on scanner execution data rather than image-serving analytics

### Requirement: Image serve statistics have a dedicated page
The system SHALL provide a dedicated image-serve statistics page for random-image usage metrics.

#### Scenario: Viewing image serve statistics
- **WHEN** a user opens `/statistics/image-serves`
- **THEN** the page presents image-serving aggregates and summary metrics for the selected time range
- **AND** the page is distinct from the scan-run summary page

### Requirement: Statistics pages are discoverable and navigable
The system SHALL make it easy for operators to move between the landing page and subordinate statistics pages.

#### Scenario: Moving between statistics views
- **WHEN** a user is viewing one statistics page
- **THEN** the system provides a clear route back to the landing page or to another statistics domain
- **AND** navigation remains consistent across all statistic subpages
