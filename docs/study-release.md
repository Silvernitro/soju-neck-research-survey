# Study release record

## Candidate: ±15% endpoint range

| Field | Value |
| --- | --- |
| Approved `maxWidthDelta` | Pending researcher approval (candidate: `0.15`) |
| Geometry revision | Git blob `4e6414cb909e1aaab97944a33cbca6a5ec2b8a41` (`public/stimulus/geometry.json`, unchanged during this endpoint comparison) |
| Deployment commit | This release record's Git commit; GitHub Pages deployment pending |
| Capture environment | Chromium; 1440 × 1200 CSS-pixel viewport; browser zoom 100%; device scale factor 1; page scroll `(0, 0)` |
| Canvas dimensions | 410 × 549.09375 CSS pixels; 410 × 550 captured pixels |
| Researcher decision | Pending — code checks and developer image inspection are not research approval |

### Controlled comparison captures

All five captures use the same production build, viewport, browser zoom, device scale factor, scroll position, and canvas crop. Because each image is cropped to the exact canvas border, the captures can be compared by directly overlaying their borders. The image captures are release-review artifacts and are intentionally stored outside the source repository.

| Normalized width | Release artifact location |
| ---: | --- |
| `-1.00` | Pending researcher record |
| `-0.50` | Pending researcher record |
| `0.00` | Pending researcher record |
| `+0.50` | Pending researcher record |
| `+1.00` | Pending researcher record |

### Required researcher decision

Before this candidate is released, a researcher must independently inspect all five aligned images and record:

- whether `-1.00` is visibly narrower without looking pinched;
- whether `+1.00` is visibly wider without substantially eliminating the jaw-to-neck indentation;
- whether the face, jaw, collar corners, shoulders, and outer torso remain stationary;
- whether geometry, deformation quality, and background continuity are acceptable at every captured width; and
- an explicit approval or rejection of `maxWidthDelta: 0.15`.

If the narrow endpoint is rejected as artificial, change only `maxWidthDelta` to `0.12`, rebuild, repeat the controlled capture under the same conditions, and obtain independent approval of both endpoints. Prefer `0.15` unless the researcher rejects it; do not describe either candidate as approved based on automated checks or developer review.
