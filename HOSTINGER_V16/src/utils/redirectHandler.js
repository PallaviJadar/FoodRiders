import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

/**
 * Hookifying the redirect handler to use Contexts (like Toast, Auth, etc.)
 */
export const useRedirect = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();

    /**
     * Single Source of Truth for Redirection Logic
     * @param {string} redirectType 
     * @param {string} redirectTarget 
     * @param {string} parentId 
     */
    const handleRedirect = (redirectType, redirectTarget, parentId = null) => {
        if (!redirectType || !redirectTarget) {
            console.warn('Missing redirect info', { redirectType, redirectTarget });
            addToast('Items unavailable or link broken.', 'error');
            return;
        }

        const type = redirectType.toLowerCase();

        try {
            switch (type) {
                case 'restaurant':
                    navigate(`/restaurant/${redirectTarget}`);
                    break;

                case 'category':
                    const slug = encodeURIComponent(redirectTarget);
                    navigate(`/category/${slug}`);
                    break;

                case 'menu_item':
                    if (parentId) {
                        navigate(`/restaurant/${parentId}?highlight=${encodeURIComponent(redirectTarget)}`);
                    } else {
                        navigate(`/show-case?search=${encodeURIComponent(redirectTarget)}`);
                    }
                    break;

                case 'offer':
                    // If offer page doesn't exist, search for it or items related to it
                    navigate(`/show-case?search=${encodeURIComponent(redirectTarget)}`);
                    break;

                case 'external':
                    // Smart detection: if contains '.' and doesn't start with '/', assume external
                    const isExternalUrl = redirectTarget.startsWith('http') || (redirectTarget.includes('.') && !redirectTarget.startsWith('/'));

                    if (isExternalUrl) {
                        const url = redirectTarget.startsWith('http') ? redirectTarget : `https://${redirectTarget}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                    } else {
                        // Internal navigate
                        const path = redirectTarget.startsWith('/') ? redirectTarget : `/${redirectTarget}`;
                        navigate(path);
                    }
                    break;

                default:
                    console.warn('Unknown redirect type:', type);
                    navigate(`/show-case?search=${encodeURIComponent(redirectTarget)}`);
            }
        } catch (err) {
            console.error("Redirect Error:", err);
            addToast('Failed to navigate.', 'error');
        }
    };

    const normalizeRedirectItem = (item) => {
        return {
            redirectType: item.type || item.redirectType || item.linkType || 'search',
            redirectTarget: item.slug || item.redirectTarget || item.linkTarget || item.title || item.name || item.id || item._id,
            parentId: item.parentId
        };
    };

    return { handleRedirect, normalizeRedirectItem };
};
