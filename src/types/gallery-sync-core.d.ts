declare module "@/../scripts/gallery-sync-core.mjs" {
  export function syncGitHubGallery(options?: { limitPerSource?: number; discoverGitHub?: boolean }): Promise<{
    synced: number;
    sources: string[];
    sourceCounts?: Array<{ source: string; count: number }>;
    curatedSources: number;
    discoveredSources: number;
  }>;
  export function closeGallerySync(): Promise<void>;
}
