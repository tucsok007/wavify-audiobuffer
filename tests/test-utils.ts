export const createSineWave = (cycles = 1, offset: 0 | 90 | 180 | 270 = 0) => {
  let output: number[] = [];

  for (let cycle = 0; cycle < cycles; cycle++) {
    switch (offset) {
      case 0:
        output.push(0);
        output.push(1);
        output.push(0);
        output.push(-1);
        break;
      case 90:
        output.push(1);
        output.push(0);
        output.push(-1);
        output.push(0);
        break;
      case 180:
        output.push(0);
        output.push(-1);
        output.push(0);
        output.push(1);
        break;
      case 270:
        output.push(-1);
        output.push(0);
        output.push(1);
        output.push(0);
        break;
    }
  }

  return output;
};

export const hasUint8StringAt = (
  dataView: DataView,
  offset: number,
  value: String,
): boolean => {
  return value
    .split("")
    .every(
      (char, index) => char.charCodeAt(0) === dataView.getUint8(index + offset),
    );
};
