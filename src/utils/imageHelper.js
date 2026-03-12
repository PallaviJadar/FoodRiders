import { imageManifest } from './imageManifest';

const BASE_PATH = '/images/restaurants/';
const GLOBAL_DEFAULT = BASE_PATH + 'default.jpg';

/**
 * Normalizes a string for strict matching in the manifest.
 * Removes all spaces, hyphens and dots.
 */
const normalizeStrict = (str) => {
    if (!str) return '';
    // Standard normalization: lowercase, trim, and remove all non-alphanumeric characters
    return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};

export const getFoodImage = (itemName, categoryName, restaurantName) => {
    const res = normalizeStrict(restaurantName);
    const cat = normalizeStrict(categoryName);
    const item = normalizeStrict(itemName);

    const key = `${res}|${cat}|${item}`;
    const manifestPath = imageManifest[key];

    if (manifestPath) {
        return manifestPath;
    }

    // Fallback to the old logic if not found in manifest (though manifest should cover it)
    return `${BASE_PATH}${res}/${cat}/${item}.jpg`;
};

export const getFoodImageFallback = (categoryName, restaurantName) => {
    const res = normalizeStrict(restaurantName);
    const cat = normalizeStrict(categoryName);

    // Try to find a default image in the category folder from manifest
    // Or just construct the standard path
    return {
        categoryDefault: `${BASE_PATH}${res}/${cat}/default.jpg`,
        globalDefault: GLOBAL_DEFAULT
    };
};
