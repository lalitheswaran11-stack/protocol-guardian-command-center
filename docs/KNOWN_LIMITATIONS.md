# Known limitations

- All protocol, validator, permission, incident, and event data is simulated.
- The validator table uses pagination rather than DOM virtualization.
- Wallet connectors and transaction writes are disabled.
- Gas and state changes in the guardian workflow are inferred, not returned by a trace-capable RPC.
- Saved views and multi-column sorting are not implemented.
- The permission view shows a focused relationship set rather than a complete access-control graph.
- Simulation-speed controls restart the stream but do not alter the server's emission interval.
- Playwright browser binaries must be installed separately before running the end-to-end suite.
