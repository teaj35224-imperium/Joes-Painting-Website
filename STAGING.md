# Joe's Painting gallery staging

This branch is for the **existing** https://joes-services.netlify.app/ website, not a redesign.

## Verified deployment prerequisites
- Netlify Functions must be deployed from a Git-linked build.
- GitHub App is installed only on `Joes-painting-gallery`.
- The function code currently expects `GITHUB_APP_INSTALLATION_ID` (not `GITHUB_INSTALLATION_ID`).
- Other required server-only variables: `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`, `SITE_URL`.
- Never commit or upload the PEM key, OAuth client secret, or session secret to GitHub.
- The public site must be tested in a Netlify preview before production is linked or changed.

## Current status
The site and server-function files are being imported to this feature branch. No live upload/delete test has been performed. Do not connect production yet.
