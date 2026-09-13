# Experience and claim map

| Experience | User action | Technical point | Evidence class |
| --- | --- | --- | --- |
| Build pressure | Play or scrub the guided cycle | Transactions can leave dirty pages in `shared_buffers` | Modeled mechanism |
| Spread the write | Continue through checkpoint work | Checkpoint writes are paced across the completion window | Modeled mechanism |
| Synchronize | Observe the separate sync phase | Writing and final synchronization are distinct phases | Modeled mechanism |
| Advance the boundary | Inspect `global/pg_control` state | Recovery begins from the recorded redo location; WAL recycling remains conditional | Modeled mechanism |
| Watch the first change | Follow the jumping goat and FPI blocks | The first modification of each page after a checkpoint can log a full-page image | Modeled mechanism |
| Compare workload | Select 5, 15, 30, or 60 minutes | Exact WAL and `wal_fpi` results from the fixed PostgreSQL 18 test | Measured |
| Tune controls | Change the three PostgreSQL parameters | The parameters interact; WAL pressure can request an earlier checkpoint | Illustrative model |
| Verify the pace | Select a PostgreSQL version | Logs and statistics confirm real checkpoint behavior | Operational guidance |
| Continue | Open the analysis or community links | Read the full technical source and discuss real measurements | CTA only |
