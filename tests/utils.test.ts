import { getInterleavedChannelDataByAudioBuffer } from "../src/utils";
import { AudioContext } from "node-web-audio-api";
import { createSineWave } from "./test-utils";

describe("getInterleavedChannelDataByAudioBuffer", () => {
  it("should throw a TypeError if the audioBuffer is provided", () => {
    const interleave = () => {
      return getInterleavedChannelDataByAudioBuffer(
        undefined as unknown as AudioBuffer,
      );
    };

    expect(interleave).toThrow(
      "Please provide an AudioBuffer object with at least 1 channel.",
    );
  });

  it("should return the first channel's data if the AudioBuffer has a single channel", () => {
    const audioContext = new AudioContext();
    const monoSine = Float32Array.from(createSineWave(12));
    const audioBuffer = audioContext.createBuffer(1, monoSine.length, 44100);

    audioBuffer.copyToChannel(monoSine, 0);
    const interleavedChannelData =
      getInterleavedChannelDataByAudioBuffer(audioBuffer);
    audioContext.close();

    expect(interleavedChannelData).toEqual(audioBuffer.getChannelData(0));
  });

  it("should interleave the channels' data if 2 or more channels are provided", () => {
    const audioContext = new AudioContext();
    const monoSine = Float32Array.from(createSineWave(12));
    const audioBuffer = audioContext.createBuffer(2, monoSine.length, 44100);

    audioBuffer.copyToChannel(monoSine, 0);
    audioBuffer.copyToChannel(monoSine, 1);
    const interleavedChannelData =
      getInterleavedChannelDataByAudioBuffer(audioBuffer);
    audioContext.close();

    expect(interleavedChannelData.length % monoSine.length).toBe(0);
  });
});
