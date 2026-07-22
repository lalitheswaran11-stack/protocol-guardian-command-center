# Testing

Run the standard validation suite with:

```bash
npm run check
```

This runs ESLint, TypeScript, Vitest, and a production Next.js build. Unit tests cover metric formatting, repeatable validator generation, combined search and filters, the guardian confirmation phrase, and event ordering.

Browser tests cover validator investigation, oracle review, pause simulation, withdrawal stress, and stream controls:

```bash
npm run build
npx playwright install chromium
npm run test:e2e
```

GitHub Actions runs `npm run check` for pushes to `main` and for pull requests.

For deployment, set `NEXT_PUBLIC_RPC_URL` only when a read-only Sepolia endpoint is needed. Demo mode requires no secrets.
