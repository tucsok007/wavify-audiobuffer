# wavify-audiobuffer

[![npm-tag](https://img.shields.io/badge/npm-1.0.0-green?logo=npm)](https://www.npmjs.com/package/wavify-audiobuffer) [![git-tag](https://img.shields.io/badge/github-repo-blue?logo=github)](https://github.com/tucsok007/wavify-audiobuffer)

Encodes the contents of an [AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer) from the WebAudio API as WAVE. Supports 16-bit PCM, 24bit PCM and 32-bit float data.

This project is a fork and extension/rewrite of the [audiobuffer-to-wav](https://www.npmjs.com/audiobuffer-to-wav) npm library.

The package is designed to work in both web, Node.js, and Embedded environments, considering that the web audio api is available or polyfilled.

## Installation:

```sh
npm i wavify-audiobuffer
```

## Usage:

#### `arrayBuffer = wavifyBuffer(audioBuffer, {...options})`

Encodes the [AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer) instance as WAV, returning a new array buffer. Interleaves multi-channel data, if necessary.

By default, the function exports with 16-bit PCM.

You can optionally specify 24 or 32-bit bit depth.

## Example(s):

```typescript
import { wavifyBuffer } from "wavify-audiobuffer";

fetch("https://www.example.audio/track.mp3")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Couldn't fetch the track data.");
    } else {
      return response.arrayBuffer();
    }
  })
  .then((arrayBuffer) => {
    audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
      const waveData = wavifyBuffer(audioBuffer, { bitDepth: 24 });
      //consume the waveData buffer
    });
  })
  .catch((error) => {
    //handle errors
  });
```

See [this example](./examples/example.ts) for an example of loading an MP3, decoding it, and re-encoding it as a WAV file (in Node.js).

## License:

This project is licensed under the terms of MIT, please see the [LICENSE.md](./LICENSE.md) file for details.
