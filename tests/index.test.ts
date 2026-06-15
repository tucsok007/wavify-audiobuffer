import { AudioContext } from "node-web-audio-api";
import wavifyBuffer from "../src";
import * as Utils from "../src/utils";
import { createSineWave } from "./test-utils";

describe("wavifyBuffer", () => {
  it("should throw an error if the audio buffer object is not provided", () => {
    const wavify = () => wavifyBuffer(undefined as unknown as AudioBuffer);

    expect(wavify).toThrow("Please provide an AudioBuffer object.");
  });

  it("should interleave the audio data of the provided buffer", () => {
    const audioContext = new AudioContext();
    const audioBuffer = audioContext.createBuffer(1, 1, 44100);
    const interleave = jest.spyOn(
      Utils,
      "getInterleavedChannelDataByAudioBuffer",
    );

    wavifyBuffer(audioBuffer);
    audioContext.close();

    expect(interleave).toHaveBeenCalledWith(audioBuffer);
  });

  it.each([16, 24, 32])(
    "should write the correct RIFF header tags according to the AudioBuffer properties and the WAVE PCM soundfile format at %s-bit bit depth",
    (bitDepth) => {
      const audioContext = new AudioContext();
      const audioBuffer = audioContext.createBuffer(2, 1, 44100);
      const rawAudioFormat = bitDepth === 32 ? 0x0003 : 0x0001;

      const outputBuffer = wavifyBuffer(audioBuffer, {
        bitDepth: bitDepth as 16 | 24 | 32,
      });
      const dataView = new DataView(outputBuffer);
      audioContext.close();

      expect(
        "RIFF"
          .split("")
          .every(
            (char, index) => char.charCodeAt(0) === dataView.getUint8(index),
          ),
      ).toBe(true);
      expect(dataView.getUint32(4, true)).toBe(
        36 + (audioBuffer.length * audioBuffer.numberOfChannels * bitDepth) / 8,
      );
      expect(
        "WAVE"
          .split("")
          .every(
            (char, index) =>
              char.charCodeAt(0) === dataView.getUint8(index + 8),
          ),
      );
      expect(
        "fmt "
          .split("")
          .every(
            (char, index) =>
              char.charCodeAt(0) === dataView.getUint8(index + 12),
          ),
      );
      expect(dataView.getUint32(16, true)).toBe(16);
      expect(dataView.getUint16(20, true)).toBe(rawAudioFormat);
      expect(dataView.getUint16(22, true)).toBe(audioBuffer.numberOfChannels);
      expect(dataView.getUint32(24, true)).toBe(audioBuffer.sampleRate);
      expect(dataView.getUint32(28, true)).toBe(
        audioBuffer.sampleRate *
          (audioBuffer.numberOfChannels * (bitDepth / 8)),
      );
      expect(dataView.getUint16(32, true)).toBe(
        audioBuffer.numberOfChannels * (bitDepth / 8),
      );
      expect(dataView.getUint16(34, true)).toBe(bitDepth);
    },
  );

  it.each([16, 24, 32])(
    "should write the correct length of data for a sample audio input from an AudioBuffer at %s-bit bit depth",
    (bitDepth) => {
      const audioContext = new AudioContext();
      const leftSine = Float32Array.from(createSineWave(12));
      const rightSine = Float32Array.from(createSineWave(12, 90));
      const audioBuffer = audioContext.createBuffer(2, leftSine.length, 44100);
      audioBuffer.copyToChannel(leftSine, 0);
      audioBuffer.copyToChannel(rightSine, 1);

      const outputBuffer = wavifyBuffer(audioBuffer, {
        bitDepth: bitDepth as 16 | 24 | 32,
      });
      const dataView = new DataView(outputBuffer);
      audioContext.close();

      expect(
        "data"
          .split("")
          .every(
            (char, index) =>
              char.charCodeAt(0) === dataView.getUint8(index + 36),
          ),
      );
      expect(dataView.getUint32(40, true)).toBe(
        leftSine.length * audioBuffer.numberOfChannels * (bitDepth / 8),
      );
      expect(dataView.byteLength).toBe(
        leftSine.length * audioBuffer.numberOfChannels * (bitDepth / 8) + 44,
      );
    },
  );
});
