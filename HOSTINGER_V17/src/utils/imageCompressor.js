/**
 * Global Image Compression Utility
 * Handles all image uploads with automatic compression
 * Supports WebP conversion, quality optimization, and QR code special handling
 */

import { useState } from 'react';

class ImageCompressor {
    constructor() {
        this.defaultSettings = {
            maxWidth: 1280,
            maxHeight: 1280,
            quality: 0.75,
            format: 'webp',
            maxSizeKB: 300
        };

        this.qrSettings = {
            maxWidth: 800,
            maxHeight: 800,
            quality: 0.90,
            format: 'webp',
            maxSizeKB: 150,
            minWidth: 600 // Never resize below this for QR codes
        };
    }

    /**
     * Main compression function
     * @param {File} file - Image file to compress
     * @param {Object} options - Compression options
     * @returns {Promise<{file: File, originalSize: number, compressedSize: number, savings: number}>}
     */
    async compress(file, options = {}) {
        try {
            // Validate file
            if (!this.isValidImageFile(file)) {
                throw new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.');
            }

            const originalSize = file.size;

            // Determine if this is a QR code
            const isQR = options.isQR || this.isLikelyQRCode(file.name);
            const settings = isQR ? { ...this.qrSettings, ...options } : { ...this.defaultSettings, ...options };

            console.log(`Compressing ${file.name} (${this.formatBytes(originalSize)})...`);

            // Load image
            const img = await this.loadImage(file);

            // Calculate new dimensions
            const dimensions = this.calculateDimensions(img.width, img.height, settings.maxWidth, settings.maxHeight, isQR);

            // Create canvas and compress
            const compressedBlob = await this.compressImage(img, dimensions, settings);

            // Check if compression was successful
            if (compressedBlob.size >= originalSize * 0.95) {
                console.log('Compression not beneficial, using original');
                return {
                    file: file,
                    originalSize,
                    compressedSize: originalSize,
                    savings: 0,
                    wasCompressed: false
                };
            }

            // Convert blob to file
            const compressedFile = new File(
                [compressedBlob],
                this.getCompressedFileName(file.name, settings.format),
                { type: compressedBlob.type }
            );

            const savings = ((originalSize - compressedFile.size) / originalSize * 100).toFixed(1);

            console.log(`✅ Compressed: ${this.formatBytes(originalSize)} → ${this.formatBytes(compressedFile.size)} (↓${savings}%)`);

            return {
                file: compressedFile,
                originalSize,
                compressedSize: compressedFile.size,
                savings: parseFloat(savings),
                wasCompressed: true
            };
        } catch (err) {
            console.error('Compression failed:', err);
            // Return original file on error
            return {
                file: file,
                originalSize: file.size,
                compressedSize: file.size,
                savings: 0,
                wasCompressed: false,
                error: err.message
            };
        }
    }

    /**
     * Compress image using canvas
     */
    async compressImage(img, dimensions, settings) {
        const canvas = document.createElement('canvas');
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        const ctx = canvas.getContext('2d');

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image
        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

        // Try WebP first, fallback to JPEG
        let blob;
        try {
            blob = await this.canvasToBlob(canvas, `image/${settings.format}`, settings.quality);

            // If WebP not supported or blob too large, try JPEG
            if (!blob || blob.size > settings.maxSizeKB * 1024) {
                blob = await this.canvasToBlob(canvas, 'image/jpeg', settings.quality);
            }
        } catch (err) {
            // Fallback to JPEG
            blob = await this.canvasToBlob(canvas, 'image/jpeg', settings.quality);
        }

        return blob;
    }

    /**
     * Convert canvas to blob
     */
    canvasToBlob(canvas, mimeType, quality) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas to blob conversion failed'));
                    }
                },
                mimeType,
                quality
            );
        });
    }

    /**
     * Load image from file
     */
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        });
    }

    /**
     * Calculate new dimensions while preserving aspect ratio
     */
    calculateDimensions(width, height, maxWidth, maxHeight, isQR = false) {
        let newWidth = width;
        let newHeight = height;

        // For QR codes, never go below minimum width
        if (isQR && width < this.qrSettings.minWidth && height < this.qrSettings.minWidth) {
            return { width, height }; // Keep original size
        }

        // Calculate scaling
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            newWidth = Math.round(width * ratio);
            newHeight = Math.round(height * ratio);
        }

        return { width: newWidth, height: newHeight };
    }

    /**
     * Validate image file
     */
    isValidImageFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        return validTypes.includes(file.type);
    }

    /**
     * Check if filename suggests QR code
     */
    isLikelyQRCode(filename) {
        const qrKeywords = ['qr', 'qrcode', 'upi', 'payment'];
        const lowerName = filename.toLowerCase();
        return qrKeywords.some(keyword => lowerName.includes(keyword));
    }

    /**
     * Get compressed filename
     */
    getCompressedFileName(originalName, format) {
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
        const ext = format === 'webp' ? 'webp' : 'jpg';
        return `${nameWithoutExt}_optimized.${ext}`;
    }

    /**
     * Format bytes to human-readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Compress multiple images
     */
    async compressMultiple(files, options = {}) {
        const results = [];

        for (const file of files) {
            const result = await this.compress(file, options);
            results.push(result);
        }

        return results;
    }

    /**
     * Create thumbnail
     */
    async createThumbnail(file, maxWidth = 300) {
        return this.compress(file, {
            maxWidth,
            maxHeight: maxWidth,
            quality: 0.7,
            format: 'webp'
        });
    }
}

// Create singleton instance
const imageCompressor = new ImageCompressor();

export default imageCompressor;

/**
 * React Hook for image compression
 */
export const useImageCompression = () => {
    const [isCompressing, setIsCompressing] = useState(false);
    const [compressionResult, setCompressionResult] = useState(null);

    const compressImage = async (file, options = {}) => {
        setIsCompressing(true);
        setCompressionResult(null);

        try {
            const result = await imageCompressor.compress(file, options);
            setCompressionResult(result);
            return result;
        } catch (err) {
            console.error('Compression error:', err);
            return {
                file,
                originalSize: file.size,
                compressedSize: file.size,
                savings: 0,
                wasCompressed: false,
                error: err.message
            };
        } finally {
            setIsCompressing(false);
        }
    };

    return {
        compressImage,
        isCompressing,
        compressionResult
    };
};
