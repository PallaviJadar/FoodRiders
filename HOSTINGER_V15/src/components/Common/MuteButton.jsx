import React from 'react';
import css from './MuteButton.module.css';

const MuteButton = ({ onMute, isMuted, label = "Mute Siren" }) => {
    return (
        <button
            className={`${css.muteBtn} ${isMuted ? css.muted : ''}`}
            onClick={onMute}
            title={isMuted ? "Siren is muted" : "Click to mute siren"}
        >
            {isMuted ? '🔕' : '🔔'} {label}
        </button>
    );
};

export default MuteButton;
