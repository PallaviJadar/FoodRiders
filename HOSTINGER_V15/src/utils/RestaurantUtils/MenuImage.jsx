import React, { useState, useEffect } from 'react';

const MenuImage = ({ itemName, categoryName, restaurantName, className, style, alt, src }) => {
    // 1. Resolve Primary Source - Only use if src actually exists
    const resolvedSrc = src
        ? (src.startsWith('http') || src.startsWith('data:') || src.startsWith('/images/')
            ? src
            : `/uploads/${src}`)
        : null;

    const [imgSrc, setImgSrc] = useState(resolvedSrc);

    // Sync state if props change
    useEffect(() => {
        setImgSrc(resolvedSrc);
    }, [src, itemName, categoryName]);

    const handleError = () => {
        console.log(`[MenuImage] ⚠️ Image not found: ${imgSrc}`);
        setImgSrc(null); // Show nothing if the image is truly missing
    };

    if (!imgSrc) {
        return <div className={className} style={{ ...style, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '0.8rem' }}>No Image</div>;
    }

    return (
        <img
            src={imgSrc}
            className={className}
            style={{
                ...style,
                display: 'block'
            }}
            alt={alt || itemName}
            onError={handleError}
            loading="lazy"
        />
    );
};

export default MenuImage;
