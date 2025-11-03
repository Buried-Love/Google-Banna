import React, { useMemo, useState } from 'react';
import axios from 'axios';
import UploadField from './components/UploadField.jsx';
import ResultGallery from './components/ResultGallery.jsx';

const PRODUCT_TYPES = [
  { value: '项链', label: '项链 Necklace' },
  { value: '手链', label: '手链 Bracelet' },
  { value: '手串', label: '手串 Beaded bracelet' },
  { value: '戒指', label: '戒指 Ring' },
  { value: '耳环', label: '耳环 Earrings' },
];

const viewLabels = {
  front: '正视图',
  back: '后视图',
  left: '左视图',
  right: '右视图',
};

const initialState = {
  productType: '',
  celebrityStyle: '高级时尚大片',
  views: {
    front: null,
    back: null,
    left: null,
    right: null,
  },
  sizingReference: null,
  poseReference: null,
  sceneReference: null,
};

const App = () => {
  const [formState, setFormState] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [retouched, setRetouched] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const readyToSubmit = useMemo(() => {
    const hasViews = Object.values(formState.views).every(Boolean);
    return (
      formState.productType &&
      hasViews &&
      formState.sizingReference &&
      formState.poseReference &&
      !submitting
    );
  }, [formState, submitting]);

  const updateViewFile = (key, file) => {
    setFormState((prev) => ({
      ...prev,
      views: { ...prev.views, [key]: file },
    }));
  };

  const resetAll = () => {
    setFormState(initialState);
    setRetouched(null);
    setResults([]);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!readyToSubmit) return;
    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('productType', formState.productType);
      formData.append('celebrityStyle', formState.celebrityStyle);

      Object.entries(formState.views).forEach(([key, file]) => {
        if (file) {
          formData.append(`view_${key}`, file);
        }
      });

      formData.append('sizingReference', formState.sizingReference);
      formData.append('poseReference', formState.poseReference);
      if (formState.sceneReference) {
        formData.append('sceneReference', formState.sceneReference);
      }

      const response = await axios.post('/api/generate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setRetouched(response.data.retouchedProduct);
      setResults(response.data.results || []);
    } catch (err) {
      const message = err.response?.data?.message || err.message || '生成失败';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>珠宝首饰模特佩戴效果生成</h1>
          <p>
            上传四视图产品图片、佩戴比例参考、模特动作表情参考以及可选场景，即可生成拥有明星气质的中国女性模特佩戴图。
          </p>
        </div>
        <button type="button" className="ghost" onClick={resetAll}>
          重置
        </button>
      </header>

      <main className="layout">
        <form className="panel" onSubmit={handleSubmit}>
          <section className="section">
            <h2>1. 选择产品类型</h2>
            <p className="section__hint">一次选择一个品类以保证佩戴效果精准。</p>
            <div className="grid grid--two">
              {PRODUCT_TYPES.map((item) => (
                <label
                  key={item.value}
                  className={`card-option ${
                    formState.productType === item.value ? 'card-option--active' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="productType"
                    value={item.value}
                    checked={formState.productType === item.value}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, productType: e.target.value }))
                    }
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="section">
            <h2>2. 上传产品四视图</h2>
            <p className="section__hint">确保画面清晰，光线一致，便于大模型识别材质与细节。</p>
            <div className="grid grid--four">
              {Object.entries(viewLabels).map(([key, label]) => (
                <UploadField
                  key={key}
                  label={`${label}`}
                  file={formState.views[key]}
                  onFileChange={(file) => updateViewFile(key, file)}
                  accept="image/*"
                  required
                />
              ))}
            </div>
          </section>

          <section className="section">
            <h2>3. 上传参考图</h2>
            <div className="grid grid--three">
              <UploadField
                label="佩戴比例参考图"
                description="用于识别产品尺寸比例，可为假人或真人模特佩戴图"
                file={formState.sizingReference}
                onFileChange={(file) => setFormState((prev) => ({ ...prev, sizingReference: file }))}
                accept="image/*"
                required
              />
              <UploadField
                label="模特动作表情参考图"
                description="模特姿态和表情将完全参考此图"
                file={formState.poseReference}
                onFileChange={(file) => setFormState((prev) => ({ ...prev, poseReference: file }))}
                accept="image/*"
                required
              />
              <UploadField
                label="自定义场景 (可选)"
                description="不上传则由模型自动生成最适合的场景"
                file={formState.sceneReference}
                onFileChange={(file) => setFormState((prev) => ({ ...prev, sceneReference: file }))}
                accept="image/*"
              />
            </div>
          </section>

          <section className="section">
            <h2>4. 生成设置</h2>
            <label className="field">
              <span>模特风格关键词</span>
              <input
                type="text"
                value={formState.celebrityStyle}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, celebrityStyle: e.target.value }))
                }
                placeholder="例如：高级时尚大片, 红毯明星气质"
              />
            </label>
          </section>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="primary" disabled={!readyToSubmit}>
            {submitting ? '生成中...' : '生成模特佩戴效果图'}
          </button>
        </form>

        <section className="panel panel--results">
          <h2>生成结果预览</h2>
          <p className="section__hint">
            系统会先进行产品精修，再生成两张明星范中国女性模特佩戴图。可点击图片查看大图并下载。
          </p>

          {retouched && (
            <div className="retouch-preview">
              <h3>产品精修效果</h3>
              <img src={retouched} alt="retouched product" />
            </div>
          )}

          <ResultGallery images={results} submitting={submitting} />
        </section>
      </main>
    </div>
  );
};

export default App;
