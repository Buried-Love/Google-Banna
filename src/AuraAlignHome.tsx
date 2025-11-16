import React, { useMemo, useState } from "react";

type Theme = "light" | "dark";

type UploadState = {
  file?: File;
  previewUrl?: string;
  name?: string;
};

const themeTokens = {
  shared: {
    primaryForest: "#5E7A68",
    primaryCharcoal: "#1C1C1C",
    accentGold: "#D1A36F",
    accentCandle: "#E8D8C3",
  },
  light: {
    background: "#FFFFFF",
    panel: "#F8F6F1",
    textPrimary: "#1C1C1C",
    textSecondary: "#2B2B2B",
    blurLayer: "rgba(255,255,255,0.65)",
  },
  dark: {
    background: "rgba(0,0,0,0.9)",
    panel: "rgba(255,255,255,0.06)",
    textPrimary: "#E8D8C3",
    textSecondary: "#F3EBDF",
    blurLayer: "rgba(0,0,0,0.35)",
  },
};

const defaultHeroImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80";

const defaultBackgroundImage =
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80";

const prdFeatures = [
  "今日能量标签",
  "静心提示",
  "烛光守护",
];

export async function parsePrd(file?: File) {
  if (!file) return prdFeatures;
  // placeholder for future PRD parsing
  return prdFeatures;
}

function ThemeToggle({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange("light")}
        className={`px-4 py-2 text-sm rounded-full transition duration-150 ${
          theme === "light"
            ? "bg-[#E8D8C3] text-[#1C1C1C] shadow-sm"
            : "bg-transparent border border-[#E8D8C3] text-[#E8D8C3]"
        }`}
      >
        iOS · Light
      </button>
      <button
        type="button"
        onClick={() => onChange("dark")}
        className={`px-4 py-2 text-sm rounded-full transition duration-150 ${
          theme === "dark"
            ? "bg-[#5E7A68] text-white shadow-sm"
            : "bg-transparent border border-[#5E7A68] text-[#5E7A68]"
        }`}
      >
        iOS · Dark
      </button>
    </div>
  );
}

function UploadPanel({
  backgroundRef,
  uiPrototype,
  prdFile,
  onBackgroundUpload,
  onUiPrototypeUpload,
  onPrdUpload,
  theme,
}: {
  backgroundRef: UploadState;
  uiPrototype: UploadState;
  prdFile: UploadState;
  onBackgroundUpload: (file?: File) => void;
  onUiPrototypeUpload: (file?: File) => void;
  onPrdUpload: (file?: File) => void;
  theme: Theme;
}) {
  const labelBase =
    "text-sm font-medium tracking-tight" +
    (theme === "light" ? " text-[#1C1C1C]" : " text-[#E8D8C3]");
  const cardBase =
    "rounded-2xl border p-4 transition-colors" +
    (theme === "light"
      ? " bg-[#F8F6F1] border-[#E8D8C3]"
      : " bg-[#1C1C1C]/60 border-[#5E7A68]");

  return (
    <div className="flex flex-col gap-4">
      <div className={cardBase}>
        <div className="flex items-center justify-between">
          <p className={labelBase}>背景参考图</p>
          {backgroundRef.name ? (
            <span className="text-xs text-[#5E7A68]">已上传</span>
          ) : (
            <span className="text-xs text-[#D1A36F]">待上传</span>
          )}
        </div>
        <label className="mt-2 block cursor-pointer rounded-xl border border-dashed border-[#5E7A68]/60 p-3 text-sm text-[#5E7A68] hover:border-[#5E7A68]">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onBackgroundUpload(e.target.files?.[0])}
          />
          上传森林 / 蜡烛氛围图
        </label>
        {backgroundRef.previewUrl && (
          <img
            src={backgroundRef.previewUrl}
            alt="背景参考预览"
            className="mt-3 h-28 w-full rounded-xl object-cover"
          />
        )}
      </div>

      <div className={cardBase}>
        <div className="flex items-center justify-between">
          <p className={labelBase}>产品原型图</p>
          {uiPrototype.name ? (
            <span className="text-xs text-[#5E7A68]">已上传</span>
          ) : (
            <span className="text-xs text-[#D1A36F]">待上传</span>
          )}
        </div>
        <label className="mt-2 block cursor-pointer rounded-xl border border-dashed border-[#5E7A68]/60 p-3 text-sm text-[#5E7A68] hover:border-[#5E7A68]">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onUiPrototypeUpload(e.target.files?.[0])}
          />
          上传 Figma / 原型导出图
        </label>
        {uiPrototype.previewUrl && (
          <img
            src={uiPrototype.previewUrl}
            alt="原型预览"
            className="mt-3 h-28 w-full rounded-xl object-contain bg-white/70"
          />
        )}
      </div>

      <div className={cardBase}>
        <div className="flex items-center justify-between">
          <p className={labelBase}>PRD 文档</p>
          {prdFile.name ? (
            <span className="text-xs text-[#5E7A68]">已上传</span>
          ) : (
            <span className="text-xs text-[#D1A36F]">待上传</span>
          )}
        </div>
        <label className="mt-2 block cursor-pointer rounded-xl border border-dashed border-[#5E7A68]/60 p-3 text-sm text-[#5E7A68] hover:border-[#5E7A68]">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.md,.txt"
            className="hidden"
            onChange={(e) => onPrdUpload(e.target.files?.[0])}
          />
          上传 PRD 文件
        </label>
        {prdFile.name && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-[#5E7A68]/10 px-3 py-2 text-xs text-[#1C1C1C]">
            <span className={theme === "dark" ? "text-[#E8D8C3]" : "text-[#1C1C1C]"}>{prdFile.name}</span>
            <span className="text-[#5E7A68]">已存储</span>
          </div>
        )}
      </div>
    </div>
  );
}

