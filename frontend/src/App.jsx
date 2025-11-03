import { useState, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const PRODUCT_TYPES = [
  { value: 'necklace', label: '项链' },
  { value: 'bracelet', label: '手链' },
  { value: 'string-bracelet', label: '手串' },
  { value: 'ring', label: '戒指' },
  { value: 'earring', label: '耳环' }
];

const fieldConfigs = [
  { key: 'productFront', label: '产品正视图', helper: '保证正对镜头，展示主体细节。' },
  { key: 'productBack', label: '产品后视图', helper: '补充扣具和背部结构。' },
  { key: 'productLeft', label: '产品左视图', helper: '展示厚度与侧面轮廓。' },
  { key: 'productRight', label: '产品右视图', helper: '帮助模型理解对称关系。' },
  { key: 'modelReference', label: '模特动作表情参考', helper: '高清假人或真人佩戴图，用于同步姿势和情绪。' },
  { key: 'customScene', label: '自定义场景（可选）', helper: '上传场景图，若留空则自动匹配奢华风格。', optional: true }
];

const emptyState = {
  productType: '',
  scenePrompt: '',
  poseNotes: '',
  apiKey: ''
};

const initialFiles = fieldConfigs.reduce((acc, field) => {
  acc[field.key] = null;
  return acc;
}, {});

const sectionTitle = (title, subtitle) => (
  <div className="flex flex-col gap-1">
    <h2 className="text-2xl font-display text-rose tracking-wide">{title}</h2>
    {subtitle && <p className="text-sm text-slate-300">{subtitle}</p>}
  </div>
);

const FileUploader = ({ field, value, onChange }) => {
  const preview = useMemo(() => {
    if (!value) return null;
    return URL.createObjectURL(value);
  }, [value]);

  return (
    <label className="group relative flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-luxe transition hover:-translate-y-1 hover:border-rose hover:shadow-rose/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-white">{field.label}</p>
          <p className="text-xs text-slate-400">{field.helper}</p>
        </div>
        {!field.optional && <span className="rounded-full border border-rose px-3 py-1 text-xs text-rose">必传</span>}
      </div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
      <div className="relative flex min-h-[180px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-700 bg-slate-900">
        {preview ? (
          <img src={preview} alt={field.label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-12 w-12"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            <p className="text-sm">点击或拖拽图片到此处</p>
          </div>
        )}
      </div>
    </label>
  );
};

const GeneratedImageCard = ({ image, index, onPreview, onDownload }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, delay: index * 0.05 }}
    className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-luxe"
  >
    <img src={`data:image/png;base64,${image}`} alt={`生成结果 ${index + 1}`} className="h-96 w-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-950/80 opacity-0 transition group-hover:opacity-100" />
    <div className="absolute bottom-6 left-6 flex gap-3">
      <button
        onClick={() => onPreview(image)}
        className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
      >
        预览
      </button>
      <button
        onClick={() => onDownload(image, index)}
        className="rounded-full bg-rose px-5 py-2 text-sm font-medium text-slate-900 shadow-lg shadow-rose/40 hover:bg-rose/90"
      >
        下载
      </button>
    </div>
  </motion.div>
);

