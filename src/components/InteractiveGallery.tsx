"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, ExternalLink, Heart, Languages, Loader2, Wand2, X } from "lucide-react";

type GalleryItem = {
  id: string;
  title: string;
  prompt: string;
  coverUrl: string;
  category: string;
  tags: string;
  sizeLabel: string;
  model: string;
  sourceUrl: string | null;
  popularity?: number;
  repoStars?: number;
};

export function InteractiveGallery({
  items,
  compact = false,
  loadMore = false,
  initialSeed,
  initialHasMore,
  showControls = true
}: {
  items: GalleryItem[];
  compact?: boolean;
  initialFilter?: string;
  loadMore?: boolean;
  initialSeed?: number;
  initialHasMore?: boolean;
  showControls?: boolean;
}) {
  const [visibleItems, setVisibleItems] = useState(items);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [hasMore, setHasMore] = useState(initialHasMore ?? loadMore);
  const [seed, setSeed] = useState(initialSeed ?? Date.now());
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [language, setLanguage] = useState<"zh" | "en">("zh");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [gateMessage, setGateMessage] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleItems(items);
    setHasMore(initialHasMore ?? loadMore);
    if (initialSeed) setSeed(initialSeed);
  }, [initialHasMore, initialSeed, items, loadMore]);

  useEffect(() => {
    fetch("/api/favorites", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setFavorites(new Set(data.favorites ?? [])))
      .catch(() => undefined);
  }, []);

  async function copyPrompt(prompt: string) {
    await navigator.clipboard?.writeText(prompt);
  }

  async function reload(nextSort = sort) {
    if (!loadMore) return;
    setLoadingMore(true);
    const nextSeed = Date.now();
    setSeed(nextSeed);
    try {
      const response = await fetch(`/api/gallery?take=60&seed=${nextSeed}&sort=${nextSort}`, { cache: "no-store" });
      const data = await response.json();
      setVisibleItems(data.items ?? []);
      setHasMore(Boolean(data.hasMore));
      setGateMessage(data.requiresLogin ? "登录后可继续浏览更多同步案例。" : "");
    } finally {
      setLoadingMore(false);
    }
  }

  async function changeSort(nextSort: "latest" | "popular") {
    setSort(nextSort);
    await reload(nextSort);
  }

  async function toggleFavorite(item: GalleryItem) {
    const isFavorite = favorites.has(item.id);
    const response = await fetch(isFavorite ? `/api/favorites?promptGalleryId=${encodeURIComponent(item.id)}` : "/api/favorites", {
      method: isFavorite ? "DELETE" : "POST",
      headers: isFavorite ? undefined : { "Content-Type": "application/json" },
      body: isFavorite ? undefined : JSON.stringify({ promptGalleryId: item.id })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setGateMessage(data.error ?? "收藏失败");
      return;
    }
    setFavorites((current) => {
      const next = new Set(current);
      if (isFavorite) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }

  const loadNextPage = useCallback(async () => {
    if (!loadMore || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/gallery?skip=${visibleItems.length}&take=60&seed=${seed}&sort=${sort}`, {
        cache: "no-store"
      });
      const data = await response.json();
      setVisibleItems((current) => [...current, ...(data.items ?? [])]);
      setHasMore(Boolean(data.hasMore));
      setGateMessage(data.requiresLogin ? "登录后可继续浏览更多同步案例。" : "");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadMore, loadingMore, seed, sort, visibleItems.length]);

  useEffect(() => {
    if (!loadMore || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadNextPage();
      },
      { rootMargin: "800px 0px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, loadNextPage]);

  return (
    <>
      {showControls ? (
        <div className="gallery-toolbar">
          <div className="sort-tabs" aria-label="排序">
            <button className={sort === "latest" ? "active" : ""} onClick={() => changeSort("latest")}>
              最新
            </button>
            <button className={sort === "popular" ? "active" : ""} onClick={() => changeSort("popular")}>
              最多点赞
            </button>
          </div>
          <button className="language-toggle" onClick={() => setLanguage((current) => (current === "zh" ? "en" : "zh"))}>
            <Languages size={15} />
            {language === "zh" ? "中文" : "EN"}
          </button>
        </div>
      ) : null}

      <div className={`gallery-grid inspiration-grid ${compact ? "compact-gallery" : ""}`}>
        {visibleItems.map((item) => (
          <article className="gallery-card" key={item.id}>
            <button className="gallery-card-click" onClick={() => setSelected(item)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="thumb" src={item.coverUrl} alt={item.title} />
              <div className="gallery-card-body">
                <div className="tag-row">
                  <span className="tag">{item.model}</span>
                  <span className="tag">{item.sizeLabel}</span>
                </div>
                <h3>{language === "zh" ? item.title : item.title}</h3>
                {sort === "popular" ? <p className="gallery-heat">GitHub heat {item.repoStars ?? 0}</p> : null}
              </div>
            </button>
            <button className={`favorite-button ${favorites.has(item.id) ? "active" : ""}`} aria-label="收藏" onClick={() => toggleFavorite(item)}>
              <Heart size={16} fill={favorites.has(item.id) ? "currentColor" : "none"} />
            </button>
          </article>
        ))}
      </div>

      {gateMessage ? (
        <div className="notice gallery-gate">
          {gateMessage} <a href="/login">登录</a>
        </div>
      ) : null}

      {loadMore ? (
        <div className="load-more-row">
          <button className="button button-secondary" onClick={loadNextPage} disabled={!hasMore || loadingMore}>
            {loadingMore ? <Loader2 size={16} className="animate-spin" /> : null}
            {hasMore ? "继续加载更多作品" : "已到当前可浏览上限"}
          </button>
          <div ref={sentinelRef} aria-hidden="true" className="load-more-sentinel" />
        </div>
      ) : null}

      {selected ? (
        <div className="gallery-modal" role="dialog" aria-modal="true">
          <button className="modal-scrim" aria-label="关闭" onClick={() => setSelected(null)} />
          <div className="gallery-dialog">
            <button className="modal-close" aria-label="关闭" onClick={() => setSelected(null)}>
              <X size={18} />
            </button>
            <div className="dialog-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.coverUrl} alt={selected.title} />
            </div>
            <div className="dialog-content">
              <div className="tag-row">
                <span className="tag">{selected.model}</span>
                <span className="tag">{selected.sizeLabel}</span>
                <span className="tag">GitHub heat {selected.repoStars ?? 0}</span>
              </div>
              <h2>{selected.title}</h2>
              <div className="prompt-box">
                <div>
                  <strong>Prompt</strong>
                  <button onClick={() => copyPrompt(selected.prompt)}>
                    <Copy size={14} />
                    复制
                  </button>
                </div>
                <p>{selected.prompt}</p>
              </div>
              <div className="dialog-actions">
                <a className="button button-primary" href="/#generator">
                  <Wand2 size={16} />
                  去生成
                </a>
                <button className="button button-secondary" onClick={() => toggleFavorite(selected)}>
                  <Heart size={16} fill={favorites.has(selected.id) ? "currentColor" : "none"} />
                  {favorites.has(selected.id) ? "已收藏" : "收藏"}
                </button>
                {selected.sourceUrl ? (
                  <a className="button button-secondary" href={selected.sourceUrl} target="_blank">
                    <ExternalLink size={16} />
                    来源
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
