/**
 * Converts 24h time string (HH:mm) to 12h format with AM/PM
 */
const formatTime12h = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Checks if a category is currently available based on its dynamic timing data.
 */
export const checkAvailability = (category) => {
    if (!category) return { isAvailable: true, badgeText: '🟢 Open now' };

    // 1. Manual Closure Check (Override)
    if (category.isManuallyClosed) {
        return {
            isAvailable: false,
            badgeText: '🔴 Temporarily closed',
            status: 'Manually Closed',
            reason: 'manual'
        };
    }

    // 2. Timings Check
    const timings = category.timings || [];
    if (timings.length === 0) {
        // If no timings specified, category is always open by default
        return {
            isAvailable: true,
            badgeText: '🟢 Open now',
            status: 'Open Now'
        };
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let isAvailable = false;
    let nextStartTime = null;

    for (const slot of timings) {
        if (!slot.startTime || !slot.endTime) continue;

        const [startH, startM] = slot.startTime.split(':').map(Number);
        const [endH, endM] = slot.endTime.split(':').map(Number);
        const startMin = startH * 60 + startM;
        const endMin = endH * 60 + endM;

        // Handle midnight crossing (if end < start, it crosses midnight)
        const crossesMidnight = endMin < startMin;
        const isCurrentlyInSlot = crossesMidnight
            ? (currentMinutes >= startMin || currentMinutes <= endMin)
            : (currentMinutes >= startMin && currentMinutes <= endMin);

        if (isCurrentlyInSlot) {
            isAvailable = true;
            break;
        }

        // Find the next available slot today
        if (startMin > currentMinutes && (nextStartTime === null || startMin < nextStartTime.min)) {
            nextStartTime = { text: slot.startTime, min: startMin };
        }
    }

    // If no next time today, look for the earliest slot overall (presumably for tomorrow)
    if (!isAvailable && nextStartTime === null && timings.length > 0) {
        let earliestSlot = timings[0];
        for (const slot of timings) {
            if (!slot.startTime) continue;
            const [h, m] = slot.startTime.split(':').map(Number);
            const [eh, em] = earliestSlot.startTime.split(':').map(Number);
            if (h * 60 + m < eh * 60 + em) {
                earliestSlot = slot;
            }
        }
        nextStartTime = { text: earliestSlot.startTime, min: -1 };
    }

    const nextTimeStr = nextStartTime ? nextStartTime.text : null;
    const nextTime12h = nextTimeStr ? formatTime12h(nextTimeStr) : null;
    const badgeText = isAvailable
        ? '🟢 Open now'
        : `🔴 Opens at ${nextTime12h || 'Coming Soon'}`;

    return {
        isAvailable,
        nextTime: nextTimeStr, // store 24h format for easier comparison
        badgeText,
        status: isAvailable ? 'Open Now' : 'Closed',
        reason: isAvailable ? 'none' : 'time'
    };
};

/**
 * Checks if the entire restaurant is "open" based on its categories.
 */
export const isRestaurantOpen = (restaurantData) => {
    if (!restaurantData || !restaurantData.categories || restaurantData.categories.length === 0) {
        return { isOpen: true, badgeText: "🟢 Open now" };
    }

    const categoryStatuses = restaurantData.categories.map(cat => checkAvailability(cat));
    const anyOpen = categoryStatuses.some(status => status.isAvailable);

    if (anyOpen) {
        return { isOpen: true, badgeText: "🟢 Open now" };
    }

    // Find earliest next opening time
    let earliestNext = null;
    let earliestMin = Infinity;

    categoryStatuses.forEach(status => {
        if (status.nextTime) {
            const [h, m] = status.nextTime.split(':').map(Number);
            const min = h * 60 + m;
            if (min < earliestMin) {
                earliestMin = min;
                earliestNext = status.nextTime;
            }
        }
    });

    if (earliestNext) {
        return { isOpen: false, badgeText: `🔴 Opens at ${formatTime12h(earliestNext)}` };
    }

    return { isOpen: false, badgeText: "🔴 Closed" };
};

export const getAvailabilityMessage = (isAvailable, nextTime) => {
    if (isAvailable) return null;
    if (!nextTime) return '🔴 Temporarily closed';
    return `🔴 Opens at ${formatTime12h(nextTime)}`;
};
