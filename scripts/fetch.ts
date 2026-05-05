import { refreshAll } from "../lib/fetch-feeds";
import { pool } from "../lib/db/client";

async function main() {
  const start = Date.now();
  const { results, pruned } = await refreshAll();

  const ok = results.filter((r) => !r.error);
  const failed = results.filter((r) => r.error);
  const totalInserted = ok.reduce((sum, r) => sum + r.inserted, 0);

  for (const r of results) {
    if (r.error) {
      console.error(`[FAIL] ${r.source}: ${r.error}`);
    } else {
      console.log(`[OK]   ${r.source}: ${r.inserted} new / ${r.total} total`);
    }
  }

  console.log(
    `\nDone in ${((Date.now() - start) / 1000).toFixed(1)}s — ${ok.length} sources OK, ${failed.length} failed, ${totalInserted} new items, ${pruned} pruned.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
