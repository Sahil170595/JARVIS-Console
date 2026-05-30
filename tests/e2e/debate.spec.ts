import { test, expect, Page } from "@playwright/test";

/**
 * P109.1 — Debate viewer end-to-end smoke.
 *
 * Asserts the new /debate surface in jarvis-console is feature-equivalent to
 * the retired Tauri DebateViewer:
 *
 * 1. /debate list view renders (form + completed-list section, nav has Debate)
 * 2. Form submit POSTs to chimera-backend, routes to /debate/[id]
 * 3. SSE events render rounds + per-model responses as they arrive
 * 4. Terminal state (debate_complete) updates status indicator + final_response
 * 5. /debate/[id] for an already-completed debate renders historical rounds
 */

const CHIMERA_URL = process.env.NEXT_PUBLIC_CHIMERA_URL || "http://localhost:8100";

async function waitForChimera(page: Page): Promise<void> {
  // Sanity-check chimera is reachable before each test (saves debugging mystery
  // failures when only jarvis-console is up).
  const res = await page.request.get(`${CHIMERA_URL}/health`);
  expect(res.status(), `chimera /health must be 200 at ${CHIMERA_URL}`).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("healthy");
}

test.describe("debate viewer (P109.1)", () => {
  test.beforeEach(async ({ page }) => {
    // Bypass the LoginDialog — jarvis-console requires an API key in
    // localStorage.jarvis-api-key (default demo key configured in
    // JARVIS_MASTER_KEYS env on the docker-compose stack).
    await page.addInitScript(() => {
      window.localStorage.setItem("jarvis-api-key", "jarvis-demo-key");
    });
    await waitForChimera(page);
  });

  test("list view: nav, header, form, completed-list section render", async ({ page }) => {
    await page.goto("/debate");
    await expect(page).toHaveTitle(/JARVIS Console/);

    // Sidebar nav has the new Debate link
    await expect(page.getByRole("link", { name: /^Debate$/ })).toBeVisible();

    // Header — `name` is fuzzy by default; use exact + level to disambiguate
    // from the "Start a new debate" / "Completed debates" h2 headings.
    await expect(
      page.getByRole("heading", { name: "Debate", exact: true, level: 1 })
    ).toBeVisible();

    // Form
    await expect(page.getByText("Start a new debate")).toBeVisible();
    await expect(page.getByText("Query", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: /Start debate/i })).toBeVisible();

    // Completed-list section header (h2, exact-name so we don't conflict
    // with the empty-state paragraph "No completed debates yet…").
    await expect(
      page.getByRole("heading", { name: "Completed debates", exact: true })
    ).toBeVisible();
  });

  test("existing-debate /debate/[id]: hits chimera /api/v1/debate/{id}/result + renders rounds", async ({ page }) => {
    // Use the API to find an existing completed debate.
    const listRes = await page.request.get(
      `${CHIMERA_URL}/api/v1/debates/completed`
    );
    const list = await listRes.json();
    const ids: string[] = (list.debates ?? []).map((d: { debate_id: string }) => d.debate_id);
    test.skip(
      ids.length === 0,
      "no completed debates in chimera; run the live-debate test first"
    );
    const did = ids[0];

    await page.goto(`/debate/${encodeURIComponent(did)}`);

    // ID rendered in header
    await expect(page.getByText(did, { exact: false })).toBeVisible();

    // Back link
    await expect(page.getByRole("button", { name: /All debates/i })).toBeVisible();

    // Stats block ALWAYS renders (state/round/consensus/total-cost) even
    // before SSE arrives. The "state" label only appears here in the page.
    await expect(page.getByText(/^state$/)).toBeVisible();

    // For completed debates, SSE replay will quickly yield the final state.
    // Give it up to 20s for status to stabilize.
    await expect(
      page.locator("text=completed").first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test("live debate: start → SSE → renders rounds → terminal state", async ({ page }) => {
    // Override Playwright's 30s default test timeout — local Ollama debates
    // take 100-200s end-to-end depending on round count + model size.
    test.setTimeout(360_000);

    await page.goto("/debate");

    // Fill the form with a deterministic query
    const query = `P109.1 playwright e2e — ${Date.now()}`;
    const queryBox = page.locator("textarea").first();
    await queryBox.fill(query);

    // Local response (second textarea)
    const localResp = page.locator("textarea").nth(1);
    await localResp.fill("placeholder local response");

    // Click start
    await page.getByRole("button", { name: /Start debate/i }).click();

    // Should route to /debate/<id>
    await page.waitForURL(/\/debate\/debate-/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/debate\/debate-/);

    // Query is rendered as the heading
    await expect(page.getByText(query)).toBeVisible({ timeout: 10_000 });

    // Status dot starts as connecting/live
    await expect(
      page.locator("text=/(live|connecting|started|running)/i").first()
    ).toBeVisible({ timeout: 10_000 });

    // Wait for at least one Round 1 card to appear. Local Ollama runs each
    // debate round in ~20-50s; give the first round 2 minutes worst-case.
    await expect(page.getByRole("heading", { name: /Round 1/i })).toBeVisible({
      timeout: 120_000,
    });

    // Wait for terminal state. Empirical baseline: 2-round debates against
    // local Ollama take ~100s; give 4 minutes worst-case.
    await expect(page.getByText("completed").first()).toBeVisible({
      timeout: 240_000,
    });

    // Final response section should render
    await expect(page.getByRole("heading", { name: /Final response/i })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("P109.2 — cancelled debate transitions UI to terminal state (no hang)", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/debate");

    // Start a debate so we have a live one to cancel
    await page.locator("textarea").first().fill(`P109.2 cancel test — ${Date.now()}`);
    await page.locator("textarea").nth(1).fill("placeholder");
    await page.getByRole("button", { name: /Start debate/i }).click();
    await page.waitForURL(/\/debate\/debate-/, { timeout: 15_000 });

    // Wait for the live indicator + Cancel button to appear (debate is running)
    await expect(page.getByRole("button", { name: /Cancel/i })).toBeVisible({
      timeout: 30_000,
    });

    // Click Cancel — should fire POST /api/v1/debate/{id}/cancel,
    // chimera emits `debate_cancelled` SSE, hook applies it, UI transitions
    // to terminal "cancelled" state (Cancel button hidden, dot turns rose).
    await page.getByRole("button", { name: /Cancel/i }).click();

    // P109.2 fix: without the debate_cancelled handler the UI would hang.
    // With it, the cancelled status appears within a few seconds.
    await expect(page.locator("text=/^cancelled$/").first()).toBeVisible({
      timeout: 60_000,
    });

    // And the Cancel button disappears (terminal=true)
    await expect(page.getByRole("button", { name: /Cancel/i })).not.toBeVisible();
  });

  test("P109.2 — metadata bar shows round X/N, not round X/0", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/debate");
    await page.locator("textarea").first().fill(`P109.2 total_rounds test — ${Date.now()}`);
    await page.locator("textarea").nth(1).fill("placeholder");

    // Set max_rounds = 2 explicitly so we know what the expected display is.
    const roundsInput = page.locator("input[type=number]").first();
    await roundsInput.fill("2");

    await page.getByRole("button", { name: /Start debate/i }).click();
    await page.waitForURL(/\/debate\/debate-/, { timeout: 15_000 });

    // After /status fetch lands (fired on debate_started), total_rounds
    // should be 2. The metadata "round" cell should NOT say "0/0" or "X/0".
    // It should show either "0/2" (pre-round-1) or "1/2" (mid debate) or
    // "2/2" (terminal).
    await expect(async () => {
      const roundCell = page.locator("p:has-text('round')").first();
      const sibling = roundCell.locator("xpath=following-sibling::p[1]");
      const text = await sibling.textContent();
      // Must NOT match "X/0" pattern. Must match "X/2".
      if (!text || /\/0\s*$/.test(text) || !/\/2/.test(text)) {
        throw new Error(`expected metadata round to be 'X/2', got '${text}'`);
      }
    }).toPass({ timeout: 30_000 });
  });
});
