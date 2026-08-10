# Proposal: Secure image endpoints

What: Add robust path and file validation for the `/img/random` and `/img/file` API endpoints. Ensure that when the database points to a filesystem path or random entry, the server verifies the file is allowed, exists, and is safe to serve.

Why: Currently the endpoints trust the stored path or random DB entry and may expose files outside the intended image directory or serve unexpected content (directory traversal, symlink attacks, non-image files). This change prevents data leakage and content abuse by validating canonical paths, enforcing an allowlist root, and verifying content types.

Scope:
- Update server-side validation logic used by `/img/random` and `/img/file`.
- Add a small `path`/`file` validation utility and unit tests.
- Update docs and add minimal integration tests to exercise edge cases.
