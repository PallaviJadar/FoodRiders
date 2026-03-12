const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Backend Image Compression Middleware
 * Second safety layer for all image uploads
 * Generates optimized and thumbnail versions
 */

class ImageProcessor {
    constructor() {
        this.uploadsDir = path.join(__dirname, '../uploads');
        this.originalDir = path.join(this.uploadsDir, 'original');
        this.optimizedDir = path.join(this.uploadsDir, 'optimized');
        this.thumbDir = path.join(this.uploadsDir, 'thumb');

        // Ensure directories exist
        this.ensureDirectories();
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(this.uploadsDir, { recursive: true });
            await fs.mkdir(this.originalDir, { recursive: true });
            await fs.mkdir(this.optimizedDir, { recursive: true });
            await fs.mkdir(this.thumbDir, { recursive: true });
        } catch (err) {
            console.error('Failed to create upload directories:', err);
        }
    }

    /**
     * Process uploaded image
     * @param {string} filePath - Path to uploaded file
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} - Paths to processed images
     */
    async processImage(filePath, options = {}) {
        try {
            const {
                isQR = false,
                maxWidth = 1280,
                quality = 75,
                generateThumbnail = true
            } = options;

            const filename = path.basename(filePath);
            const nameWithoutExt = path.parse(filename).name;

            // Validate image
            const metadata = await sharp(filePath).metadata();

            if (!metadata || !metadata.format) {
                throw new Error('Invalid image file');
            }

            console.log(`Processing image: ${filename} (${metadata.width}x${metadata.height})`);

            // Determine settings based on image type
            const settings = isQR ? {
                maxWidth: 800,
                quality: 90,
                minWidth: 600
            } : {
                maxWidth,
                quality
            };

            // Generate optimized image
            const optimizedPath = await this.createOptimized(
                filePath,
                nameWithoutExt,
                metadata,
                settings
            );

            // Generate thumbnail
            let thumbnailPath = null;
            if (generateThumbnail) {
                thumbnailPath = await this.createThumbnail(filePath, nameWithoutExt);
            }

            // Move original to original directory
            const originalPath = path.join(this.originalDir, filename);
            await fs.rename(filePath, originalPath);

            return {
                original: `/uploads/original/${filename}`,
                optimized: `/uploads/optimized/${path.basename(optimizedPath)}`,
                thumbnail: thumbnailPath ? `/uploads/thumb/${path.basename(thumbnailPath)}` : null,
                metadata: {
                    width: metadata.width,
                    height: metadata.height,
                    format: metadata.format,
                    size: metadata.size
                }
            };
        } catch (err) {
            console.error('Image processing error:', err);
            throw err;
        }
    }

    /**
     * Create optimized version
     */
    async createOptimized(filePath, nameWithoutExt, metadata, settings) {
        const outputPath = path.join(this.optimizedDir, `${nameWithoutExt}_optimized.webp`);

        let pipeline = sharp(filePath);

        // Calculate resize dimensions
        if (metadata.width > settings.maxWidth || metadata.height > settings.maxWidth) {
            // Don't resize QR codes below minimum
            if (settings.minWidth && metadata.width < settings.minWidth) {
                // Keep original size
            } else {
                pipeline = pipeline.resize(settings.maxWidth, settings.maxWidth, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
            }
        }

        // Convert to WebP with quality settings
        await pipeline
            .webp({ quality: settings.quality })
            .toFile(outputPath);

        // Check file size, if too large, try JPEG
        const stats = await fs.stat(outputPath);
        const maxSize = settings.isQR ? 150 * 1024 : 300 * 1024;

        if (stats.size > maxSize) {
            console.log('WebP too large, trying JPEG...');
            const jpegPath = path.join(this.optimizedDir, `${nameWithoutExt}_optimized.jpg`);

            await sharp(filePath)
                .resize(settings.maxWidth, settings.maxWidth, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: settings.quality })
                .toFile(jpegPath);

            // Use whichever is smaller
            const jpegStats = await fs.stat(jpegPath);
            if (jpegStats.size < stats.size) {
                await fs.unlink(outputPath);
                return jpegPath;
            } else {
                await fs.unlink(jpegPath);
            }
        }

        return outputPath;
    }

    /**
     * Create thumbnail
     */
    async createThumbnail(filePath, nameWithoutExt) {
        const outputPath = path.join(this.thumbDir, `${nameWithoutExt}_thumb.webp`);

        await sharp(filePath)
            .resize(300, 300, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 70 })
            .toFile(outputPath);

        return outputPath;
    }

    /**
     * Validate image file
     */
    async validateImage(filePath) {
        try {
            const metadata = await sharp(filePath).metadata();

            // Check if valid image
            if (!metadata || !metadata.format) {
                return { valid: false, error: 'Invalid image file' };
            }

            // Check file size (max 10MB)
            const stats = await fs.stat(filePath);
            if (stats.size > 10 * 1024 * 1024) {
                return { valid: false, error: 'Image too large (max 10MB)' };
            }

            // Check dimensions (max 4000x4000)
            if (metadata.width > 4000 || metadata.height > 4000) {
                return { valid: false, error: 'Image dimensions too large (max 4000x4000)' };
            }

            return { valid: true, metadata };
        } catch (err) {
            return { valid: false, error: err.message };
        }
    }

    /**
     * Delete image and all its versions
     */
    async deleteImage(filename) {
        try {
            const nameWithoutExt = path.parse(filename).name;

            // Delete from all directories
            const dirs = [this.originalDir, this.optimizedDir, this.thumbDir];

            for (const dir of dirs) {
                const files = await fs.readdir(dir);
                const matchingFiles = files.filter(f => f.startsWith(nameWithoutExt));

                for (const file of matchingFiles) {
                    await fs.unlink(path.join(dir, file)).catch(() => { });
                }
            }

            console.log(`Deleted image: ${filename}`);
        } catch (err) {
            console.error('Delete image error:', err);
        }
    }
}

// Create singleton instance
const imageProcessor = new ImageProcessor();

/**
 * Express middleware for image processing
 */
const processUploadedImage = (options = {}) => {
    return async (req, res, next) => {
        try {
            // Check if file was uploaded
            if (!req.file) {
                return next();
            }

            // Process the image
            const result = await imageProcessor.processImage(req.file.path, {
                isQR: options.isQR || req.body.isQR === 'true',
                maxWidth: options.maxWidth || 1280,
                quality: options.quality || 75,
                generateThumbnail: options.generateThumbnail !== false
            });

            // Attach result to request
            req.processedImage = result;

            // Update req.file to point to optimized version
            req.file.path = result.optimized;
            req.file.filename = path.basename(result.optimized);

            next();
        } catch (err) {
            console.error('Image processing middleware error:', err);

            // Don't fail the upload, just log and continue
            console.warn('Continuing with original image due to processing error');
            next();
        }
    };
};

module.exports = {
    imageProcessor,
    processUploadedImage
};