const ModalPreview = ({ open, onClose, image }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-[min(90vw,900px)] overflow-hidden rounded-3xl border border-slate-700 bg-slate-900"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-slate-900/80 p-2 text-slate-200 hover:bg-slate-800"
          >
            ✕
          </button>
          <img src={`data:image/png;base64,${image}`} alt="预览" className="h-full w-full object-contain" />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const steps = [
  {
    title: '上传珠宝多视角图',
    description: '正、后、左、右视角帮助模型掌握真实结构与比例。'
  },
  {
    title: '提供模特姿势参考',
    description: '参考图可来自假人或真人，确保姿态与情绪合适。'
  },
  {
    title: '可选场景或文字风格',
    description: '上传自定义场景，或通过文字描述理想氛围。'
  },
  {
    title: '一键生成精修佩戴图',
    description: '自动完成产品精修，并输出两张高定风格佩戴方案。'
  }
];

const Stepper = () => (
  <div className="grid gap-6 md:grid-cols-4">
    {steps.map((step, index) => (
      <motion.div
        key={step.title}
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/60 to-slate-900/20 p-6 shadow-luxe"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose/20 text-lg font-semibold text-rose">
          {index + 1}
        </div>
        <h3 className="text-lg font-semibold text-white">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{step.description}</p>
      </motion.div>
    ))}
  </div>
);

const App = () => {
  const [form, setForm] = useState(emptyState);
  const [files, setFiles] = useState(initialFiles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleFileChange = (field, file) => {
    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const handleInputChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const missingFields = useMemo(() => {
    const requiredKeys = fieldConfigs.filter((field) => !field.optional).map((field) => field.key);
    return requiredKeys.filter((key) => !files[key]);
  }, [files]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.productType) {
      setError('请选择产品品类。');
      return;
    }

    if (missingFields.length) {
      setError('请上传所有必需的图片素材。');
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('productType', form.productType);
      payload.append('scenePrompt', form.scenePrompt);
      payload.append('poseNotes', form.poseNotes);
      if (form.apiKey) {
        payload.append('apiKey', form.apiKey);
      }

      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          payload.append(key, file);
        }
      });

      const { data } = await axios.post('/api/generate', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(data);
    } catch (apiError) {
      const message = apiError?.response?.data?.error || apiError.message || '生成失败，请稍后重试。';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (image, index) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${image}`;
    link.download = `jewelry-model-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <ModalPreview open={Boolean(previewImage)} onClose={() => setPreviewImage(null)} image={previewImage} />
      <main className="mx-auto flex max-w-7xl flex-col gap-16 px-6 py-12">
        <header className="rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.25),_transparent_60%)] p-10 shadow-luxe">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-4">
              <p className="text-sm uppercase tracking-[0.4em] text-rose">NANO BANANA FAST</p>
              <h1 className="text-4xl font-display leading-tight text-white md:text-5xl">
                珠宝首饰模特佩戴生成工作台
              </h1>
              <p className="text-base leading-relaxed text-slate-300">
                一次上传多视角产品图与模特姿态参考，自动完成产品精修与明星气质亚洲女性模特佩戴效果生成。
                输出两张高清图，可放大预览与立即下载。
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-rose/40 bg-rose/10 p-6 text-rose">
              <p className="text-sm font-semibold">调用模型：nano-banana-fast（中转 Gemini 图像接口）</p>
              <p className="text-xs text-rose/80">请确保 API Key 拥有图片生成功能权限。</p>
            </div>
          </div>
        </header>

        <section className="space-y-10">
          {sectionTitle('使用流程', '完整流程确保生成结果保真、贴合原始产品设计。')}
          <Stepper />
        </section>

        <section className="space-y-8">
          {sectionTitle('上传素材与生成参数', '填写产品信息，上传所有素材文件，系统将完成精修与佩戴效果生成。')}
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-luxe">
                  <label className="text-sm font-semibold text-slate-300">产品品类</label>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {PRODUCT_TYPES.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange('productType', option.value)}
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          form.productType === option.value
                            ? 'border-rose bg-rose text-slate-900 shadow-lg shadow-rose/40'
                            : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-rose/40 hover:text-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {fieldConfigs.map((field) => (
                    <FileUploader
                      key={field.key}
                      field={field}
                      value={files[field.key]}
                      onChange={(file) => handleFileChange(field.key, file)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-luxe">
                  <label className="text-sm font-semibold text-slate-300">场景/风格描述</label>
                  <textarea
                    value={form.scenePrompt}
                    onChange={(event) => handleInputChange('scenePrompt', event.target.value)}
                    placeholder="例如：巴黎高级珠宝发布会秀场灯光，暖金色调，柔焦背景。"
                    className="mt-4 h-32 w-full resize-none rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-rose focus:outline-none"
                  />
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-luxe">
                  <label className="text-sm font-semibold text-slate-300">姿势与细节提示</label>
                  <textarea
                    value={form.poseNotes}
                    onChange={(event) => handleInputChange('poseNotes', event.target.value)}
                    placeholder="例如：模特微微抬头，目光自信，双肩放松，手部自然勾勒项链线条。"
                    className="mt-4 h-32 w-full resize-none rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-rose focus:outline-none"
                  />
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-luxe">
                  <label className="text-sm font-semibold text-slate-300">Nano Banana API Key</label>
                  <input
                    type="password"
                    value={form.apiKey}
                    onChange={(event) => handleInputChange('apiKey', event.target.value)}
                    placeholder="如后端已配置，可留空"
                    className="mt-4 w-full rounded-full border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-rose focus:outline-none"
                  />
                  <p className="mt-3 text-xs text-slate-400">
                    出于安全考虑，推荐在后端配置固定密钥，仅在调试时通过前端填写。
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose/40 bg-rose/10 p-4 text-sm text-rose">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between gap-4 rounded-3xl border border-rose/40 bg-gradient-to-r from-rose/20 via-rose/10 to-transparent p-6">
              <div>
                <p className="text-sm font-semibold text-rose">生成前检测</p>
                <p className="mt-1 text-xs text-rose/70">
                  {missingFields.length
                    ? `仍缺少 ${missingFields.length} 个必需文件。`
                    : '所有必需素材已就绪，可发起生成。'}
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-3 rounded-full bg-rose px-8 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-rose/50 transition hover:bg-rose/90 disabled:cursor-not-allowed disabled:bg-rose/40"
              >
                {loading ? (
                  <>
                    <span className="h-3 w-3 animate-ping rounded-full bg-slate-900" />
                    生成中...
                  </>
                ) : (
                  '生成明星范佩戴图'
                )}
              </button>
            </div>
          </form>
        </section>

        {result && (
          <section className="space-y-8">
            {sectionTitle('产品精修结果', '用于确保佩戴图保持与原始产品一致的细节。')}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(result.refinedImages || {}).map(([key, base64]) => (
                <div key={key} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-sm font-semibold text-slate-200">
                    {fieldConfigs.find((field) => field.key === key)?.label || key}
                  </p>
                  <img src={`data:image/png;base64,${base64}`} alt={key} className="h-52 w-full rounded-xl object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {result?.generatedImages?.length ? (
          <section className="space-y-8 pb-16">
            {sectionTitle('明星模特佩戴效果', '两套构图方案供选择，支持放大预览与下载。')}
            <div className="grid gap-6 md:grid-cols-2">
              {result.generatedImages.map((image, index) => (
                <GeneratedImageCard
                  key={image.slice(0, 32) + index}
                  image={image}
                  index={index}
                  onPreview={setPreviewImage}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
};

export default App;
