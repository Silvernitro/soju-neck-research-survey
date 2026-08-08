# Repository working agreement

These rules apply to the entire repository.

## Research and product scope

- This survey operates on the single fixed portrait in `public/stimulus/portrait.jpg`. Do not add image upload, camera capture, portrait selection, or arbitrary-image support.
- Keep the implementation deterministic and entirely client-side. Do not add machine learning, face or landmark detection, analytics, participant-history storage, a database, or any backend service.
- Represent the participant response as a normalized width in `[-1, 1]`. The numeric response must remain hidden from participants even though it may be exposed to the embedding parent through the documented iframe protocol.
- The default endpoint deformation is configurable and maps normalized `-1` and `1` to `-20%` and `+20%` neck width (`maxWidthDelta: 0.20`). Do not hard-code that scale elsewhere.
- Deformation is horizontal only: rendering may change mesh X coordinates, but every target Y coordinate must remain equal to its source Y coordinate.

## Calibration and approval

- Geometry is normalized to the portrait dimensions and maintained in `public/stimulus/geometry.json` through the developer calibration view.
- Code checks cannot approve stimulus quality. A researcher must visually approve final geometry, deformation quality, background continuity, and both endpoints at normalized widths `-1`, `-0.5`, `0`, `0.5`, and `1` before release.

## Deployment

- The participant survey must remain a static Vite build deployable from `dist/` to GitHub Pages.
- Keep asset URLs compatible with Vite's configured base path; do not duplicate the repository name in source asset paths.
- Production embedding must use an explicit `VITE_PARENT_ORIGIN`. Preserve origin and source validation in the iframe messaging protocol.
