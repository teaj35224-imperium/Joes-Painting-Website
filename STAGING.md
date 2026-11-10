# Joe's Painting staging checklist

This is a development branch. Do not deploy to the live site until all checks pass.

## Completed in repository
- Homepage markup, owner dashboard, public gallery loader
- GitHub OAuth callback and session handling
- GitHub App installation-token flow and owner-only photo mutation API
- Removed local references to project-1.jpg, project-2.jpg, and project-3.jpg so there are no missing-image placeholders

## Required environment variables (Netlify server-side)
- `SITE_URL`: the exact HTTPS origin of the **test deployment** (OAuth callback must match)
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`: GitHub OAuth app credentials for owner login
- `GITHUB_APP_ID`, `GITHUB_APP_INSTALLATION_ID`, `GITHUB_APP_PRIVATE_KEY`: GitHub App credentials for repository-limited photo writes
- `SESSION_SECRET`: cryptographically random string, minimum 32 bytes
- Do not commit private keys or secrets. Do not put secrets in frontend files or build logs.

## Preflight blockers
1. Site is not yet confirmed connected to this GitHub repository in Netlify. Preview deploy is required.
2. OAuth redirect URI must match the exact test URL and GitHub OAuth app configuration. A Netlify deploy-preview subdomain cannot be assumed to work with the production callback.
3. GitHub App private key has not been configured or verified securely.
4. Live GitHub sign-in, session rejection, upload, delete, and public-gallery visibility are untested.
5. Confirm owner account login and GitHub App installation repository access.
6. Verify Netlify function runtime recognizes .cjs files, and review the implementation before production.
7. Ensure original site design matches user expectations.

## Tests to perform on staging
- Anonymous visitor cannot GET/POST gallery-admin; owner can sign in.
- Non-owner GitHub account cannot sign in.
- Forged OAuth state rejected; invalid or expired cookie rejected.
- Cross-origin mutation rejected; upload of nonimage bytes rejected.
- Upload a small JPG, PNG, and WebP; confirm image visible to anonymous visitor.
- Delete one photo; confirm removed from GitHub and public gallery after cache refresh.
- Verify iPhone Safari upload flow, sign-out, and failed-network handling.

Never enable real customer-facing uploads until these checks pass.
