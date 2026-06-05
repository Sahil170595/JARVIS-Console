import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * P117 — accessibility regression gate.
 *
 * Scans every console route with axe-core (WCAG 2.0/2.1 A + AA) and fails on
 * serious/critical violations. This is static a11y (landmarks, labels, roles,
 * name/role/value, contrast) and does NOT require the chimera/JARVIS backend —
 * pages render their loading/empty/error states, which are still scannable.
 *
 * P109's a11y was lost in the Tauri→Next port precisely because nothing guarded
 * it; this is that guard. Run with the app server up: `npm start` (port 3100).
 */

// Prime the session API key so the LoginDialog modal doesn't gate every page.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("jarvis-api-key", "jarvis-demo-key");
  });
});

// `/` redirects to /chat. Dynamic routes use throwaway ids — they render their
// loading/not-found shells, which carry the a11y we care about here.
const ROUTES = [
  "/chat",
  "/debate",
  "/debate/debate-axe-fixture",
  "/control-room",
  "/workflows",
  "/workflows/wf-axe-fixture",
  "/memory",
  "/calendar",
  "/tools",
  "/settings",
];

for (const route of ROUTES) {
  test(`a11y: ${route} — no serious/critical axe violations`, async ({ page }) => {
    await page.goto(route);
    // Let the initial render settle (loading → content/empty). Avoid
    // networkidle — SSE/polling pages never go idle.
    await page.waitForTimeout(700);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );

    if (serious.length) {
      console.log(
        `\n[a11y] ${route} violations:\n` +
          serious
            .map(
              (v) =>
                `  ${v.id} (${v.impact}) ×${v.nodes.length}: ${v.help}\n` +
                v.nodes
                  .slice(0, 3)
                  .map(
                    (n) =>
                      `      ${n.target.join(" ")}  ${JSON.stringify(
                        n.any?.[0]?.data ?? {}
                      )}`
                  )
                  .join("\n")
            )
            .join("\n")
      );
    }

    expect(
      serious,
      `axe serious/critical on ${route}: ${JSON.stringify(serious.map((v) => v.id))}`
    ).toEqual([]);
  });
}
