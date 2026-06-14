export const getInterleavedChannelDataByAudioBuffer = (
  audioBuffer: AudioBuffer,
) => {
  if (
    !audioBuffer ||
    (!!audioBuffer.numberOfChannels && audioBuffer.numberOfChannels == 0)
  ) {
    throw new Error(
      "Please provide an AudioBuffer object with at least 1 channel.",
    );
  }

  const channels: Float32Array<ArrayBuffer>[] = [];

  for (
    let channelIndex = 0;
    channelIndex < audioBuffer.numberOfChannels;
    channelIndex++
  ) {
    channels.push(audioBuffer.getChannelData(channelIndex));
  }

  return interleaveChannelData(...channels);
};

function interleaveChannelData(...channels: Float32Array[]) {
  if (channels.length < 2) {
    return channels[0];
  }

  const numberOfChannels = channels.length;
  const channelLength = channels[0].length;

  const result = new Float32Array(channelLength * numberOfChannels);

  for (let frame = 0; frame < channelLength; frame++) {
    for (
      let channelIndex = 0;
      channelIndex < numberOfChannels;
      channelIndex++
    ) {
      result[frame * numberOfChannels + channelIndex] =
        channels[channelIndex][frame];
    }
  }

  return result;
}
