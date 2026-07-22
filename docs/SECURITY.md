# Security and trust assumptions

## Current controls

- Wallet connectors are disabled and no key material is requested or stored.
- All guardian actions default to “do not broadcast.”
- The exact phrase `SIMULATE PAUSE` is required before the simulation runs.
- Simulated results distinguish inferred state changes from confirmed RPC output.
- The event reducer rejects duplicate event IDs and orders late events by sequence.
- Local persistent state contains incident timeline entries, never credentials.

## Trust assumptions

- Seed and stream data are mock inputs, not canonical chain state.
- The browser clock controls timestamps and staleness presentation.
- The optional Sepolia endpoint is read-only and may be unavailable or rate-limited.
- Gas and state-diff estimates are examples until a trace-capable local/testnet RPC is integrated.

## Threats not yet addressed

- Compromised frontend delivery, dependency supply-chain attacks, RPC equivocation, reorg handling, and cross-source consensus.
- Full ABI validation and runtime schema validation for external production inputs.
- Hardware-wallet or multisig transaction review.
- Formal access-control graph analysis.

The project has not received a production security audit.
