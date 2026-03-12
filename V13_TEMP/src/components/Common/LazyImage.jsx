/**
 * Lazy Loading Image Component
 * Automatically lazy loads images with placeholder
 * Supports thumbnails and progressive loading
 */
import React, { useState, useEffect, useRef } from 'react';

const LazyImage = ({
    src,
    thumbnail = null,
    alt = '',
    className = '',
    style = {},
    onLoad = null,
    onError = null,
    placeholder = '/placeholder.png'
}) => {
    const [imageSrc, setImageSrc] = useState(thumbnail || placeholder);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        // Use Intersection Observer for lazy loading
        if (!imgRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // Load full image when visible
                        const img = new Image();
                        img.src = src;

                        img.onload = () => {
                            setImageSrc(src);
                            setImageLoaded(true);
                            if (onLoad) onLoad();
                        };

                        img.onerror = () => {
                            setImageError(true);
                            if (onError) onError();
                        };

                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading 50px before visible
                threshold: 0.01
            }
        );

        observer.observe(imgRef.current);

        return () => {
            if (imgRef.current) {
                observer.unobserve(imgRef.current);
            }
        };
    }, [src, onLoad, onError]);

    if (imageError) {
        return (
            <div
                className={className}
                style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f0f0f0',
                    color: '#999'
                }}
            >
                <span>Image not available</span>
            </div>
        );
    }

    return (
        <img
            ref={imgRef}
            src={imageSrc}
            alt={alt}
            className={className}
            style={{
                ...style,
                transition: 'opacity 0.3s ease',
                opacity: imageLoaded ? 1 : 0.7
            }}
            loading="lazy" // Native lazy loading as fallback
        />
    );
};

export default LazyImage;
