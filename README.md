# Protocol Guardian Command Center

[![CI](https://github.com/lalitheswaran11-stack/protocol-guardian-command-center/actions/workflows/ci.yml/badge.svg)](https://github.com/lalitheswaran11-stack/protocol-guardian-command-center/actions/workflows/ci.yml)

[Open the live demo](https://protocol-guardian-command-center.lalitheshnarayanan.chatgpt.site)

Protocol Guardian Command Center is a read-only DeFi operations dashboard for investigating validator health, oracle reports, withdrawal pressure, permissions, and incidents.

I built it to explore how a high-risk protocol action could be reviewed without turning a dashboard into a transaction console. The pause workflow shows the caller, required role, calldata intent, estimated gas, expected state change, and user impact before it accepts the confirmation phrase.

## Demo path

1. Filter the 5,000-row validator table and open a validator record.
2. Watch the simulated event feed update.
3. Open **SIMULATE PAUSE**, review the consequences, and enter the confirmation phrase.

Everything shown in the dashboard is simulated. There are no wallet connectors, signing calls, or transaction broadcasts.

## Highlights

- Protocol health metrics and trend charts
- Searchable 5,000-validator data set, URL-persisted filters, and CSV export
- Sequenced server-sent events with duplicate and ordering guards
- Oracle review, withdrawal stress controls, and an incident timeline
- Typed-confirmation emergency simulation
- Responsive light and dark themes

![Protocol overview](docs/screenshots/overview.jpg)

![Guardian simulation](docs/screenshots/guardian-simulation.jpg)

## Run locally

Requires Node.js 22 or newer.

```bash
npm ci
npm run check
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No wallet or secret is required.

Browser tests require Playwright's Chromium binary:

```bash
npx playwright install chromium
npm run test:e2e
```

See [my implementation notes](docs/NOTES.md) for the fixture model, event handling, and the choices behind the pause flow.

## Repository map

```text
src/components/   dashboard sections and interaction components
src/lib/          fixture generation, filtering, event handling, and local workflow state
src/app/api/      simulated server-sent event route
e2e/              Playwright workflows
docs/             implementation notes and screenshots
```
