"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, ExternalLink, Loader2, Wand2, X } from "lucide-react";

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
};

const filters = ["创意灵感", "海报", "写实", "线条图", "电商产品图", "AI 修图", "专利制图标准", "全部"];

export function InteractiveGallery({
  items,
  compact = false,
  initialFilter = "创意灵感",
  loadMore = false
}: {
  items: GalleryItem[];
  compact?: boolean;
  initialFilter?: string;
  loadMore?: boolean;
}) {
  const [active, setActive] = useState(initialFilter);
  const [visibleItems, setVisibleItems] = useState(items);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [hasMore, setHasMore] = useState(loadMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleItems(items);
    setHasMore(loadMore);
  }, [items, loadMore]);

  const filtered = useMemo(() => {
    if (active === "全部") return visibleItems;
    return visibleItems.filter((item) => {
      const haystack = `${item.category},${item.tags},${item.title},${item.prompt}`;
      return haystack.includes(active);
    });
  }, [active, visibleItems]);

  async function copyPrompt(prompt: string) {
    await navigator.clipboard?.writeText(prompt);
  }

  async function changeFilter(tag: string) {
    setActive(tag);
    if (!loadMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/gallery?filter=${encodeURIComponent(tag)}&take=60`, { cache: "no-store" });
      const data = await response.json();
      setVisibleItems(data.items ?? []);
      setHasMore(Boolean(data.hasMore));
    } finally {
      setLoadingMore(false);
    }
  }

  const loadNextPage = useCallback(async () => {
    if (!loadMore || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(
        `/api/gallery?filter=${encodeURIComponent(active)}&skip=${visibleItems.length}&take=60`,
        { cache: "no-store" }
      );
      const data = await response.json();
      setVisibleItems((current) => [...current, ...(data.items ?? [])]);
      setHasMore(Boolean(data.hasMore));
    } finally {
      setLoadingMore(false);
    }
  }, [active, hasMore, loadMore, loadingMore, visibleItems.length]);

  useEffect(() => {
    if (!loadMore || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadNextPage();
        }
      },
      { rootMargin: "800px 0px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, loadNextPage]);

  return (
    <>
      <div className="filter-bar" aria-label="图库筛选">
        {filters.map((tag) => (
          <button className={active === tag ? "active" : ""} key={tag} onClick={() => changeFilter(tag)}>
            {tag}
          </button>
        ))}
      </div>
      <div className={`gallery-grid inspiration-grid ${compact ? "compact-gallery" : ""}`}>
        {filtered.map((item) => (
          <button className="gallery-card" key={item.id} onClick={() => setSelected(item)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="thumb" src={item.coverUrl} alt={item.title} />
            <div className="gallery-card-body">
              <div className="tag-row">
                <span className="tag">{item.category}</span>
                <span className="tag">{item.sizeLabel}</span>
              </div>
              <h3>{item.title}</h3>
            </div>
          </button>
        ))}
      </div>
      {loadMore ? (
        <div className="load-more-row">
          <button className="button button-secondary" onClick={loadNextPage} disabled={!hasMore || loadingMore}>
            {loadingMore ? <Loader2 size={16} className="animate-spin" /> : null}
            {hasMore ? "继续加载更多作品" : "已经看到当前分类全部作品"}
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
                <span className="tag">{selected.category}</span>
                <span className="tag">{selected.model}</span>
                <span className="tag">{selected.sizeLabel}</span>
              </div>
              <h2>{selected.title}</h2>
              <div className="prompt-box">
                <div>
                  <strong>提示词</strong>
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
