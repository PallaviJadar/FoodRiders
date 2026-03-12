import React, { useState, useEffect } from 'react';
import { checkAvailability } from './timeUtils';
import css from './CategoryHeader.module.css';

const CategoryHeader = ({
    category,
    isAdmin,
    onEdit,
    onDelete,
    onUpdateTiming,
    onToggleClosure,
    onUpdateDetails
}) => {
    const title = category?.name || "Category";
    // Check closure status - default to false if not present
    const isClosed = category?.isManuallyClosed === true;

    const { badgeText } = checkAvailability(category);

    const [editableTitle, setEditableTitle] = useState(title);
    const [notesInput, setNotesInput] = useState((category.suggestedNotes || []).join(', '));

    useEffect(() => {
        setEditableTitle(title);
    }, [title]);

    useEffect(() => {
        setNotesInput((category.suggestedNotes || []).join(', '));
    }, [category.suggestedNotes]);

    const handleBlur = (e) => {
        const value = e.target.innerText.trim();
        if (isAdmin && onEdit && value !== title) {
            onEdit(value);
        }
    };

    const handleToggle = () => {
        if (onToggleClosure) {
            // If it's closed, we want to open it (new status = false)
            // If it's open, we want to close it (new status = true)
            onToggleClosure(!isClosed);
        }
    };

    const addTimeSlot = () => {
        const newTimings = [...(category.timings || []), { startTime: "09:00", endTime: "22:00" }];
        onUpdateTiming(newTimings);
    };

    const removeTimeSlot = (index) => {
        const newTimings = category.timings.filter((_, i) => i !== index);
        onUpdateTiming(newTimings);
    };

    const updateTime = (index, field, value) => {
        const newTimings = (category.timings || []).map((t, i) =>
            i === index ? { ...t, [field]: value } : t
        );
        onUpdateTiming(newTimings);
    };

    return (
        <div className={`${css.wrapper} ${isAdmin ? css.adminWrapper : ''}`}>
            <div className={`${css.categoryHeader} ${isAdmin ? css.adminHeader : ''}`}>
                <div className={css.headerMain}>
                    <h2 className={`${css.title} ${isAdmin ? css.editable : ''}`}>
                        {isAdmin ? (
                            <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={handleBlur}
                                onInput={(e) => setEditableTitle(e.target.innerText)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.target.blur();
                                    }
                                }}
                            >
                                {editableTitle}
                            </span>
                        ) : title}
                        {isAdmin && <span className={css.editIcon}>✏️</span>}
                    </h2>
                    <span className={`${css.statusBadge} ${!isClosed && badgeText.includes('🟢') ? css.open : css.closed}`}>
                        {badgeText}
                    </span>
                </div>
                {isAdmin && (
                    <div className={css.adminHeaderActions}>
                        <div className={css.toggleWrapper} onClick={handleToggle} style={{ cursor: 'pointer' }}>
                            <span className={css.toggleLabel}>{isClosed ? "🚫 Forced Closed" : "✅ Auto Mode"}</span>
                            <label className={css.switch} onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={!isClosed}
                                    onChange={handleToggle}
                                />
                                <span className={css.slider}></span>
                            </label>
                        </div>
                        <button className={css.deleteBtn} onClick={() => onDelete()} title="Delete Category">🗑️</button>
                    </div>
                )}
            </div>

            {isAdmin && (
                <div className={css.timingEditor}>
                    <h4 className={css.timingTitle}>Category Timings</h4>
                    {(category.timings || []).map((slot, idx) => (
                        <div key={idx} className={css.timingRow}>
                            <input
                                type="time"
                                className={css.timeInput}
                                value={slot.startTime}
                                onChange={(e) => updateTime(idx, 'startTime', e.target.value)}
                            />
                            <span className={css.timeDash}>–</span>
                            <input
                                type="time"
                                className={css.timeInput}
                                value={slot.endTime}
                                onChange={(e) => updateTime(idx, 'endTime', e.target.value)}
                            />
                            <button className={css.removeSlotBtn} onClick={() => removeTimeSlot(idx)}>🗑️</button>
                        </div>
                    ))}
                    <button className={css.addSlotBtn} onClick={addTimeSlot}>➕ Add Time Slot</button>
                </div>
            )}

            {isAdmin && (
                <div className={css.notesEditor}>
                    <h4 className={css.timingTitle}>Suggested Order Notes</h4>
                    <p className={css.notesHelp}>Enter notes separated by commas. These will appear as selectable chips at checkout for this category.</p>
                    <input
                        type="text"
                        className={css.notesInput}
                        placeholder="e.g. Less spicy, Extra raita, No onion"
                        value={notesInput}
                        onChange={(e) => setNotesInput(e.target.value)}
                        onBlur={() => {
                            const notes = notesInput.split(',').map(s => s.trim()).filter(Boolean);
                            onUpdateDetails({ suggestedNotes: notes });
                        }}
                    />
                    <div className={css.notesPreview}>
                        {(category.suggestedNotes || []).map((note, i) => (
                            <span key={i} className={css.noteChip}>{note}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryHeader;
