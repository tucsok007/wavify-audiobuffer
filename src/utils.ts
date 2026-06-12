export const getInterleavedChannelDataByAudioBuffer = (
  audioBuffer: AudioBuffer,
) => {
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

  console.log(
    `Channel length: ${channelLength}, Number of channels: ${numberOfChannels}`,
  );

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
