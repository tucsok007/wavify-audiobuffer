import { AudioContext } from "node-web-audio-api";
import wavifyBuffer from "../src";
import * as Utils from "../src/utils";

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
});
