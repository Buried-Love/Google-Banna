import React, { useState } from 'react';

const ResultGallery = ({ images = [], submitting }) => {
  const [preview, setPreview] = useState(null);

  const handleDownload = (src, index) => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `jewelry-look-${index + 1}.png`;
    link.click();
  };

  return (
    <div className="result-gallery">
      {submitting && <div className="loading">正在生成高保真效果图，请稍候...</div>}
      {!submitting && images.length === 0 && (
        <p className="placeholder">生成完成后将在此展示两张可下载的大图。</p>
      )}
      <div className="result-grid">
        {images.map((src, index) => (
          <article key={`${index}-${src.length}`} className="result-card">
            <img src={src} alt={`result-${index + 1}`} onClick={() => setPreview(src)} />
            <footer>
              <button type="button" onClick={() => setPreview(src)}>
                放大预览
              </button>
              <button type="button" onClick={() => handleDownload(src, index)}>
                下载图片
              </button>
            </footer>
          </article>
        ))}
      </div>

      {preview && (
        <div className="modal" onClick={() => setPreview(null)}>
          <div className="modal__content" onClick={(e) => e.stopPropagation()}>
            <img src={preview} alt="preview" />
            <button type="button" onClick={() => setPreview(null)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultGallery;
