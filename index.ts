const waveFormatTagsByBitDepth = {
  16: 0x0001, //WAVE_FORMAT_PCM
  24: 0xfeff, //WAVE_FORMAT_EXTENSIBLE - allows more than 2 channels & more than 16 bits per sample and GUID loudspeaker position masks
  32: 0x0003, //WAVE_FORMAT_IEEE_FLOAT
};

interface IWavEncodeOptions {
  bitDepth: keyof typeof waveFormatTagsByBitDepth; //opt to be more precise
}

const defaultOptions: IWavEncodeOptions = {
  bitDepth: 16,
};

export default function wavifyBuffer(
  buffer: AudioBuffer,
  options: IWavEncodeOptions = defaultOptions,
) {
  const samples = interleaveChannelData(buffer);

  return encodeWAV(
    samples,
    buffer.sampleRate,
    buffer.numberOfChannels,
    options.bitDepth,
  );
}

function getWaveFormatTagByBitDepth(
  bitDepth: keyof typeof waveFormatTagsByBitDepth,
) {
  return waveFormatTagsByBitDepth[bitDepth];
}

function encodeWAV(
  samples: Float32Array,
  sampleRate: number,
  numberOfChannels: number,
  bitDepth: keyof typeof waveFormatTagsByBitDepth,
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
  view.setUint16(20, getWaveFormatTagByBitDepth(bitDepth), true);
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
    case 24:
      writeFloat32To24BitPCM(view, 44, samples);
    case 32:
      writeFloat32(view, 44, samples);
  }

  return buffer;
}

function interleaveChannelData(audioBuffer: AudioBuffer) {
  if (audioBuffer.length < 2) {
    return audioBuffer.getChannelData(0);
  }

  const channelLength = audioBuffer.getChannelData(0).length;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const result = new Float32Array(channelLength * numberOfChannels);

  for (let frame = 0; frame < channelLength; frame++) {
    for (
      let channelIndex = 0;
      channelIndex < numberOfChannels;
      channelIndex++
    ) {
      result[frame * numberOfChannels + channelIndex] =
        audioBuffer.getChannelData(channelIndex)[frame];
    }
  }

  return result;
}

function setInt24(view: DataView) {
  return function (offset: number, value: number, littleEndian: boolean) {
    if (littleEndian) {
      view.setUint8(offset, value & 0xff);
      view.setUint8(offset + 1, (value >> 8) & 0xff);
      view.setUint8(offset + 2, (value >> 16) & 0xff);
    } else {
      view.setUint8(offset, (value >> 16) & 0xff);
      view.setUint8(offset + 1, (value >> 8) & 0xff);
      view.setUint8(offset + 2, value & 0xff);
    }
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
  const writeToView = setInt24(output);

  for (let index = 0; index < input.length; index++, offset += 3) {
    let s = Math.max(-1, Math.min(1, input[index]));
    writeToView(offset, s < 0 ? s * 8388608 : s * 8388607, true);
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
