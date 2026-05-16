import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SOURCES = [
  {
    id: "youmind",
    label: "YouMind awesome-gpt-image-2",
    repo: "YouMind-OpenLab/awesome-gpt-image-2",
    branch: "main",
    model: "GPT-Image-2",
    files: ["README_zh.md", "README.md"],
    priority: true
  },
  {
    id: "evolink",
    label: "EvoLinkAI awesome-gpt-image-2-API-and-Prompts",
    repo: "EvoLinkAI/awesome-gpt-image-2-API-and-Prompts",
    branch: "main",
    model: "GPT-Image-2",
    files: ["README_zh-CN.md", "README.md"],
    priority: true
  },
  {
    id: "picotrex",
    label: "PicoTrex Awesome-Nano-Banana-images",
    repo: "PicoTrex/Awesome-Nano-Banana-images",
    branch: "main",
    model: "Nano Banana 2",
    files: ["README.md", "README_en.md"],
    priority: true
  },
  {
    id: "wuyoscar",
    label: "wuyoscar gpt_image_2_skill",
    repo: "wuyoscar/gpt_image_2_skill",
    branch: "main",
    model: "GPT-Image-2",
    files: ["docs/community-prompt-picks.json", "README.zh.md", "README.md"],
    priority: true
  }
];

const SEARCH_QUERIES = [
  "gpt-image-2 prompts",
  "\"GPT Image 2\" prompt gallery",
  "\"gpt-image-2\" awesome",
  "\"GPT-Image-2\" examples"
];

const USER_AGENT = "LittleMelon-Image-Gallery-Sync";
const MAX_DISCOVERED_SOURCES = 4;
const MAX_TOTAL_ITEMS = 2000;
const REQUEST_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 11000;
const DEFAULT_LIMIT_PER_SOURCE = 120;
const MIN_PROMPT_LENGTH = 10;

export async function syncGitHubGallery({ limitPerSource = DEFAULT_LIMIT_PER_SOURCE, discoverGitHub = false } = {}) {
  const allItems = [];
  const discoveredSources = discoverGitHub ? await discoverGitHubSources() : [];
  const sources = mergeSources(SOURCES, discoveredSources);
  const sourceCounts = [];

  for (const source of sources) {
    const sourceLimit = source.priority ? limitPerSource : Math.min(80, limitPerSource);
    const before = allItems.length;
    for (const file of source.files) {
      if (file.endsWith(".json")) {
        allItems.push(...(await fetchJsonGallery(source, file, sourceLimit)));
        continue;
      }
      const markdown = await fetchRawFile(source, file);
      if (markdown) {
        allItems.push(...parseMarkdownGallery(markdown, source, file, sourceLimit));
      }
    }
    sourceCounts.push({ source: source.label, count: allItems.length - before });
  }

  const unique = dedupeItems(allItems)
    .map(sanitizeGalleryItem)
    .filter(isUsableItem)
    .slice(0, MAX_TOTAL_ITEMS);

  if (unique.length > 0) {
    await prisma.promptGallery.deleteMany({
      where: {
        OR: [
          { id: { startsWith: "github-" } },
          { prompt: { contains: "围绕这个画面方向" } },
          { title: { contains: "Claude Code" } },
          { title: { contains: "插件" } }
        ]
      }
    });
  }

  let synced = 0;
  for (const item of unique) {
    await prisma.promptGallery.upsert({
      where: { id: item.id },
      update: { ...item, featured: false, updatedAt: new Date() },
      create: { ...item, featured: false, updatedAt: new Date() }
    });
    synced += 1;
  }

  return {
    synced,
    sources: sources.map((source) => source.label),
    sourceCounts,
    curatedSources: SOURCES.length,
    discoveredSources: discoveredSources.length
  };
}

export async function closeGallerySync() {
  await prisma.$disconnect();
}

