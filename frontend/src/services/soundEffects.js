/**
 * Sound and Vibration Effects Service for Fixvo Real-time Notifications.
 * Handles premium sound alerts, vibration patterns, and fallback synthesizers.
 */

// Fallback synthetic beep using Web Audio API when sound files are blocked or missing
const playSyntheticBeep = (priority = 'low') => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (priority === 'high') {
      // High priority alert: dual high-pitch beep alarm
      osc.type = 'sawtooth';
      
      // Dual-chirp effect
      osc.frequency.setValueAtTime(880, now); // A5
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.frequency.setValueAtTime(1100, now + 0.4); // C#6
      gain.gain.setValueAtTime(0.3, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.start(now);
      osc.stop(now + 0.9);
    } else {
      // Low priority alert: single clean chime with quick decay
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now); // F6
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (err) {
    console.warn('AudioContext fallback failed:', err);
  }
};

/**
 * Triggers mobile device vibration based on priority.
 * @param {string} priority - 'high' (uber/dispatch alarm) or 'low' (subtle notification)
 */
export const vibrateDevice = (priority = 'low') => {
  if ('vibrate' in navigator) {
    try {
      if (priority === 'high') {
        // Premium Uber-style strong repeating vibration pattern
        navigator.vibrate([500, 250, 500, 250, 500, 250, 500, 250, 1000]);
      } else {
        // Subtle feedback vibration
        navigator.vibrate([100, 50, 100]);
      }
    } catch (err) {
      console.warn('Vibration API blocked or not supported on this device', err);
    }
  }
};

/**
 * Plays a premium notification sound and vibrates the device.
 * Falls back to an oscillator-based audio synthesizer if browser policies block audio files.
 * @param {string} priority - 'high' or 'low'
 */
export const playNotificationSound = (priority = 'low') => {
  // Always trigger vibration for physical feedback
  vibrateDevice(priority);

  try {
    const filename = priority === 'high' ? 'booking_request.wav' : 'subtle_notification.wav';
    const audioPath = `/sounds/${filename}`;
    
    const audio = new Audio(audioPath);
    audio.volume = priority === 'high' ? 0.95 : 0.65;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn(`Autoplay blocked WAV playback for priority: ${priority}. Using synth fallback.`, err.message);
        playSyntheticBeep(priority);
      });
    }
  } catch (err) {
    console.warn(`Failed loading audio file. Using synth fallback.`, err);
    playSyntheticBeep(priority);
  }
};

let activeAudio = null;
let activeVibeInterval = null;

/**
 * Starts a looping dispatch ringtone and repeating vibration alert.
 */
export const startDispatchRingtone = () => {
  stopDispatchRingtone();

  try {
    const audioPath = '/sounds/booking_request.wav';
    activeAudio = new Audio(audioPath);
    activeAudio.volume = 0.95;
    activeAudio.loop = true;

    const playPromise = activeAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Looping dispatch audio autoplay blocked. Using synthetic alarm.', err.message);
        let beepCount = 0;
        activeVibeInterval = setInterval(() => {
          playSyntheticBeep('high');
          vibrateDevice('high');
          beepCount++;
          if (beepCount > 10) stopDispatchRingtone();
        }, 2000);
      });
    }
  } catch (err) {
    console.warn('Failed to start looping audio file:', err);
    playSyntheticBeep('high');
  }

  if (!activeVibeInterval) {
    vibrateDevice('high');
    activeVibeInterval = setInterval(() => {
      vibrateDevice('high');
    }, 3000);
  }
};

/**
 * Stops the looping dispatch ringtone and active vibration loops.
 */
export const stopDispatchRingtone = () => {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch (err) {
      console.warn('Error pausing active audio:', err);
    }
    activeAudio = null;
  }
  
  if (activeVibeInterval) {
    clearInterval(activeVibeInterval);
    activeVibeInterval = null;
  }

  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(0);
    } catch (err) {}
  }
};
