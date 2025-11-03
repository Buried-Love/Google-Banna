# Jewelry Model Backend

Node.js 服务负责与 nano-banana-fast 图像生成模型进行交互。

## 环境变量

复制 `.env.example` 为 `.env` 并填入自己的密钥。

- `NANO_BANANA_API_KEY`：中转 API 密钥
- `NANO_BANANA_API_HOST`：API 域名，默认 `http://jeniya.top`
- `NANO_BANANA_MODEL`：使用的模型名称，默认 `nano-banana-fast`
- `PORT`：服务端口

## 运行

```bash
npm install
npm run start
```

默认会在 `4000` 端口启动服务。
