# SOJU Neck Research Survey

A static React, TypeScript, Vite, and WebGL survey for measuring perceived neck width in one fixed research portrait. The participant moves an unlabeled numeric slider from narrower to wider; the normalized value is available only to an authorized embedding parent.

The application is deliberately client-only: it has no machine learning, image detection, backend, persistence, or analytics.

## Prerequisites and setup

- Node.js 22 (the version used by the deployment workflow)
- npm
- A browser with WebGL support

Install the locked dependency tree:

```bash
npm ci
```

For intentional dependency updates, use `npm install` and commit the resulting `package-lock.json` change.

## Local development

Start Vite on all local interfaces:

```bash
npm run dev
```

Open the URL printed by Vite. During development only, an unset `VITE_PARENT_ORIGIN` enables a permissive `"*"` messaging target so local hosts on arbitrary ports can embed the app. This fallback must not be used as a production configuration.

Useful checks:

```bash
npm run typecheck
npm run build
npm run preview
```

`npm run build` type-checks the project and writes the production-ready static site to `dist/`. `npm run preview` serves that output locally; it is a validation server, not a production deployment mechanism.

## Width representation and deformation

The response is a normalized number from `-1` (narrowest) through `0` (unaltered) to `1` (widest), in steps of `0.01`. The numeric value is intentionally not rendered in the participant interface.

`src/config/stimulus.ts` defines `maxWidthDelta`, currently `0.20`. Consequently the endpoints produce a configurable ±20% change relative to the contour's half-width. The renderer changes mesh X coordinates only and resets target Y coordinates to their source values; vertical movement is outside the study invariant.

## Geometry calibration

The calibration UI is a developer/researcher tool, not a participant view.

1. Run `npm run dev`.
2. Open `/calibrate` (or append `?debug=1` to the main URL).
3. Drag the neck contour nodes, centerline, and influence boundaries. Coordinates are normalized to the fixed portrait.
4. Use **Preview deformation** throughout the full slider range.
5. Select **Export replacement geometry.json** and, after review, replace `public/stimulus/geometry.json` with the download.
6. Rebuild and repeat the visual-validation procedure below.

Calibration output is not self-approving. Before every release involving the portrait, geometry, shader, mesh, or deformation settings, a researcher must visually approve the final geometry and endpoint quality at **all five normalized widths: `-1`, `-0.5`, `0`, `0.5`, and `1`**.

## Iframe protocol

The app communicates only with its immediate `window.parent` using `postMessage`. Messages are plain objects.

Survey to parent:

```ts
{ source: 'neck-width-survey', type: 'ready' }
{ source: 'neck-width-survey', type: 'width-change', value: number }
{ source: 'neck-width-survey', type: 'value', value: number }
```

- `ready` is sent after the portrait and renderer initialize.
- `width-change` is sent after participant input.
- `value` is the response to a valid `get-value` request.
- Every value is finite and clamped to `[-1, 1]`.

Parent to survey:

```ts
{ source: 'parent-survey', type: 'get-value' }
```

The survey accepts that request only from its immediate parent and, when configured, only from the exact allowed origin. It stores no interaction history. Run the development server and open `/iframe-host.html` for a small host page that logs the protocol messages.

## `VITE_PARENT_ORIGIN`

Set `VITE_PARENT_ORIGIN` at **build time** to the exact origin allowed to embed the production survey:

```bash
VITE_PARENT_ORIGIN=https://research.example.org npm run build
```

Use only the origin (scheme, hostname, and optional port), with no path, query, or fragment. A trailing slash is tolerated. The application rejects path-bearing values and refuses to initialize production iframe messaging when the variable is absent. Because Vite variables are compiled into public browser code, this setting is an allowlist, not a secret.

## GitHub Pages deployment

The workflow at `.github/workflows/deploy-pages.yml` builds and deploys on pushes to `main`, and can also be run manually.

Repository configuration:

1. In **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source.
2. In **Settings → Secrets and variables → Actions → Variables**, create `VITE_PARENT_ORIGIN` with the production embedding page's exact origin. Use an Actions variable, not a secret: the value necessarily appears in the client bundle.
3. Push to `main`, or run **Deploy static survey to GitHub Pages** from the Actions tab.
4. Confirm both the build and `github-pages` deployment jobs succeed.

Vite derives the project base path from GitHub Actions' `GITHUB_REPOSITORY` (for example, `owner/soju-neck-research-survey` becomes `/soju-neck-research-survey/`). Source code loads assets through `import.meta.env.BASE_URL`, so the repository name is not duplicated in asset paths. To override this behavior—for example, for an apex/custom-domain site—set `VITE_BASE_PATH=/` for the build. A non-root override such as `VITE_BASE_PATH=my-path` is normalized to `/my-path/`.

## Manual visual validation

Automated type-checking and compilation cannot establish perceptual stimulus quality. After a production build, serve it with `npm run preview` and have a researcher perform this checklist in the supported desktop browser(s):

1. Verify the fixed portrait loads at both the root deployment URL and, when applicable, the GitHub Pages repository subpath.
2. Inspect widths `-1`, `-0.5`, `0`, `0.5`, and `1`; keyboard arrow keys can place the slider precisely in `0.01` increments.
3. At each width, inspect both neck contours, jaw transitions, shoulders, clothing, hair, and background for seams, folds, stretching, or discontinuities.
4. Confirm `0` matches the undeformed source and that deformation is horizontal only, with no vertical image movement.
5. Confirm the two endpoints remain plausible and represent the intended configurable ±20% default.
6. Confirm no numeric width is visible to the participant.
7. Embed the production build from the configured parent origin; confirm `ready`, `width-change`, and requested `value` messages, then verify messages from an unauthorized origin are ignored.
8. Record explicit researcher approval of the geometry and all five widths in the study's release documentation. Do not treat a successful build or developer review as research approval.
