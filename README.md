# 珠宝模特佩戴生成应用

本项目提供一个完整的前后端解决方案，帮助珠宝品牌根据多视角产品图和模特参考图，快速生成中国女性明星范模特的佩戴效果图。后台调用 `nano-banana-fast` 中转服务（Gemini 图片生成接口）先对产品进行精修，再生成两张佩戴效果图。

## 功能亮点

- ✅ **必传素材校验**：要求上传项链/手链/手串/戒指/耳环中任一产品的四视图及模特参考图，确保生成结果真实可信。
- 🎯 **自动产品精修**：在生成佩戴图前自动调用精修模型处理产品图，保持结构与材质的一致性。
- 👩‍🎤 **明星范亚洲模特**：根据上传的模特姿势与表情参考生成中国女性模特形象，可选自定义场景或由模型自动生成高奢背景。
- 🖼️ **两张候选图**：一次输出两张高清图，支持放大预览与一键下载。
- 🧭 **高保真前端体验**：Vite + React + Tailwind 打造的沉浸式操作界面，实时展示精修结果与生成效果。

## 目录结构

```
├── backend
│   ├── server.js          # Node.js Express 服务，负责调度 nano-banana-fast 接口
│   ├── package.json
│   └── .env.example       # 环境变量示例
├── frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
└── README.md
```

## 快速开始

### 1. 启动后端

```bash
cd backend
npm install
cp .env.example .env   # 可选，填写 NANO_BANANA_API_KEY 等配置
npm run start
```

后端默认运行在 `http://localhost:4000`，负责：

1. 校验必需上传项。
2. 调用 `gemini-2.5-flash-image-preview` 模型进行产品精修。
3. 调用 `gemini-2.5-flash-image` 模型生成佩戴图，两张候选图返回前端。

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

浏览器访问 `http://localhost:5173` 即可使用应用。

> **提示**：若在后端 `.env` 中配置了 `NANO_BANANA_API_KEY`，前端可以留空 API Key 字段；否则在界面中输入 Key 也可完成调用。

## API 调用说明

后端默认使用 `http://jeniya.top` 作为中转域名，通过以下两个端点与服务对接：

- `POST /v1beta/models/gemini-2.5-flash-image-preview:generateContent`：用于产品精修，可通过 `NANO_BANANA_REFINEMENT_MODEL` 调整模型名称。
- `POST /v1beta/models/nano-banana-fast:generateContent`：用于生成模特佩戴图，可通过 `NANO_BANANA_GENERATION_MODEL` 覆盖。

请求参数遵循 Google Gemini 原生格式，通过 `contents` 数组提交提示词与 `inline_data` 图片，`generationConfig.responseModalities` 设为 `IMAGE` 以获取图像结果。

## 自定义与扩展

- **场景自定义**：前端允许上传一张场景图片；若不上传，后端会提示模型自动生成最适合的高奢场景风格。
- **并发与超时**：可在 `callNanoBanana` 中扩展重试、超时等逻辑，以应对长时间推理。
- **存储**：如需持久化精修结果或生成图，可在后端将 Base64 转换为文件后存储在对象存储或 CDN。

欢迎根据品牌视觉风格进一步定制界面与提示词。若需部署生产环境，可将前端构建产物部署到静态托管，同时将后端部署至支持 Node.js 的云服务，并配置 HTTPS 与鉴权。祝生成顺利！
