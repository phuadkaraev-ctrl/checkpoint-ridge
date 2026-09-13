# Checkpoint Ridge

Checkpoint Ridge is a one-screen, orbitable 3D field lab for understanding PostgreSQL checkpoint tuning. It translates the checkpoint system into a connected landscape: clients, `shared_buffers`, WAL, the checkpointer, storage, `global/pg_control`, and a physical standby.

The experience was built for Percona Community and follows the technical sequence and measured PostgreSQL 18 test in [Importance of Tuning Checkpoint in PostgreSQL](https://www.percona.com/blog/importance-of-tuning-checkpoint-in-postgresql/).

## Experience

- Orbit, pan, and zoom through seven clickable PostgreSQL districts.
- Run a guided checkpoint from dirty buffers through paced writes, file synchronization, the redo boundary, and the post-checkpoint FPI wave.
- Follow the jumping goat along the same conceptual spike line it explains.
- Compare the four exact `pgbench` WAL and `wal_fpi` observations.
- Explore `checkpoint_timeout`, `max_wal_size`, and `checkpoint_completion_target` in a clearly labeled directional model.
- Walk the recovery ground and distinguish local crash recovery from the separate standby-failover path.
- Keep the full system map and scenario controls available in a labeled 2D compatibility view when WebGL is unavailable.
- Use the version-aware monitoring checklist and continue into the full post or Percona Community.

## Evidence boundary

Checkpoint Ridge distinguishes four classes of information directly in the interface:

- **Measured:** Exact values from the four published test runs.
- **Concept:** Time-compressed mechanism and pressure animations with no measured axis.
- **Directional model:** Tuning controls that explain relationships without predicting another system.
- **Observed + concept:** Published recovery-log observations paired with a clearly separated explanatory animation.

Read [docs/TECHNICAL_ACCURACY.md](docs/TECHNICAL_ACCURACY.md) for the complete claim boundary.

## Run locally

Requires Node.js 22 or another version supported by Vite 7.

```bash
npm install
npm run dev
```

## Validate and build

```bash
npm test
npm run typecheck
npm run build
```

The production build is written to `dist/`. The GitHub Pages workflow tests and builds every push to `main` before deployment.

## Project structure

```text
src/
  components/WorldCanvas.tsx   3D districts, paths, camera and goat wave
  components/WorldFallback.tsx Interactive 2D compatibility map
  components/                  HUD, inspector, minimap and scenario rail
  data.ts                      Verified facts, exact measurements and copy
  simulation.ts                Bounded conceptual/directional model state
  data.test.ts                 Exact-value, coverage and bounds tests
public/assets/                 Percona visual assets and local fonts
docs/                          Accuracy and experience maps
.github/workflows/             GitHub Pages deployment
```

## Primary sources

- [Importance of Tuning Checkpoint in PostgreSQL](https://www.percona.com/blog/importance-of-tuning-checkpoint-in-postgresql/)
- [PostgreSQL 18 WAL Configuration](https://www.postgresql.org/docs/18/wal-configuration.html)
- [PostgreSQL 18 WAL Settings](https://www.postgresql.org/docs/18/runtime-config-wal.html)
- [PostgreSQL 18 Monitoring Statistics](https://www.postgresql.org/docs/18/monitoring-stats.html)

## Assets

The Percona Community logo and mountain artwork come from Percona Community. Goat artwork was supplied for the companion checkpoint video. Inter and IBM Plex Mono are distributed under the included font license. Brand assets are not granted a new license by this repository.
