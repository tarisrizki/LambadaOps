# Playwright E2E Testing

This repository is configured with Playwright for End-to-End testing.

## 1. Installation

Dependencies (`playwright`, `@playwright/test`) are managed via `bun`. If you haven't installed them yet:

```bash
bun install
```

## 2. Browser Installation

Playwright requires specific browser binaries to run tests. Install them by running:

```bash
bunx playwright install --with-deps
```

This installs Chromium, Firefox, WebKit, and their system dependencies.

## 3. Environment Setup

Ensure your local `.env` files are configured correctly for both `apps/api` and `apps/web`.
Playwright will automatically start the backend (`localhost:3001`) and frontend (`localhost:3000`) servers using the commands defined in `playwright.config.ts`.
You can also run them manually if you prefer.

If you need to override the base URL, you can do so by passing `BASE_URL`:
```bash
BASE_URL=https://staging.example.com bun run test:e2e
```

## 4. How to Execute Tests

You can execute tests using the npm/bun scripts configured in `package.json`:

- **Headless Mode** (Default): Run all tests invisibly in the background.
  ```bash
  bun run test:e2e
  ```
- **Headed Mode**: Run tests with browser windows visible.
  ```bash
  bun run test:e2e:headed
  ```
- **UI Mode**: Open the interactive Playwright UI to explore, run, and debug tests step-by-step.
  ```bash
  bun run test:e2e:ui
  ```
- **Debug Mode**: Run tests in debug mode.
  ```bash
  bun run test:e2e:debug
  ```

## 5. Reporting and Traces

### Playwright HTML Report
Playwright automatically generates an HTML report on failure (or you can force it). To view it:
```bash
bun run test:e2e:report
```

### Playwright Trace Viewer
Playwright captures traces (DOM snapshots, network requests, console logs) on failure. You can view these traces using:
```bash
bun run test:e2e:trace
```
*Note: This command requires you to select the specific `.zip` trace file when prompted, or pass it as an argument.*

## 6. Troubleshooting

- **Server Timeout**: If Playwright fails to start the `webServer`, ensure no dangling node processes are blocking ports `3000` or `3001`.
- **Authentication Issues**: The suite uses `tests/e2e/auth.setup.ts` (if available) to generate `playwright/.auth/user.json` for storage state. Ensure your test database has the correct seeded user.
- **Retries and Traces**: Tests will retry once on failure. Traces, screenshots, and videos are retained **only on failure** to save disk space.
