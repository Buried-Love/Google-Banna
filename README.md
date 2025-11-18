# 珠宝首饰模特佩戴效果生成系统

本项目包含前后端完整代码，可通过中转 API `nano-banana-fast` 完成珠宝首饰的模特佩戴效果图生成。流程包括产品四视图上传、产品精修、模特佩戴效果生成以及成品下载预览。

## 项目结构

```
backend/   # Node.js Express 服务，负责调用 nano-banana-fast 模型
frontend/  # React + Vite 前端，高保真交互界面
```

## 后端快速开始

```bash
cd backend
npm install
cp .env.example .env  # 填入实际密钥
npm run start
```

后端默认运行在 `http://localhost:4000`，提供 `/api/generate` 接口用于生成佩戴效果图。

## 前端快速开始

```bash
cd frontend
npm install
npm run dev
```

开发环境默认在 `http://localhost:5173`，已通过 Vite 代理将 `/api` 请求转发到本地后端服务。

## 生成流程概览

1. 用户单选产品类型（项链、手链、手串、戒指、耳环）。
2. 上传产品四视图：正视、后视、左视、右视。
3. 上传佩戴比例参考图和模特动作表情参考图，可选上传自定义场景图。
4. 后端调用 `nano-banana-fast` 模型，先进行产品精修，再生成两张拥有明星气质的中国女性模特佩戴图。
5. 前端展示精修结果与两张成图，支持放大预览和一键下载。

如需部署，可将前端打包后托管于任意静态资源服务器，并将后端部署在支持 Node.js 的环境中。
