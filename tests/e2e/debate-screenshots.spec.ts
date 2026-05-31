import { test, Page } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * P109.1 — Visual capture of the new debate viewer. Not pass/fail — just
 * navigates the flow and saves PNGs so the change can be eyeballed without
 * opening a browser manually.
 *
 * Outputs to ./screenshots/p109-1/*.png
 */

const OUT_DIR = path.resolve("screenshots/p109-1");
fs.mkdirSync(OUT_DIR, { recursive: true });

const CHIMERA_URL = process.env.NEXT_PUBLIC_CHIMERA_URL || "http://localhost:8100";

async function snap(page: Page, name: string): Promise<void> {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  ✓ ${name} -> ${file}`);
}

test.describe.configure({ mode: "serial" });

test.describe("P109.1 screenshots", () => {
  test.beforeEach(async ({ page }) => {
    // P109.4: sessionStorage (was localStorage) per audit recommendation.
    await page.addInitScript(() => {
      window.sessionStorage.setItem("jarvis-api-key", "jarvis-demo-key");
    });
  });

  test("01 - list view (empty + populated)", async ({ page }) => {
    await page.goto("/debate");
    await page.waitForLoadState("networkidle");
    await snap(page, "01_list_view");
  });

  test("02 - existing-debate viewer (terminal state)", async ({ page }) => {
    const listRes = await page.request.get(
      `${CHIMERA_URL}/api/v1/debates/completed`
    );
    const list = await listRes.json();
    const ids: string[] = (list.debates ?? []).map((d: { debate_id: string }) => d.debate_id);
    test.skip(ids.length === 0, "no completed debates to render");
    const did = ids[0];
    const query = list.debates[0].query as string;

    await page.goto(`/debate/${encodeURIComponent(did)}?q=${encodeURIComponent(query)}`);
    // Let SSE replay populate rounds
    await page.locator("text=completed").first().waitFor({ timeout: 30_000 });
    await page.waitForTimeout(1500); // let UI settle
    await snap(page, "02_existing_debate_viewer");
  });

  test("03 - live debate progression", async ({ page }) => {
    test.setTimeout(360_000);
    await page.goto("/debate");

    const query = `P109.1 screenshot run — ${new Date().toISOString()}`;
    await page.locator("textarea").first().fill(query);
    await page
      .locator("textarea")
      .nth(1)
      .fill("placeholder local response");

    await snap(page, "03a_form_filled");

    await page.getByRole("button", { name: /Start debate/i }).click();
    await page.waitForURL(/\/debate\/debate-/, { timeout: 15_000 });
    await snap(page, "03b_just_routed");

    // wait for Round 1
    await page
      .getByRole("heading", { name: /Round 1/i })
      .waitFor({ timeout: 120_000 });
    await page.waitForTimeout(500);
    await snap(page, "03c_round1_visible");

    // wait for terminal
    await page.locator("text=completed").first().waitFor({ timeout: 240_000 });
    await page.waitForTimeout(2000);
    await snap(page, "03d_terminal_state");
  });
});
