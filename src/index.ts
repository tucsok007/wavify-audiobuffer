import { getInterleavedChannelDataByAudioBuffer } from "./utils";

enum WaveFormat {
  WAVE_FORMAT_PCM = 0x0001,
  WAVE_FORMAT_EXTENSIBLE = 0xfeff,
  WAVE_FORMAT_IEEE_FLOAT = 0x0003,
}

const waveFormatTagsByBitDepth = {
  16: WaveFormat.WAVE_FORMAT_PCM,
  24: WaveFormat.WAVE_FORMAT_PCM,
  32: WaveFormat.WAVE_FORMAT_IEEE_FLOAT,
};

interface IWavEncodeOptions {
  bitDepth: keyof typeof waveFormatTagsByBitDepth;
  forceWaveFormatExtensible?: boolean;
}

const defaultOptions: IWavEncodeOptions = {
  bitDepth: 16,
  forceWaveFormatExtensible: false,
};

export default function wavifyBuffer(
  audioBuffer: AudioBuffer,
  options: IWavEncodeOptions = defaultOptions,
) {
  if (!audioBuffer) {
    throw new Error("Please provide an AudioBuffer object.");
  }

  const samples = getInterleavedChannelDataByAudioBuffer(audioBuffer);

  return encodeWave(
    samples,
    audioBuffer.sampleRate,
    audioBuffer.numberOfChannels,
    options.bitDepth,
    options.forceWaveFormatExtensible,
  );
}

function getWaveFormatTagByBitDepth(
  bitDepth: keyof typeof waveFormatTagsByBitDepth,
) {
  return waveFormatTagsByBitDepth[bitDepth];
}

function encodeWave(
  samples: Float32Array,
  sampleRate: number,
  numberOfChannels: number,
  bitDepth: keyof typeof waveFormatTagsByBitDepth,
  forceWaveFormatExtensible: boolean = false,
) {
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeStringAsUint8Chunks(view, 0, "RIFF");
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  /* RIFF type */
  writeStringAsUint8Chunks(view, 8, "WAVE");
  /* format chunk identifier */
  writeStringAsUint8Chunks(view, 12, "fmt ");
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  const waveFormatTag = forceWaveFormatExtensible
    ? WaveFormat.WAVE_FORMAT_EXTENSIBLE
    : getWaveFormatTagByBitDepth(bitDepth);
  view.setUint16(20, waveFormatTag, true);
  /* channel count */
  view.setUint16(22, numberOfChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeStringAsUint8Chunks(view, 36, "data");
  /* data chunk length */
  view.setUint32(40, samples.length * bytesPerSample, true);

  switch (bitDepth) {
    case 16:
      writeFloat32To16BitPCM(view, 44, samples);
      break;
    case 24:
      writeFloat32To24BitPCM(view, 44, samples);
      break;
    case 32:
      writeFloat32(view, 44, samples);
      break;
  }

  return buffer;
}

function setUint24LittleEndian(view: DataView) {
  return function (offset: number, value: number) {
    view.setUint8(offset, value & ~0xffffff00);
    view.setUint16(offset + 1, value >> 8, true);
  };
}

function writeFloat32(output: DataView, offset: number, input: Float32Array) {
  for (let index = 0; index < input.length; index++, offset += 4) {
    output.setFloat32(offset, input[index], true);
  }
}

function writeFloat32To24BitPCM(
  output: DataView,
  offset: number,
  input: Float32Array,
) {
  const writeToView = setUint24LittleEndian(output);

  for (let index = 0; index < input.length; index++, offset += 3) {
    let s = Math.max(-1, Math.min(1, input[index]));
    writeToView(offset, s < 0 ? s * 0x800000 : s * 0x7fffff);
  }
}

function writeFloat32To16BitPCM(
  output: DataView,
  offset: number,
  input: Float32Array,
) {
  for (let index = 0; index < input.length; index++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[index]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

function writeStringAsUint8Chunks(
  view: DataView,
  offset: number,
  value: string,
) {
  for (let index = 0; index < value.length; index++) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
