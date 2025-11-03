import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 6
  }
});

const API_HOST = process.env.NANO_BANANA_HOST || 'http://jeniya.top';
const REFINEMENT_MODEL = process.env.NANO_BANANA_REFINEMENT_MODEL || 'gemini-2.5-flash-image-preview';
const GENERATION_MODEL = process.env.NANO_BANANA_GENERATION_MODEL || 'nano-banana-fast';

const bufferToBase64 = (buffer) => buffer.toString('base64');

const isChannelUnavailable = (status, body) => {
  if (status === 503) return true;
  if (!body) return false;
  return /No available channels/i.test(body);
};

const callNanoBanana = async ({ model, apiKey, contents, fallbackModels = [] }) => {
  const uniqueFallbacks = fallbackModels.filter(
    (candidate, index, list) =>
      Boolean(candidate) &&
      list.indexOf(candidate) === index &&
      candidate !== model
  );

  const modelsToTry = [model, ...uniqueFallbacks];
  let lastError = null;

  for (let index = 0; index < modelsToTry.length; index += 1) {
    const currentModel = modelsToTry[index];
    const endpoint = `${API_HOST}/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            responseModalities: ['IMAGE']
          }
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const error = new Error(
          `Nano Banana request failed (${response.status}) [${currentModel}]: ${errorBody}`
        );
        error.status = response.status;
        error.body = errorBody;
        error.model = currentModel;
        lastError = error;

        const channelUnavailable = isChannelUnavailable(response.status, errorBody);
        const hasFallback = index < modelsToTry.length - 1;

        if (channelUnavailable && hasFallback) {
          console.warn(
            `Model ${currentModel} is unavailable (${response.status}). Attempting fallback ${modelsToTry[index + 1]}.`
          );
          continue;
        }

        if (channelUnavailable) {
          error.friendlyMessage =
            '当前模型通道不可用，请稍后重试或在环境变量中配置备用模型。';
        }

        throw error;
      }

      const data = await response.json();
      if (!data?.candidates?.length) {
        const error = new Error(`Nano Banana response from ${currentModel} did not include any candidates.`);
        error.model = currentModel;
        throw error;
      }

      const parts = data.candidates
        .flatMap((candidate) => candidate?.content?.parts || [])
        .map((part) => part?.inlineData?.data || part?.inline_data?.data)
        .filter(Boolean);

      if (!parts.length) {
        const error = new Error(`Nano Banana response from ${currentModel} did not contain image data.`);
        error.model = currentModel;
        throw error;
      }

      if (index > 0) {
        console.info(`Model ${currentModel} succeeded after attempting fallback options.`);
      }

      return { data: parts, modelUsed: currentModel };
    } catch (error) {
      lastError = error;
      const message = error.body || error.message || '';
      const channelUnavailable = isChannelUnavailable(error.status, message);
      const hasFallback = index < modelsToTry.length - 1;

      if (channelUnavailable && hasFallback) {
        console.warn(
          `Model ${currentModel} failed due to unavailable channel. Trying fallback ${modelsToTry[index + 1]}.`
        );
        continue;
      }

      throw error;
    }
  }

  if (lastError) {
    if (isChannelUnavailable(lastError.status, lastError.body || lastError.message)) {
      lastError.friendlyMessage =
        lastError.friendlyMessage || '当前模型通道不可用，请稍后重试或在环境变量中配置备用模型。';
    }
    throw lastError;
  }

  throw new Error('Nano Banana request failed without additional details.');
};

const buildRefinementPrompt = (productType) => `Refine this ${productType} jewelry product photo.
- Maintain exact geometry and materials without deformation.
- Clean blemishes, dust, and stray reflections while keeping authenticity.
- Deliver a studio-grade, high-detail asset ready for hero rendering.`;

const buildGenerationPrompt = ({
  productType,
  scenePrompt,
  customScene,
  guidance,
  poseNotes
}) => {
  const base = [
    `Create a hyper-realistic studio photograph of a Chinese female model with celebrity presence wearing the provided ${productType}.`,
    'The model should have a poised, confident expression and follow the pose and facial cues from the reference image.',
    'Respect the refined jewelry silhouette, material, and proportions precisely with no distortion.',
    'Ensure the jewelry integrates naturally with the model and lighting, preserving accurate scale from the product photos.'
  ];

  if (scenePrompt) {
    base.push(`Blend in the user-provided styling notes: ${scenePrompt}.`);
  }
  if (customScene) {
    base.push(`Use the user uploaded background scene to ground the composition.`);
  } else {
    base.push('Generate an elegant, high-fashion editorial backdrop that complements luxury jewelry.');
  }
  if (guidance) {
    base.push(guidance);
  }
  if (poseNotes) {
    base.push(`Mirror these pose highlights: ${poseNotes}.`);
  }

  base.push('Return two distinct framing options for user review.');

  return base.join('\n');
};

app.post(
  '/api/generate',
  upload.fields([
    { name: 'productFront', maxCount: 1 },
    { name: 'productBack', maxCount: 1 },
    { name: 'productLeft', maxCount: 1 },
    { name: 'productRight', maxCount: 1 },
    { name: 'modelReference', maxCount: 1 },
    { name: 'customScene', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        productType,
        scenePrompt,
        poseNotes,
        apiKey
      } = req.body;

      if (!apiKey && !process.env.NANO_BANANA_API_KEY) {
        return res.status(400).json({ error: 'API key is required.' });
      }

      const resolvedApiKey = apiKey || process.env.NANO_BANANA_API_KEY;

      if (!productType) {
        return res.status(400).json({ error: 'Product type is required.' });
      }

      const files = req.files || {};
      const requiredFields = ['productFront', 'productBack', 'productLeft', 'productRight', 'modelReference'];
      const missing = requiredFields.filter((field) => !files[field]?.length);
      if (missing.length) {
        return res.status(400).json({ error: `Missing required uploads: ${missing.join(', ')}` });
      }

      const customSceneFile = files.customScene?.[0] || null;

      // Step 1: refine product images
      const refinedImages = {};
      for (const field of requiredFields.slice(0, 4)) {
        const file = files[field][0];
        const base64 = bufferToBase64(file.buffer);
        const contents = [
          {
            role: 'user',
            parts: [
              { text: buildRefinementPrompt(productType) },
              {
                inline_data: {
                  mime_type: file.mimetype || 'image/png',
                  data: base64
                }
              }
            ]
          }
        ];

        const { data: refined, modelUsed } = await callNanoBanana({
          model: REFINEMENT_MODEL,
          apiKey: resolvedApiKey,
          contents,
          fallbackModels: [
            process.env.NANO_BANANA_REFINEMENT_FALLBACK_MODEL || 'gemini-2.5-flash-image'
          ]
        });

        if (modelUsed !== REFINEMENT_MODEL) {
          console.info(`Refinement for ${field} completed via fallback model ${modelUsed}.`);
        }

        refinedImages[field] = refined[0];
      }

      // Step 2: prepare generation request
      const generationParts = [
        {
          text: buildGenerationPrompt({
            productType,
            scenePrompt,
            customScene: Boolean(customSceneFile),
            poseNotes,
            guidance: 'Focus lighting to accentuate gemstones, metal sheen, and craftsmanship details.'
          })
        }
      ];

      // Use front refined image as primary inline data
      generationParts.push({
        inline_data: {
          mime_type: files.productFront[0].mimetype || 'image/png',
          data: refinedImages.productFront
        }
      });

      // Attach model pose reference
      generationParts.push({
        inline_data: {
          mime_type: files.modelReference[0].mimetype || 'image/png',
          data: bufferToBase64(files.modelReference[0].buffer)
        }
      });

      // Provide additional context by sending rest refined views
      for (const key of ['productBack', 'productLeft', 'productRight']) {
        generationParts.push({
          inline_data: {
            mime_type: files[key][0].mimetype || 'image/png',
            data: refinedImages[key]
          }
        });
      }

      if (customSceneFile) {
        generationParts.push({
          inline_data: {
            mime_type: customSceneFile.mimetype || 'image/png',
            data: bufferToBase64(customSceneFile.buffer)
          }
        });
      }

      const generationContents = [
        {
          role: 'user',
          parts: generationParts
        }
      ];

      const { data: generatedImages, modelUsed: generationModel } = await callNanoBanana({
        model: GENERATION_MODEL,
        apiKey: resolvedApiKey,
        contents: generationContents,
        fallbackModels: [process.env.NANO_BANANA_GENERATION_FALLBACK_MODEL].filter(Boolean)
      });

      if (generationModel !== GENERATION_MODEL) {
        console.info(`Generation completed via fallback model ${generationModel}.`);
      }

      res.json({
        refinedImages,
        generatedImages: generatedImages.slice(0, 2)
      });
    } catch (error) {
      console.error(error);
      const statusCode = error.status && Number.isInteger(error.status) ? error.status : 500;
      res.status(statusCode).json({
        error: error.friendlyMessage || error.message || 'Unexpected error occurred.'
      });
    }
  }
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Jewelry model backend listening on port ${PORT}`);
});
