import { Audio } from 'expo-av';

let sound = null;

export const playSiren = async () => {
    try {
        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
            sound = null;
        }

        const { sound: newSound } = await Audio.Sound.createAsync(
            require('../../assets/sounds/siren.wav'),
            { shouldPlay: true, isLooping: true }
        );
        sound = newSound;
    } catch (error) {
        console.warn('Could not play siren:', error);
    }
};

export const stopSiren = async () => {
    try {
        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
            sound = null;
        }
    } catch (error) {
        console.warn('Could not stop siren:', error);
    }
};
