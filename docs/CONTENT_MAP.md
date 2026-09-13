# Experience and claim map

| Scenario | Interaction | Technical point | Evidence class |
| --- | --- | --- | --- |
| System map | Orbit and select seven districts | Checkpoint behavior connects memory, WAL, storage, recovery metadata, and replicas | Concept |
| Checkpoint path | Play or scrub six guided phases | Dirty pages are paced toward storage, files are synchronized, and the redo boundary advances | Concept |
| FPI wave | Follow the goat along the spike line | The first modification of each page after a checkpoint can log a full-page image | Concept |
| Measured test | Select 5, 15, 30, or 60 minutes | Exact WAL and `wal_fpi` results from the fixed PostgreSQL 18 test | Measured |
| Tuning console | Change three PostgreSQL controls | Timeout, WAL headroom, and completion pacing interact; WAL pressure can request an earlier checkpoint | Directional model |
| Recovery ground | Play or scrub WAL replay | Checkpoint gap is not recovery duration; replay volume and throughput determine the work | Measured examples + concept |
| Inspector | Select any district | Exposes the role and technical boundary of the selected subsystem | Operational explanation |
| Monitoring | Read the version-aware checklist | Logs and statistics verify actual checkpoint behavior | Operational guidance |
| Continue | Open the analysis, Slack, or community | Move from the model to source material and practitioner discussion | CTA only |
