# Study release record

## Candidate: ±12% endpoint range

| Field | Value |
| --- | --- |
| Approved `maxWidthDelta` | Pending researcher approval (candidate: `0.12`) |
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

### Developer comparison outcome

The ±12% candidate was rebuilt and captured at all five normalized widths on 2026-08-08 using the environment above. Border-aligned developer inspection found the narrow endpoint visibly narrower without the earlier pinched appearance and the wide endpoint visibly wider while retaining the jaw-to-neck indentation. Pixel comparison against the neutral capture localized all changes to the intended central deformation region; no changed pixels reached the image border. This is a readiness assessment only, not researcher approval.

### Required researcher decision

Before this candidate is released, a researcher must independently inspect all five aligned images and record:

- whether `-1.00` is visibly narrower without looking pinched;
- whether `+1.00` is visibly wider without substantially eliminating the jaw-to-neck indentation;
- whether the face, jaw, collar corners, shoulders, and outer torso remain stationary;
- whether geometry, deformation quality, and background continuity are acceptable at every captured width; and
- an explicit approval or rejection of `maxWidthDelta: 0.12`.

The earlier `maxWidthDelta: 0.15` comparison was not advanced because developer review found that the wide endpoint substantially weakened the jaw-to-neck indentation. The current `0.12` candidate must receive independent researcher approval at both endpoints before release; do not describe it as approved based on automated checks or developer review.
