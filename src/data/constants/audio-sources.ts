export type AudioSource = "SPOTIFY" | "AUDIUS" | "MICROPHONE" | "RADIO_PARADISE" | "KEXP" | "FILE";

const SPOTIFY: AudioSource = "SPOTIFY";
const AUDIUS: AudioSource = "AUDIUS";
const MICROPHONE: AudioSource = "MICROPHONE";
const RADIO_PARADISE: AudioSource = "RADIO_PARADISE";
const KEXP: AudioSource = "KEXP";
const FILE: AudioSource = "FILE";

export const AUDIO_SOURCE_ICONS: Record<AudioSource, string> = {
  SPOTIFY: "spotify",
  AUDIUS: "audius",
  MICROPHONE: "microphone",
  RADIO_PARADISE: "radio-paradise",
  KEXP: "kexp",
  FILE: "upload",
};

export const AUDIO_SOURCES = [SPOTIFY, AUDIUS, MICROPHONE, RADIO_PARADISE, KEXP, FILE];
