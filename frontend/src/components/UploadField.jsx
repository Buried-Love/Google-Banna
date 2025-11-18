import React, { useEffect, useMemo } from 'react';

const UploadField = ({
  label,
  description,
  file,
  onFileChange,
  accept = 'image/*',
  required = false,
}) => {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    onFileChange(nextFile);
  };

  return (
    <label className={`upload-field ${file ? 'upload-field--filled' : ''}`}>
      <span className="upload-field__label">
        {label}
        {required && <span className="required">*</span>}
      </span>
      {description && <p className="upload-field__description">{description}</p>}
      <input type="file" accept={accept} onChange={handleChange} />
      <div className="upload-field__dropzone">
        {file ? (
          <img src={preview} alt={label} />
        ) : (
          <>
            <strong>点击上传</strong>
            <span>支持拖拽，推荐 JPG/PNG，最大 15MB</span>
          </>
        )}
      </div>
    </label>
  );
};

export default UploadField;
