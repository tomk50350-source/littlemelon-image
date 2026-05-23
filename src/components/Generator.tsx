"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ImagePlus, Loader2, Plus, Wand2, X } from "lucide-react";
import { CREDIT_COSTS, SCENARIOS, type ImageSizeLabel } from "@/lib/constants";

type HistoryItem = {
  id: string;
  prompt: string;
  imageUrl: string | null;
  originalUrl: string | null;
  sizeLabel: string;
  createdAt: string;
};

type GenerationResponse = {
  generation?: HistoryItem;
  outputs?: { imageUrl: string; originalUrl: string }[];
  error?: string;
};

export function Generator() {
  const [scenario] = useState("creative");
  const [mode, setMode] = useState<"text" | "reference" | "edit">("text");
  const [sizeLabel, setSizeLabel] = useState<ImageSizeLabel>("1K");
  const [quantity, setQuantity] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<HistoryItem | null>(null);
  const [outputs, setOutputs] = useState<{ imageUrl: string; originalUrl: string }[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [balance, setBalance] = useState(0);
  const [tier, setTier] = useState("free");
  const [maxReferenceImages, setMaxReferenceImages] = useState(0);
  const [maxQuantity, setMaxQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [referenceImages, setReferenceImages] = useState<string[]>([]);

  const activeScenario = useMemo(
    () => SCENARIOS.find((item) => item.id === scenario) ?? SCENARIOS[0],
    [scenario]
  );

  async function refreshMe() {
    const response = await fetch("/api/me", { cache: "no-store" });
    const data = await response.json();
    setBalance(data.balance ?? 0);
    setHistory(data.history ?? []);
    setTier(data.tier ?? "free");
    setMaxReferenceImages(data.maxReferenceImages ?? 0);
    setMaxQuantity(data.maxQuantity ?? 1);
  }

  useEffect(() => {
    refreshMe().catch(() => undefined);
  }, []);

  async function submit() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, scenario, mode, sizeLabel, quantity, referenceImages })
      });
      const data = (await response.json()) as GenerationResponse;

      if (!response.ok || !data.generation) {
        setMessage(data.error ?? "生成失败，请稍后再试");
        return;
      }

      setResult(data.generation);
      setOutputs(data.outputs ?? (data.generation?.imageUrl ? [{ imageUrl: data.generation.imageUrl, originalUrl: data.generation.originalUrl ?? data.generation.imageUrl }] : []));
      await refreshMe();
    } finally {
      setLoading(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setMessage("");
    if (maxReferenceImages <= 0) {
      setMessage("Free 只能文生图；升级 Plus 后可上传 2 张参考图，Pro/随买随用可上传 3 张。");
      return;
    }
    const selected = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (referenceImages.length + selected.length > maxReferenceImages) {
      setMessage(`当前套餐最多上传 ${maxReferenceImages} 张参考图`);
      return;
    }
    const encoded = await Promise.all(selected.map(readImageFile));
    setReferenceImages((current) => [...current, ...encoded].slice(0, maxReferenceImages));
    if (mode === "text") setMode("reference");
  }

  function removeReferenceImage(index: number) {
    setReferenceImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <section id="generator" className="studio-card generator generator-clean">
      <div className="generator-form">
        <div className="creator-heading">
          <div>
            <h1>LittleMelon Image</h1>
          </div>
          <span className="credit-pill">{tier.toUpperCase()} · {balance.toFixed(0)} 积分</span>
        </div>

        <div className="field prompt-field">
          <div className="prompt-shell">
            <label className="inline-upload" title={maxReferenceImages > 0 ? "上传参考图" : "当前套餐不支持参考图"}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  handleFiles(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
              <Plus size={22} />
            </label>
            <textarea
              className="textarea prompt-textarea"
              placeholder="输入你想生成的画面..."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
            <span className="reference-count">
              {referenceImages.length}/{maxReferenceImages} 参考图
            </span>
          </div>
          {referenceImages.length ? (
            <div className="upload-grid compact-upload-grid">
              {referenceImages.map((image, index) => (
                <div className="upload-preview" key={`${image.slice(0, 24)}-${index}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={`参考图 ${index + 1}`} />
                  <button type="button" aria-label="移除参考图" onClick={() => removeReferenceImage(index)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="tag-row preset-row">
            {activeScenario.presets.map((preset) => (
              <button className="tag" key={preset} onClick={() => setPrompt(`${preset}：${prompt}`)}>
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="control-row">
          <div className="field">
          <div className="segmented">
            {[
              ["text", "文本"],
              ["reference", "参考"],
              ["edit", "编辑"]
            ].map(([value, label]) => (
              <button
                className={`segment ${mode === value ? "active" : ""}`}
                key={value}
                onClick={() => setMode(value as typeof mode)}
              >
                {label}
              </button>
            ))}
          </div>
          </div>

          <div className="field">
          <div className="segmented">
            {(Object.keys(CREDIT_COSTS) as ImageSizeLabel[]).map((size) => (
              <button
                className={`segment ${sizeLabel === size ? "active" : ""}`}
                key={size}
                onClick={() => setSizeLabel(size)}
              >
                {size} · {CREDIT_COSTS[size]} 积分
              </button>
            ))}
          </div>
          </div>
        </div>

        <div className="control-row">
          <div className="field">
            <div className="segmented quantity-segmented">
              {[1, 2].map((value) => (
                <button
                  className={`segment ${quantity === value ? "active" : ""}`}
                  key={value}
                  onClick={() => {
                    if (value > maxQuantity) {
                      setMessage("Plus / Pro 支持一次提示词生成 2 张；Free 和随买随用默认 1 张。");
                      return;
                    }
                    setQuantity(value);
                  }}
                >
                  {value} 张
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <div className="quota-box">最多 {maxReferenceImages} 张参考图</div>
          </div>
        </div>

        {message ? <p className="notice">{message}</p> : null}

        <button className="button button-primary generate-button clean-generate-button" disabled={loading} onClick={submit}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
          {loading ? "创作中" : "立即开始创作"}
          <span>{CREDIT_COSTS[sizeLabel] * quantity} 积分</span>
        </button>
      </div>

      <aside className="result-panel">
        <div className="section-title compact">
          <div>
            <h3>生成结果</h3>
          </div>
          {result?.id ? (
            <a className="button button-secondary" href={`/api/download/${result.id}`} target="_blank">
              <Download size={16} />
              下载原图
            </a>
          ) : null}
        </div>
        <div className="result-box">
          {outputs.length ? (
            <div className={`result-output-grid ${outputs.length > 1 ? "multi" : ""}`}>
              {outputs.map((item, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={`生成结果 ${index + 1}`} key={`${item.imageUrl}-${index}`} />
              ))}
            </div>
          ) : (
            <div className="empty-result">
              <div className="empty-icon">
                <ImagePlus size={32} />
              </div>
              <p className="muted">您的作品将在这里呈现</p>
            </div>
          )}
        </div>

        <div className="section-title compact history-title">
          <h3>最近 5 张历史</h3>
        </div>
        <div className="history-grid">
          {history.map((item) => (
            <a className="card" href={`/api/download/${item.id}`} target="_blank" key={item.id} title="下载原图">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="thumb" src={item.imageUrl} alt={item.prompt} />
              ) : (
                <div className="thumb" />
              )}
            </a>
          ))}
        </div>
      </aside>
    </section>
  );
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
