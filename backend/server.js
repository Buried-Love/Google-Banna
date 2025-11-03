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

const callNanoBanana = async ({ model, apiKey, contents }) => {
  const endpoint = `${API_HOST}/v1beta/models/${model}:generateContent?key=${apiKey}`;
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
    throw new Error(`Nano Banana request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  if (!data?.candidates?.length) {
    throw new Error('Nano Banana response did not include any candidates.');
  }

  return data.candidates
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part?.inlineData?.data || part?.inline_data?.data)
    .filter(Boolean);
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

        const refined = await callNanoBanana({
          model: REFINEMENT_MODEL,
          apiKey: resolvedApiKey,
          contents
        });

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

      const generatedImages = await callNanoBanana({
        model: GENERATION_MODEL,
        apiKey: resolvedApiKey,
        contents: generationContents
      });

      res.json({
        refinedImages,
        generatedImages: generatedImages.slice(0, 2)
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message || 'Unexpected error occurred.' });
    }
  }
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Jewelry model backend listening on port ${PORT}`);
});