async function discoverGitHubSources() {
  const found = new Map();
  for (const query of SEARCH_QUERIES) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(`${query} fork:false`)}&sort=updated&order=desc&per_page=6`;
    try {
      const response = await fetchWithRetry(url);
      if (!response.ok) continue;
      const data = await response.json();
      for (const repo of data.items || []) {
        if (found.size >= MAX_DISCOVERED_SOURCES) break;
        if (!isRelevantRepo(repo)) continue;
        found.set(repo.full_name, {
          id: `discovered-${slugify(repo.full_name)}`,
          label: repo.full_name,
          repo: repo.full_name,
          branch: repo.default_branch || "main",
          model: "GPT-Image-2",
          files: ["README_zh.md", "README_zh-CN.md", "README.md", "docs/community-prompt-picks.json"],
          priority: false
        });
      }
    } catch {
      continue;
    }
  }
  return [...found.values()];
}

function mergeSources(curated, discovered) {
  const seen = new Set(curated.map((source) => source.repo.toLowerCase()));
  return [
    ...curated,
    ...discovered.filter((source) => {
      const key = source.repo.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
  ];
}

function isRelevantRepo(repo) {
  const text = `${repo.full_name || ""} ${repo.description || ""} ${repo.topics?.join(" ") || ""}`.toLowerCase();
  const hasImageSignal = /gpt[-_\s]?image[-_\s]?2|gpt[-_\s]?image|image2|image[-_\s]?2|openai.*image/.test(text);
  const hasCreativeSignal = /prompt|gallery|awesome|example|cookbook|生图|提示词|案例/.test(text);
  const isHealthyEnough = (repo.stargazers_count || 0) >= 3 || (repo.updated_at && Date.now() - Date.parse(repo.updated_at) < 1000 * 60 * 60 * 24 * 120);
  return hasImageSignal && hasCreativeSignal && isHealthyEnough && !repo.archived;
}

async function fetchRawFile(source, file) {
  const url = `https://raw.githubusercontent.com/${source.repo}/${source.branch}/${file}`;
  try {
    const response = await fetchWithRetry(url);
    if (!response.ok) return "";
    return await response.text();
  } catch {
    return fetchGitHubContentsFile(source, file);
  }
}

async function fetchGitHubContentsFile(source, file) {
  const url = `https://api.github.com/repos/${source.repo}/contents/${encodeURIComponentPath(file)}?ref=${encodeURIComponent(source.branch)}`;
  try {
    const response = await fetchWithRetry(url);
    if (!response.ok) return "";
    const data = await response.json();
    if (!data.content || data.encoding !== "base64") return "";
    return Buffer.from(data.content, "base64").toString("utf8");
  } catch {
    return "";
  }
}

async function fetchJsonGallery(source, file, limit) {
  const raw = await fetchRawFile(source, file);
  if (!raw) return [];
  try {
    const rows = JSON.parse(raw);
    if (!Array.isArray(rows)) return [];
    return rows
      .slice(0, limit)
      .map((row, index) => {
        const prompt = cleanPrompt(row.prompt || row.source_excerpt || "");
        const imageFile = row.file || "";
        return makeItem({
          source,
          file,
          prompt,
          title: cleanText(row.title || row.source_title || prompt.slice(0, 36)),
          category: mapCategory(`${row.category || ""} ${prompt}`, imageFile),
          imageUrl: imageFile ? resolveAssetUrl(source, file, imageFile) : "",
          ordinal: index,
          sourceUrl: row.source_url || `https://github.com/${source.repo}/blob/${source.branch}/${file}`
        });
      })
      .filter(isUsableItem);
  } catch {
    return [];
  }
}

function parseMarkdownGallery(markdown, source, file, limit) {
  const sections = splitCaseSections(markdown);
  const items = [];

  for (const section of sections) {
    if (items.length >= limit) break;
    const title = cleanText(extractTitle(section.heading));
    if (!title || isGenericHeading(title) || isAdTitle(title)) continue;

    const prompt = extractPrompt(section.body);
    if (!isRealPrompt(prompt)) continue;

    const images = extractOutputImages(section.body, source, file);
    if (images.length === 0) continue;

    for (const image of images) {
      if (items.length >= limit) break;
      items.push(makeItem({
        source,
        file,
        prompt,
        title,
        category: mapCategory(`${title} ${prompt}`, image.raw),
        imageUrl: image.url,
        ordinal: items.length,
        sourceUrl: extractSourceUrl(section.body) || `https://github.com/${source.repo}/blob/${source.branch}/${file}`
      }));
    }
  }

  return items;
}

