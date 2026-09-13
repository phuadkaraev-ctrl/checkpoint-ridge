# Checkpoint Ridge

Checkpoint Ridge is an interactive, technically grounded exploration of PostgreSQL checkpoint tuning for Percona Community.

It turns one checkpoint cycle into a guided browser experience: dirty buffers, paced checkpoint writes, synchronization, the recovery boundary, first post-checkpoint full-page images, measured WAL/FPI results, tuning controls, and version-aware monitoring.

## What makes it trustworthy

- **Measured:** The four WAL and `wal_fpi` results are preserved exactly from Jobin Augustine's PostgreSQL 18 pgbench test.
- **Modeled:** Page counts, movement, timing, and pressure curves are explicitly labeled as time-compressed illustrations.
- **Operator data:** Tuning output remains directional. The app does not predict WAL volume or recovery time for another system.
- **Versioned:** Monitoring guidance distinguishes `pg_stat_bgwriter` through PostgreSQL 16 from `pg_stat_checkpointer` in PostgreSQL 17 and newer.

Read [docs/TECHNICAL_ACCURACY.md](docs/TECHNICAL_ACCURACY.md) for the complete claim boundary.

## Run locally

Requires Node.js 22 or another version supported by Vite 7.

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Validate and build

```bash
npm test
npm run typecheck
npm run build
npm run preview
```

The production site is written to `dist/`.

## Publish with GitHub Pages

The included workflow at `.github/workflows/deploy-pages.yml` tests, builds, and publishes the site whenever `main` is pushed.

1. Create a GitHub repository and push this directory to its `main` branch.
2. Open **Settings → Pages** in the repository.
3. Under **Build and deployment**, select **GitHub Actions** as the source.
4. Run the workflow or push another commit.

The Vite base path is relative, so both organization sites and project sites such as `https://OWNER.github.io/REPOSITORY/` work without changing the code.

## Project structure

```text
src/
  components/           Guided cycle, benchmark, tuning and CTA surfaces
  data.ts               Verified measurements, sources and narrative stages
  data.test.ts          Exact-value and coverage tests
public/assets/           Percona Community visual assets and fonts
docs/                    Accuracy and content documentation
.github/workflows/      GitHub Pages deployment
```

## Primary sources

- [Importance of Tuning Checkpoint in PostgreSQL](https://www.percona.com/blog/importance-of-tuning-checkpoint-in-postgresql/)
- [PostgreSQL 18 WAL Configuration](https://www.postgresql.org/docs/18/wal-configuration.html)
- [PostgreSQL 18 WAL Settings](https://www.postgresql.org/docs/18/runtime-config-wal.html)
- [PostgreSQL 18 Monitoring Statistics](https://www.postgresql.org/docs/18/monitoring-stats.html)

## Asset notes

The Percona Community logo and mountain environment come from Percona Community. Goat artwork is reused from the companion checkpoint video project supplied for this work. Inter and IBM Plex Mono are distributed under their included font licenses.

Brand assets are not granted a new license by this repository. Choose a source-code license and confirm brand-asset usage before inviting outside redistribution.
