let audioContext = null;
let unlocked = false;

export async function unlockAudio() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (audioContext.state === "suspended") {
    try {
      await audioContext.resume();
    } catch {
      return false;
    }
  }

  unlocked = audioContext.state === "running";
  return unlocked;
}

export async function tryAutoplayAudio() {
  const ready = await unlockAudio();

  if (ready) {
    playHitSound(0.25);
  }

  return ready;
}

export function playHitSound(intensity = 1) {
  if (!audioContext || !unlocked || audioContext.state !== "running") {
    return;
  }

  const now = audioContext.currentTime;
  const duration = 0.055;
  const gain = audioContext.createGain();
  const osc = audioContext.createOscillator();
  const noise = createNoise(duration);
  const noiseGain = audioContext.createGain();

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08 * intensity, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noiseGain.gain.setValueAtTime(0.035 * intensity, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.type = "square";
  osc.frequency.setValueAtTime(720 + Math.random() * 80, now);
  osc.frequency.exponentialRampToValueAtTime(260, now + duration);

  osc.connect(gain);
  noise.connect(noiseGain);
  gain.connect(audioContext.destination);
  noiseGain.connect(audioContext.destination);

  osc.start(now);
  noise.start(now);
  osc.stop(now + duration);
  noise.stop(now + duration);
}

function createNoise(duration) {
  const sampleRate = audioContext.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * duration));
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  return source;
}
