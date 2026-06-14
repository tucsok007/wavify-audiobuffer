import { AudioContext } from "node-web-audio-api";
import { createReadStream, createWriteStream, ReadStream } from "node:fs";
import { arrayBuffer } from "node:stream/consumers";
import { pipeline } from "node:stream/promises";
import wavifyBuffer from "../index.ts";

const audioContext = new AudioContext();

const getAudioBufferFromFileStream = async (fileStream: ReadStream) => {
  return await audioContext.decodeAudioData(await arrayBuffer(fileStream));
};

const audioBuffer = await getAudioBufferFromFileStream(
  createReadStream(__dirname + "/bluejean_short.mp3"),
);

const waveData = new Uint8Array(wavifyBuffer(audioBuffer, { bitDepth: 24 }));
const blob = new Blob([waveData], { type: "audio/wav" });

pipeline(blob.stream(), createWriteStream(`./out.wav`));
audioContext.close();
