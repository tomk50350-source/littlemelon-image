import { closeGallerySync, syncGitHubGallery } from "./gallery-sync-core.mjs";

try {
  const result = await syncGitHubGallery();
  console.log(`Synced ${result.synced} GitHub gallery items.`);
  console.log(`Sources: ${result.sources.join(", ")}`);
  if (result.sourceCounts) {
    console.log(`Source counts: ${result.sourceCounts.map((item) => `${item.source}: ${item.count}`).join("; ")}`);
  }
} finally {
  await closeGallerySync();
}