function splitCaseSections(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = [];
  let current = null;

  for (const line of lines) {
    const heading = line.match(/^(#{2,4})\s+(.+)/);
    if (heading && isCaseHeading(heading[2])) {
      if (current) sections.push(current);
      current = { heading: heading[2], body: "" };
      continue;
    }
    if (current) current.body += `${line}\n`;
  }

  if (current) sections.push(current);
  return sections;
}

function isCaseHeading(value) {
  const clean = cleanText(value);
  return /^(No\.?\s*\d+|Case\s*\d+|例\s*\d+|Nano Banana|GPT-Image|GPT Image|\d+\.)/i.test(clean) || /案例|例子|Prompt Example/i.test(clean);
}

function extractTitle(heading) {
  return heading
    .replace(/^No\.?\s*\d+\s*[:：-]\s*/i, "")
    .replace(/^Case\s*\d+\s*[:：-]\s*/i, "")
    .replace(/^例\s*\d+\s*[:：-]\s*/i, "")
    .replace(/\s*（by\s+[^）]+）/i, "")
    .replace(/\s*\(by\s+[^)]+\)/i, "")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1");
}

function extractPrompt(sectionBody) {
  const codeBlocks = [...sectionBody.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((match) => cleanPrompt(match[1]));
  const labeledBlocks = codeBlocks.filter((block) => {
    const index = sectionBody.indexOf(block);
    const before = index >= 0 ? sectionBody.slice(Math.max(0, index - 280), index) : sectionBody;
    return /提示词|Prompt|prompt/i.test(before);
  });
  const candidates = (labeledBlocks.length ? labeledBlocks : codeBlocks)
    .filter(isRealPrompt)
    .sort((a, b) => b.length - a.length);
  if (candidates[0]) return candidates[0];

  const inline = sectionBody.match(/(?:\*\*)?(?:提示词|Prompt)(?:\*\*)?\s*[:：]\s*([\s\S]{10,900}?)(?:\n\s*\n|####|###|<!--|$)/i);
  return inline ? cleanPrompt(inline[1]) : "";
}

function extractOutputImages(sectionBody, source, file) {
  const images = [];
  const markdownImages = [...sectionBody.matchAll(/!\[([^\]]*)]\(([^)]+)\)/g)].map((match) => ({
    alt: match[1],
    raw: match[2]
  }));
  const htmlImages = [...sectionBody.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map((match) => ({
    alt: match[0].match(/\balt=["']([^"']*)["']/i)?.[1] || "",
    raw: match[1]
  }));

  for (const image of [...markdownImages, ...htmlImages]) {
    if (!shouldUseOutputImage(image.raw, image.alt)) continue;
    images.push({
      raw: image.raw,
      url: resolveAssetUrl(source, file, image.raw)
    });
  }

  const outputImages = images.filter((image) => /output|生成|结果|result/i.test(image.raw));
  return dedupeImages(outputImages.length ? outputImages : images).slice(0, 4);
}

function shouldUseOutputImage(asset, alt) {
  const value = `${asset} ${alt}`.toLowerCase();
  if (/badge|shield|logo|banner|avatar|wechat|二维码|license|star-history|og-hq|project logo|awesome\.re/.test(value)) return false;
  if (/input|输入图片|reference/.test(value) && !/output|输出|结果/.test(value)) return false;
  return /\.(png|jpe?g|webp)(\?|#|$)/i.test(asset);
}

function extractSourceUrl(sectionBody) {
  const match = sectionBody.match(/\[(?:source|来源|Twitter Post|X Post|立即尝试)[^\]]*]\((https?:\/\/[^)]+)\)/i);
  return match?.[1] || "";
}

function makeItem({ source, file, prompt, title, category, imageUrl, ordinal, sourceUrl }) {
  return {
    id: `github-${source.id}-${slugify(file)}-${slugify(title)}-${ordinal}`,
    title: (title || prompt.slice(0, 28)).slice(0, 80),
    prompt: prompt.slice(0, 1800),
    coverUrl: imageUrl,
    category,
    model: source.model || "GPT-Image-2",
    tags: inferTags(prompt, category).join(","),
    sizeLabel: inferSize(prompt),
    sourceUrl
  };
}

function dedupeItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.coverUrl}|${item.prompt.slice(0, 220)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeImages(images) {
  const seen = new Set();
  return images.filter((image) => {
    if (seen.has(image.url)) return false;
    seen.add(image.url);
    return true;
  });
}

function sanitizeGalleryItem(item) {
  return {
    ...item,
    id: slugify(item.id || "github-item") || `github-item-${Date.now()}`,
    title: cleanText(item.title).slice(0, 80) || "GitHub 创意案例",
    prompt: cleanPrompt(item.prompt).slice(0, 1800),
    coverUrl: cleanUrl(item.coverUrl),
    category: cleanField(item.category) || "创意灵感",
    model: cleanField(item.model) || "GPT-Image-2",
    tags: cleanField(item.tags),
    sizeLabel: cleanField(item.sizeLabel) || "2K",
    sourceUrl: item.sourceUrl ? cleanUrl(item.sourceUrl) : null
  };
}

function isUsableItem(item) {
  return Boolean(
    item &&
      item.title &&
      isRealPrompt(item.prompt) &&
      /^https?:\/\//i.test(item.coverUrl || "") &&
      !isAdTitle(item.title) &&
      !isBadPrompt(item.prompt)
  );
}

function isRealPrompt(value) {
  const prompt = cleanPrompt(value);
  if (prompt.length < MIN_PROMPT_LENGTH) return false;
  if (isBadPrompt(prompt)) return false;
  if (/^(提示词|prompt|生成图片|image \d+)$/i.test(prompt)) return false;
  return true;
}

function isBadPrompt(value) {
  return /围绕这个画面方向|npm |pip |curl |import |client\.images|POST \/v1|Claude Code|插件|更新流程|README|License|PRs Welcome|GitHub stars|Awesome GPT Image 2 API/i.test(value);
}

function isAdTitle(value) {
  return /logo|badge|license|star history|claude code|插件|更新流程|readme|contributing|website|dataset/i.test(value);
}

function mapCategory(text, file) {
  const value = `${text} ${file}`.toLowerCase();
  if (/product|pack|commerce|电商|商品|产品|广告|促销|commercial/.test(value)) return "电商产品图";
  if (/edit|retouch|reference|mask|修图|背景|inpaint|input|输入|换|remove|transparent/.test(value)) return "AI 修图";
  if (/research|figure|diagram|infographic|paper|流程|专利|line|technical|exploded|爆炸|结构|标注/.test(value)) return "专利制图标准";
  return "创意灵感";
}

function inferSize(prompt) {
  return /4k|wide|2048|1536|landscape|16:9|3:2|8k/i.test(prompt) ? "4K" : "2K";
}

function inferTags(prompt, category) {
  const tags = [category];
  for (const [pattern, tag] of [
    ["product|pack|商品|产品|commerce", "产品"],
    ["poster|海报|typography|visual", "海报"],
    ["photo|photorealistic|摄影|写实|realistic", "写实"],
    ["diagram|figure|infographic|流程|框图|map", "图表"],
    ["line|technical|patent|线稿|专利|exploded", "线条图"],
    ["edit|retouch|mask|修图|remove|transparent", "修图"],
    ["ui|ux|mockup|interface|app", "UI"],
    ["character|portrait|人像|角色", "角色"]
  ]) {
    if (new RegExp(pattern, "i").test(prompt)) tags.push(tag);
  }
  return [...new Set(tags)].slice(0, 6);
}

function resolveAssetUrl(source, file, asset) {
  if (asset.startsWith("http")) return asset;
  if (asset.startsWith("docs/") || asset.startsWith("images/") || asset.startsWith("public/")) {
    return `https://raw.githubusercontent.com/${source.repo}/${source.branch}/${asset}`;
  }
  const folder = file.includes("/") ? file.split("/").slice(0, -1).join("/") : "";
  const path = asset.startsWith("/") ? asset.slice(1) : folder ? `${folder}/${asset}` : asset;
  return `https://raw.githubusercontent.com/${source.repo}/${source.branch}/${path}`;
}

async function fetchWithRetry(url, init = {}) {
  let lastError;
  for (let attempt = 0; attempt <= REQUEST_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...init, headers: { ...githubHeaders(), ...(init.headers || {}) }, signal: controller.signal });
      if (response.ok || response.status === 404) return response;
      lastError = new Error(`GitHub returned ${response.status}`);
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
    if (attempt < REQUEST_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
    }
  }
  throw lastError;
}

function cleanText(value) {
  return cleanField(value)
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/https?$/gi, "")
    .replace(/[`*_{}[\]()<>]/g, "")
    .replace(/[^\p{L}\p{N}\s·&/+\-:：]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanPrompt(value) {
  return cleanField(value)
    .replace(/^`+|`+$/g, "")
    .replace(/^\s{0,4}[-*>]\s?/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isGenericHeading(value) {
  return /^(prompt|prompts|提示词|quick usage|about|docs|readme|gallery|showcase|中文|english|introduction)$/i.test(value);
}

function githubHeaders() {
  return process.env.GITHUB_TOKEN
    ? { "User-Agent": USER_AGENT, Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : { "User-Agent": USER_AGENT };
}

function cleanField(value) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\uD800-\uDFFF]/g, "")
    .replace(/\\x[0-9a-fA-F]{0,2}/g, "")
    .replace(/\\u[0-9a-fA-F]{0,4}/g, "")
    .trim();
}

function cleanUrl(value) {
  const url = cleanField(value);
  return /^https?:\/\//i.test(url) ? url : "";
}

function encodeURIComponentPath(path) {
  return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function slugify(value) {
  return cleanField(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}