function HeroPreview({
  theme,
  backgroundRef,
  uiPrototype,
}: {
  theme: Theme;
  backgroundRef: UploadState;
  uiPrototype: UploadState;
}) {
  const textPrimary = theme === "light" ? themeTokens.light.textPrimary : themeTokens.dark.textPrimary;
  const textSecondary =
    theme === "light" ? themeTokens.light.textSecondary : themeTokens.dark.textSecondary;

  const backgroundImage = backgroundRef.previewUrl ?? defaultBackgroundImage;

  const backgroundStyle: React.CSSProperties = useMemo(
    () => ({
      backgroundImage: `linear-gradient(135deg, rgba(94,122,104,0.68), rgba(209,163,111,0.35)), url(${backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      filter: theme === "dark" ? "saturate(0.92) brightness(0.85)" : "saturate(1) brightness(0.97)",
    }),
    [backgroundImage, theme]
  );

  const heroImage = uiPrototype.previewUrl ?? defaultHeroImage;

  return (
    <div
      className="relative overflow-hidden rounded-3xl border"
      style={{
        borderColor: theme === "light" ? "#E8D8C3" : "#5E7A68",
        background: theme === "light" ? themeTokens.light.panel : themeTokens.dark.panel,
      }}
    >
      <div className="relative h-[540px] w-full" style={backgroundStyle}>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(232,216,195,0.22), transparent 38%), radial-gradient(circle at 80% 10%, rgba(94,122,104,0.25), transparent 40%)",
            backdropFilter: "blur(10px)",
          }}
        />

        <div className="absolute inset-0 flex flex-col justify-between px-8 py-7">
          <div className="flex items-start justify-between">
            <div className="rounded-full bg-[#E8D8C3]/30 px-4 py-2 text-xs text-[#1C1C1C] shadow-sm backdrop-blur">
              Chir Rader · Calm ritual
            </div>
            <div className="rounded-full bg-[#1C1C1C]/60 px-3 py-1 text-xs text-[#E8D8C3] backdrop-blur">
              {theme === "light" ? "亮色预览" : "暗色预览"}
            </div>
          </div>

          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-3 rounded-3xl bg-white/15 p-5 backdrop-blur-lg" style={{
              backgroundColor: theme === "light" ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.35)",
            }}>
              <div className="overflow-hidden rounded-2xl">
                <img
                  src={heroImage}
                  alt="主视觉"
                  className="h-56 w-full object-cover"
                  style={{ filter: theme === "dark" ? "brightness(0.92)" : undefined }}
                />
              </div>
              <div className="mt-4 space-y-2">
                <p
                  className="text-2xl font-semibold"
                  style={{ color: textPrimary, letterSpacing: "-0.02em" }}
                >
                  让你的今日能量被温柔照亮
                </p>
                <p className="text-sm" style={{ color: textSecondary }}>
                  静谧森林、蜡烛与水晶的微光，陪你校准情绪，开启今天的能量测算。
                </p>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {prdFeatures.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full px-3 py-1 text-xs"
                    style={{
                      backgroundColor: "rgba(94,122,104,0.14)",
                      color: textPrimary,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="col-span-2 flex flex-col justify-between rounded-3xl bg-white/12 p-4 backdrop-blur-lg" style={{
              backgroundColor: theme === "light" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.4)",
            }}>
              <div className="space-y-3">
                <p className="text-[28px] font-semibold leading-tight" style={{ color: textPrimary, letterSpacing: "-0.02em" }}>
                  今日仪式
                </p>
                <p className="text-sm leading-relaxed" style={{ color: textSecondary }}>
                  轻触一次按钮，感受森林气息与暖金光线，完成今日的能量对齐。
                </p>
              </div>
              <div className="space-y-3">
                <button
                  className="relative flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[17px] font-medium text-white shadow-sm transition duration-200 active:scale-95"
                  style={{
                    backgroundImage: "linear-gradient(120deg, #5E7A68, #D1A36F)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  开始今天的能量测算
                </button>
                <div className="flex items-center justify-between text-xs" style={{ color: textSecondary }}>
                  <span className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h14M10 7l-5 5 5 5"
                      />
                    </svg>
                    左滑跳过
                  </span>
                  <span className="flex items-center gap-2">
                    右滑抽取今日卡片
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 12H5m9 5l5-5-5-5"
                      />
                    </svg>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: textSecondary }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-4 w-4 text-[#D1A36F]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3l2.09 6.26H20l-5.05 3.67L16.18 19 12 15.9 7.82 19l1.23-6.07L4 9.26h5.91L12 3z"
                    />
                  </svg>
                  查看我的过往记录
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuraAlignHomePage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [backgroundRef, setBackgroundRef] = useState<UploadState>({});
  const [uiPrototype, setUiPrototype] = useState<UploadState>({});
  const [prdFile, setPrdFile] = useState<UploadState>({});

  const handleBackgroundUpload = (file?: File) => {
    if (!file) return;
    setBackgroundRef({ file, previewUrl: URL.createObjectURL(file), name: file.name });
  };

  const handleUiPrototypeUpload = (file?: File) => {
    if (!file) return;
    setUiPrototype({ file, previewUrl: URL.createObjectURL(file), name: file.name });
  };

  const handlePrdUpload = (file?: File) => {
    if (!file) return;
    setPrdFile({ file, name: file.name });
    void parsePrd(file);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: theme === "light" ? themeTokens.light.background : themeTokens.dark.background,
        color: theme === "light" ? themeTokens.light.textPrimary : themeTokens.dark.textPrimary,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", system-ui, sans-serif",
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1
              className="text-[32px] font-semibold"
              style={{ letterSpacing: "-0.02em" }}
            >
              Chir Rader · iOS Hero 预览
            </h1>
            <p className="text-sm text-[#5E7A68]">
              仿 iOS 首页 · 情绪氛围与仪式感主导 · 仅一个主 CTA
            </p>
          </div>
          <ThemeToggle theme={theme} onChange={setTheme} />
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <UploadPanel
              backgroundRef={backgroundRef}
              uiPrototype={uiPrototype}
              prdFile={prdFile}
              onBackgroundUpload={handleBackgroundUpload}
              onUiPrototypeUpload={handleUiPrototypeUpload}
              onPrdUpload={handlePrdUpload}
              theme={theme}
            />
          </div>
          <div className="lg:col-span-2">
            <HeroPreview theme={theme} backgroundRef={backgroundRef} uiPrototype={uiPrototype} />
          </div>
        </div>
      </div>
    </div>
  );
}
