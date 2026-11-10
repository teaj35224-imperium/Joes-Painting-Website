# Joe's Painting Website

Source repository for https://joes-services.netlify.app/

## Deployment status
The existing Netlify production website is **not yet linked** to this repository. Do not connect or redeploy until the recovered website assets and secure gallery integration are committed and tested.

## Project structure
- Public customer website: existing layout and project photos are preserved in the recovered Netlify deployment archive.
- Public gallery images: separate repository `teaj35224-imperium/Joes-painting-gallery`.
- Owner-only photo management: planned secure server-side integration; **not live**.

## Security requirements
- Never commit GitHub OAuth client secrets, GitHub App private keys, access tokens, or session encryption keys.
- Do not use a broad `public_repo` OAuth token for the owner dashboard.
- Use a GitHub App installed only on the gallery repository with minimal Contents permission.
- Validate owner identity and CSRF on every upload/delete operation; keep credentials server-side.
- Deploy only after checking Netlify Functions and authentication end-to-end.

## Next steps
1. Import the original Netlify deployment files, including the three existing images.
2. Implement and test the least-privilege owner authentication and image-management functions.
3. Configure required credentials privately in Netlify.
4. Connect this repository to Netlify and verify a preview deploy before changing production.
