# Experience and claim map

| Scenario | Interaction | Technical point | Evidence class |
| --- | --- | --- | --- |
| System map | Orbit and select seven districts | Checkpoint behavior connects memory, WAL, storage, recovery metadata, and replicas | Concept |
| Checkpoint path | Play or scrub six guided phases | Dirty pages are paced toward storage, files are synchronized, a checkpoint record and `pg_control` identify the recovery boundary, and first changes can add FPIs | Concept |
| FPI wave | Follow the goat, chart, meter, and HUD on one shared signal | The first modification of each page after a checkpoint can log a full-page image | Concept |
| Measured test | Select 5, 15, 30, or 60 minutes | Exact WAL and `wal_fpi` results from the fixed PostgreSQL 18 test | Measured |
| Tuning console | Change three PostgreSQL controls plus an illustrative WAL rate | The earlier modeled trigger—timeout or soft WAL target—sets the effective interval; completion target changes pacing | Directional model |
| Recovery ground | Play or scrub local WAL replay and inspect the separate HA branch | Checkpoint gap is not recovery duration; primary crash recovery and standby promotion are distinct paths | Observed logs + concept |
| Inspector | Select any district | Exposes the role and technical boundary of the selected subsystem | Operational explanation |
| Monitoring | Read the version-aware checklist | Logs and statistics verify actual checkpoint behavior | Operational guidance |
| Continue | Open the analysis, Slack, or community | Move from the model to source material and practitioner discussion | CTA only |
