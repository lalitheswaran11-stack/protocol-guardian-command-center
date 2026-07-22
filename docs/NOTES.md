# Working notes

The dashboard uses deterministic data so I can reproduce the same validator failures and operational states while working on the interface. `createValidators()` generates the 5,000 records once, then the table filters and paginates them in the browser. The current data size does not need virtualization; I would add it before pushing the table much further.

Filters are stored in the URL because I wanted an investigation view to be shareable. The incident timeline is device-local Zustand state. Refreshing the app reproduces the base data, while completed pause simulations remain in that browser until the local store is cleared.

## Event feed

The browser uses `EventSource` against `/api/events`. Each response is a valid server-sent event and asks the client to reconnect after 4.5 seconds. A time-based sequence gives each event a stable ordering value, and `mergeProtocolEvents()` drops duplicate IDs and sorts late arrivals.

That reconnecting shape is intentional for the hosted demo. The UI does not present it as protocol telemetry; both the header and footer label the source as simulated.

## Pause simulation

The guardian drawer was the main interaction I wanted to test. It requires the exact phrase `SIMULATE PAUSE`, but the phrase is only a deliberate friction step. It is not authentication.

The result shows:

- the contract, function, caller, and required role
- the inferred gas and expected event
- the projected state change and blocked operations
- allowance effects and operational consequences

The wagmi configuration has no connectors, and the workflow never builds a signable transaction. Gas and state changes are examples rather than trace output.

## What I would change for live data

I would validate every external response at the boundary, separate beacon and execution-layer freshness, and add explicit reorg handling. A real guardian flow would also need verified ABIs, a complete access-control graph, independent simulation, and hardware-wallet or multisig review.

`npm run check` covers formatting, ESLint, TypeScript, Vitest, and the production build. Playwright remains a separate browser check.
