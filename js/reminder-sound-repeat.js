let repeatAudioContext = null;
let repeatUnlocked = false;

function reminderSoundEnabled() {
  try {
    const state = window.NineworksReminder?.getState?.();
    return state?.settings?.enabled === true && state?.settings?.soundEnabled !== false;
  } catch {
    return false;
  }
}

async function unlockRepeatAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return false;
  if (!repeatAudioContext) repeatAudioContext = new AudioContextClass();
  if (repeatAudioContext.state === "suspended") {
    try {
      await repeatAudioContext.resume();
    } catch {
      return false;
    }
  }
  repeatUnlocked = repeatAudioContext.state === "running";
  return repeatUnlocked;
}

function playSingleRepeat() {
  if (!repeatUnlocked || !repeatAudioContext || !reminderSoundEnabled()) return;

  const startAt = repeatAudioContext.currentTime;
  const gain = repeatAudioContext.createGain();
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.16, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.72);
  gain.connect(repeatAudioContext.destination);

  [659.25, 880].forEach((frequency, index) => {
    const oscillator = repeatAudioContext.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt + index * 0.18);
    oscillator.connect(gain);
    oscillator.start(startAt + index * 0.18);
    oscillator.stop(startAt + 0.62 + index * 0.08);
  });
}

function isNineworksNotification(title, options = {}) {
  const icon = String(options.icon || options.badge || "");
  return icon.includes("9workscrm.cloud") || String(title || "").includes("NINEWORKS CRM");
}

function scheduleTwoExtraRepeats() {
  window.setTimeout(playSingleRepeat, 900);
  window.setTimeout(playSingleRepeat, 1800);
}

function patchServiceWorkerNotifications() {
  const prototype = window.ServiceWorkerRegistration?.prototype;
  if (!prototype || prototype.showNotification?.__nineworksRepeatPatched) return;

  const original = prototype.showNotification;
  if (typeof original !== "function") return;

  function showNotificationWithRepeat(title, options) {
    const result = original.call(this, title, options);
    if (isNineworksNotification(title, options) && reminderSoundEnabled()) {
      unlockRepeatAudio().then((ready) => {
        if (ready) scheduleTwoExtraRepeats();
      });
    }
    return result;
  }

  showNotificationWithRepeat.__nineworksRepeatPatched = true;
  prototype.showNotification = showNotificationWithRepeat;
}

function initializeSoundRepeat() {
  patchServiceWorkerNotifications();
  document.addEventListener("pointerdown", unlockRepeatAudio, { passive: true });
  document.addEventListener("keydown", unlockRepeatAudio, { passive: true });
  window.setTimeout(patchServiceWorkerNotifications, 800);
}

initializeSoundRepeat();
