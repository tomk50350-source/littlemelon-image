"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ImagePlus, Loader2, Sparkles, Upload, Wand2, X } from "lucide-react";
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
  error?: string;
};

export function Generator() {
  const [scenario, setScenario] = useState("ecommerce");
  const [mode, setMode] = useState<"text" | "reference" | "edit">("text");
  const [sizeLabel, setSizeLabel] = useState<ImageSizeLabel>("2K");
  const [prompt, setPrompt] = useState("为一款小众护肤品生成高级电商主图，浅绿色背景，真实摄影棚布光，产品居中，有柔和阴影。");
  const [result, setResult] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [balance, setBalance] = useState(0);
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
        body: JSON.stringify({ prompt, scenario, mode, sizeLabel, referenceImages })
      });
      const data = (await response.json()) as GenerationResponse;

      if (!response.ok || !data.generation) {
        setMessage(data.error ?? "生成失败，请稍后再试");
        return;
      }

      setResult(data.generation);
      await refreshMe();
    } finally {
      setLoading(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setMessage("");
    const selected = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (referenceImages.length + selected.length > 9) {
      setMessage("最多上传 9 张参考图");
      return;
    }
    const encoded = await Promise.all(selected.map(readImageFile));
    setReferenceImages((current) => [...current, ...encoded].slice(0, 9));
    if (mode === "text") setMode("reference");
  }

  function removeReferenceImage(index: number) {
    setReferenceImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <section id="generator" className="studio-card generator">
      <div className="generator-form">
        <div className="section-title compact">
          <div>
            <h2>生成工作台</h2>
            <p className="muted">选择场景、尺寸和任务类型，登录后可免费试运行 1 张。</p>
          </div>
          <span className="tag">余额 {balance.toFixed(1)} 积分</span>
        </div>

        <div className="scenario-grid studio-scenarios">
          {SCENARIOS.map((item) => (
            <button
              className={`scenario-card ${scenario === item.id ? "active" : ""}`}
              key={item.id}
              onClick={() => setScenario(item.id)}
            >
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </button>
          ))}
        </div>

        <div className="control-row">
          <div className="field">
          <label>任务类型</label>
          <div className="segmented">
            {[
              ["text", "文生图"],
              ["reference", "参考图生图"],
              ["edit", "AI 修图"]
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
          <label>图片尺寸</label>
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

        <div className="field">
          <label>{activeScenario.title}提示词</label>
          <textarea className="textarea" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          <div className="tag-row">
            {activeScenario.presets.map((preset) => (
              <button className="tag" key={preset} onClick={() => setPrompt(`${preset}：${prompt}`)}>
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>参考图片（最多 9 张）</label>
          <label className="upload-box">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                handleFiles(event.target.files);
                event.currentTarget.value = "";
              }}
            />
            <Upload size={18} />
            <span>上传产品、人物、风格或需要修图的参考图</span>
          </label>
          {referenceImages.length ? (
            <div className="upload-grid">
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
        </div>

        {message ? <p className="notice">{message}</p> : null}

        <button className="button button-primary generate-button" disabled={loading} onClick={submit}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
          {loading ? "生成中" : `立即开始创作 · ${CREDIT_COSTS[sizeLabel]} 积分`}
        </button>
      </div>

      <aside className="result-panel">
        <div className="section-title compact">
          <div>
            <h3>生成结果</h3>
            <p className="muted">结果支持下载原图</p>
          </div>
          {result?.id ? (
            <a className="button button-secondary" href={`/api/download/${result.id}`} target="_blank">
              <Download size={16} />
              下载原图
            </a>
          ) : null}
        </div>
        <div className="result-box">
          {result?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result.imageUrl} alt="生成结果" />
          ) : (
            <div className="empty-result">
              <div className="empty-icon">
                <ImagePlus size={32} />
              </div>
              <strong>等待生成</strong>
              <p className="muted">生成后的图片会显示在这里</p>
              <span>
                <Sparkles size={14} />
                支持电商、修图、专利线稿
              </span>
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
