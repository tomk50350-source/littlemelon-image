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
  const [copiedPromptId, setCopiedPromptId] = useState("");
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

  async function copyPrompt(item: GalleryItem) {
    const text = cleanPrompt(item.prompt);
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      fallbackCopy(text);
    }
    setCopiedPromptId(item.id);
    window.setTimeout(() => setCopiedPromptId((current) => (current === item.id ? "" : current)), 1600);
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
                  <span className="tag">{item.sizeLabel}</span>
                </div>
                <h3>{formatGalleryTitle(item, language)}</h3>
                {sort === "popular" ? <p className="gallery-heat">{item.repoStars ?? 0} 热度</p> : null}
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
                <span className="tag">{selected.sizeLabel}</span>
              </div>
              <h2>{formatGalleryTitle(selected, language)}</h2>
              <div className="prompt-box">
                <div>
                  <strong>提示词</strong>
                  <button className={copiedPromptId === selected.id ? "copied" : ""} onClick={() => copyPrompt(selected)}>
                    <Copy size={14} />
                    {copiedPromptId === selected.id ? "已复制" : "复制"}
                  </button>
                </div>
                <p>{cleanPrompt(selected.prompt)}</p>
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

function formatGalleryTitle(item: GalleryItem, language: "zh" | "en") {
  const cleaned = cleanTitle(item.title);
  const title = language === "zh" ? titleToChinese(cleaned) : cleaned;
  return appendSize(title, item.sizeLabel);
}

function cleanTitle(title: string) {
  return title
    .replace(/nano\s*banana(?:\s*(?:2|pro))?/gi, "")
    .replace(/gpt[-\s_]*image[-\s_]*2/gi, "")
    .replace(/image\s*2/gi, "")
    .replace(/\bpro\s*examples?\b/gi, "案例")
    .replace(/^youtube\s*thumbnail\s*[-:]\s*/i, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s:：\-]+|[\s:：\-]+$/g, "")
    .trim();
}

function titleToChinese(title: string) {
  const normalized = title.toLowerCase();
  const dictionary: Array<[RegExp, string]> = [
    [/merchandise.*design/, "周边商品设计"],
    [/retro.*japanese.*town.*pixel.*rpg/, "复古日式像素 RPG 小镇"],
    [/cyberpunk.*europe.*action.*hud/, "赛博朋克欧洲动作游戏界面"],
    [/anime.*open.*world.*adventure.*hud/, "动漫开放世界冒险界面"],
    [/low.*poly.*samurai.*strategy.*village/, "低多边形武士策略村落"],
    [/iclr.*method.*figure/, "论文方法示意图"],
    [/vhs.*grocery.*store.*chaos/, "VHS 超市混乱电影帧"],
    [/ground.*view.*map.*arrow/, "地图箭头生成地面视角"],
    [/real.*world.*ar.*information/, "真实世界 AR 信息图"],
    [/extract.*3d.*buildings|isometric.*models/, "等距 3D 建筑模型"],
    [/concept.*sheet/, "概念设定图"],
    [/camera.*parameter/, "相机参数示意图"],
    [/epic.*silhouette.*worldbuilding.*poster/, "史诗级剪影世界观海报"],
    [/stone.*staircase.*evolution.*infographic/, "3D 石阶演化信息图"],
    [/uiux|ui\/ux|mockup/, "界面设计灵感图"],
    [/product.*poster|ecommerce|commerce/, "电商产品海报"],
    [/character|portrait/, "角色肖像设计"],
    [/poster/, "创意海报"],
    [/infographic/, "信息图设计"],
    [/logo/, "品牌标志设计"],
    [/thumbnail/, "视频封面设计"],
    [/line.*art|lineart|patent/, "线条结构图"],
    [/realistic|photo|photography/, "写实摄影图"],
    [/illustration/, "插画设计"]
  ];
  const found = dictionary.find(([pattern]) => pattern.test(normalized));
  if (found) return found[1];
  if (!/[a-z]/i.test(title)) return title || "创意图片";
  const translated = title
    .replace(/\bmerchandise\b/gi, "周边商品")
    .replace(/\bdesign\b/gi, "设计")
    .replace(/\bretro\b/gi, "复古")
    .replace(/\bjapanese\b/gi, "日式")
    .replace(/\btown\b/gi, "小镇")
    .replace(/\bpixel\b/gi, "像素")
    .replace(/\bcyberpunk\b/gi, "赛博朋克")
    .replace(/\beurope\b/gi, "欧洲")
    .replace(/\baction\b/gi, "动作")
    .replace(/\bhud\b/gi, "界面")
    .replace(/\banime\b/gi, "动漫")
    .replace(/\bopen[- ]world\b/gi, "开放世界")
    .replace(/\badventure\b/gi, "冒险")
    .replace(/\blow[- ]poly\b/gi, "低多边形")
    .replace(/\bsamurai\b/gi, "武士")
    .replace(/\bstrategy\b/gi, "策略")
    .replace(/\bvillage\b/gi, "村落")
    .replace(/\bmethod\b/gi, "方法")
    .replace(/\bfigure\b/gi, "示意图")
    .replace(/\bepic\b/gi, "史诗级")
    .replace(/\bsilhouette\b/gi, "剪影")
    .replace(/\bworldbuilding\b/gi, "世界观")
    .replace(/\bposter\b/gi, "海报")
    .replace(/\binfographic\b/gi, "信息图")
    .replace(/\bproduct\b/gi, "产品")
    .replace(/\bphotography\b|\bphoto\b/gi, "摄影")
    .replace(/\billustration\b/gi, "插画")
    .replace(/\bmockup\b/gi, "样机")
    .trim();
  return /[a-z]/i.test(translated) ? "创意图片" : translated || "创意图片";
}

function appendSize(title: string, sizeLabel: string) {
  const clean = title.replace(/[，,]\s*(1K|2K|4K)$/i, "").trim();
  return `${clean || "创意图片"}，${sizeLabel}`;
}

function cleanPrompt(prompt: string) {
  return prompt
    .replace(/nano\s*banana(?:\s*(?:2|pro))?/gi, "图片模型")
    .replace(/gpt[-\s_]*image[-\s_]*2/gi, "图片模型")
    .replace(/\bimage\s*2\b/gi, "图片模型")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function fallbackCopy(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}
