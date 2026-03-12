import React, { useState, useRef } from 'react';
import imageCompressor from '../../utils/imageCompressor';
import css from './ImageUploadField.module.css';

/**
 * Reusable Image Upload Component with Automatic Compression
 * Use this for all image uploads across the app
 */
const ImageUploadField = ({
    label = 'Upload Image',
    onUpload,
    isQR = false,
    currentImage = null,
    accept = 'image/jpeg,image/jpg,image/png,image/webp',
    maxSizeMB = 10,
    showPreview = true,
    showCompressionStats = true
}) => {
    const [isCompressing, setIsCompressing] = useState(false);
    const [preview, setPreview] = useState(currentImage);
    const [compressionResult, setCompressionResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError(null);
        setCompressionResult(null);

        // Validate file size
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File too large. Maximum size is ${maxSizeMB}MB.`);
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file (JPG, PNG, or WebP).');
            return;
        }

        setIsCompressing(true);

        try {
            // Compress image
            const result = await imageCompressor.compress(file, { isQR });

            setCompressionResult(result);

            // Create preview
            if (showPreview) {
                const reader = new FileReader();
                reader.onload = (e) => setPreview(e.target.result);
                reader.readAsDataURL(result.file);
            }

            // Call parent callback with compressed file
            if (onUpload) {
                await onUpload(result.file, result);
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to process image');
        } finally {
            setIsCompressing(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        setCompressionResult(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={css.uploadField}>
            <label className={css.label}>{label}</label>

            <div className={css.uploadArea}>
                {!preview ? (
                    <div className={css.uploadPrompt}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={accept}
                            onChange={handleFileSelect}
                            disabled={isCompressing}
                            className={css.fileInput}
                        />
                        <div className={css.uploadIcon}>📷</div>
                        <p className={css.uploadText}>
                            {isCompressing ? 'Optimizing image...' : 'Click to upload or drag and drop'}
                        </p>
                        <p className={css.uploadHint}>
                            JPG, PNG or WebP (max {maxSizeMB}MB)
                        </p>
                    </div>
                ) : (
                    <div className={css.previewArea}>
                        <img src={preview} alt="Preview" className={css.previewImage} />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className={css.removeBtn}
                        >
                            ✕ Remove
                        </button>
                    </div>
                )}
            </div>

            {isCompressing && (
                <div className={css.compressing}>
                    <div className={css.spinner}></div>
                    <span>Optimizing image...</span>
                </div>
            )}

            {compressionResult && showCompressionStats && compressionResult.wasCompressed && (
                <div className={css.success}>
                    ✅ Image optimized successfully (↓ {compressionResult.savings}% size saved)
                </div>
            )}

            {error && (
                <div className={css.error}>
                    ❌ {error}
                </div>
            )}

            {isQR && (
                <div className={css.qrNote}>
                    ℹ️ QR code will be optimized for scanning
                </div>
            )}
        </div>
    );
};

export default ImageUploadField;
