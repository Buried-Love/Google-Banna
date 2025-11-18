import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 10,
  },
});

const REQUIRED_VIEWS = ['front', 'back', 'left', 'right'];

const apiKey = process.env.NANO_BANANA_API_KEY;
const apiHost = process.env.NANO_BANANA_API_HOST || 'http://jeniya.top';
const modelName = process.env.NANO_BANANA_MODEL || 'nano-banana-fast';

const ensureApiKey = () => {
  if (!apiKey) {
    throw new Error('Missing NANO_BANANA_API_KEY environment variable.');
  }
};

const fileToBase64 = (file) => file?.buffer?.toString('base64') ?? null;

const extractImageFromResponse = (json) => {
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const images = parts
    .filter((part) => part.inline_data && part.inline_data.data)
    .map((part) => ({
      mimeType: part.inline_data.mime_type || 'image/png',
      data: part.inline_data.data,
    }));
  return images;
};

const buildRetouchPrompt = (productType) => `你是一位专业的珠宝修图师。请对上传的${productType}产品图片进行精修，
强调真实材质、光泽和细节，保证产品形状、大小保持一致，不做夸张变化。`;

const buildGenerationPrompt = ({
  productType,
  celebrityStyle,
}) => `请生成一位中国女性亚洲面孔模特，具备明星气质和高级时尚风格，佩戴上传的${productType}。
模特的动作与表情要参考提供的动作表情图片。确保珠宝佩戴比例与上传的佩戴参考图一致，
保持产品结构不变，整体画面高级、写实。`;

app.post(
  '/api/generate',
  upload.fields([
    ...REQUIRED_VIEWS.map((view) => ({ name: `view_${view}`, maxCount: 1 })),
    { name: 'sizingReference', maxCount: 1 },
    { name: 'poseReference', maxCount: 1 },
    { name: 'sceneReference', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      ensureApiKey();
      const productType = (req.body.productType || '').trim();
      const celebrityStyle = (req.body.celebrityStyle || '高级时尚大片').trim();

      if (!productType) {
        return res.status(400).json({ message: '必须选择产品类型。' });
      }

      const files = req.files || {};

      const missingViews = REQUIRED_VIEWS.filter((view) => !files[`view_${view}`]);
      if (missingViews.length) {
        return res.status(400).json({
          message: `缺少四视图图片: ${missingViews.join(', ')}`,
        });
      }

      if (!files.sizingReference?.[0]) {
        return res.status(400).json({ message: '必须上传佩戴比例参考图。' });
      }

      if (!files.poseReference?.[0]) {
        return res.status(400).json({ message: '必须上传模特动作与表情参考图。' });
      }

      const retouchRequests = REQUIRED_VIEWS.map((view) => ({
        mimeType: files[`view_${view}`][0].mimetype,
        data: fileToBase64(files[`view_${view}`][0]),
      }));

      if (retouchRequests.some((file) => !file.data)) {
        return res.status(400).json({ message: '产品四视图文件读取失败，请重新上传。' });
      }

      const retouchPayload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: buildRetouchPrompt(productType),
              },
              ...retouchRequests.map((file) => ({
                inline_data: {
                  mime_type: file.mimeType,
                  data: file.data,
                },
              })),
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['IMAGE'],
        },
      };

      const retouchResponse = await fetch(
        `${apiHost}/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(retouchPayload),
        }
      );

      if (!retouchResponse.ok) {
        const errorText = await retouchResponse.text();
        console.error('Retouch API error:', errorText);
        return res.status(500).json({ message: '产品精修失败', details: errorText });
      }

      const retouchJson = await retouchResponse.json();
      const retouchedImages = extractImageFromResponse(retouchJson);

      if (!retouchedImages.length) {
        return res.status(500).json({ message: '未收到精修后的产品图片。' });
      }

      const primaryRetouched = retouchedImages[0];

      const generationPrompt = buildGenerationPrompt({ productType, celebrityStyle });

      const generationParts = [
        { text: generationPrompt },
        {
          inline_data: {
            mime_type: primaryRetouched.mimeType,
            data: primaryRetouched.data,
          },
        },
        {
          inline_data: {
            mime_type: files.poseReference[0].mimetype,
            data: fileToBase64(files.poseReference[0]),
          },
        },
        {
          inline_data: {
            mime_type: files.sizingReference[0].mimetype,
            data: fileToBase64(files.sizingReference[0]),
          },
        },
      ];

      if (generationParts.slice(1).some((part) => !part.inline_data.data)) {
        return res.status(400).json({ message: '参考图片读取失败，请检查文件是否损坏。' });
      }

      if (files.sceneReference?.[0]) {
        generationParts.push({
          inline_data: {
            mime_type: files.sceneReference[0].mimetype,
            data: fileToBase64(files.sceneReference[0]),
          },
        });
        if (!generationParts[generationParts.length - 1].inline_data.data) {
          return res
            .status(400)
            .json({ message: '场景参考图读取失败，请重新上传或留空。' });
        }
      }

      const generationPayload = {
        contents: [
          {
            role: 'user',
            parts: generationParts,
          },
          {
            role: 'user',
            parts: [
              {
                text: '请一次性生成2张不同构图的高清佩戴图供选择，并保持产品一致。',
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['IMAGE'],
        },
      };

      const generationResponse = await fetch(
        `${apiHost}/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(generationPayload),
        }
      );

      if (!generationResponse.ok) {
        const errorText = await generationResponse.text();
        console.error('Generation API error:', errorText);
        return res.status(500).json({ message: '佩戴效果图生成失败', details: errorText });
      }

      const generationJson = await generationResponse.json();
      const generatedImages = extractImageFromResponse(generationJson);

      if (!generatedImages.length) {
        return res.status(500).json({ message: '未获取到生成的佩戴图像。' });
      }

      res.json({
        retouchedProduct: `data:${primaryRetouched.mimeType};base64,${primaryRetouched.data}`,
        results: generatedImages.map((img) => `data:${img.mimeType};base64,${img.data}`),
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ message: '服务器内部错误', details: error.message });
    }
  }
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
