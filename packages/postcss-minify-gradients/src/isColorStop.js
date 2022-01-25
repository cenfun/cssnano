import { unit } from 'postcss-value-parser';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';

extend([namesPlugin]);

/* Code derived from https://github.com/pigcan/is-color-stop */

const lengthUnits = new Set([
  'PX',
  'IN',
  'CM',
  'MM',
  'EM',
  'REM',
  'POINTS',
  'PC',
  'EX',
  'CH',
  'VW',
  'VH',
  'VMIN',
  'VMAX',
  '%',
]);

function isCSSLengthUnit(input) {
  return lengthUnits.has(input.toUpperCase());
}

function isStop(str) {
  let stop = !str;

  if (!stop) {
    const node = unit(str);
    if (node) {
      const number = Number(node.number);
      if (number === 0 || (!isNaN(number) && isCSSLengthUnit(node.unit))) {
        stop = true;
      }
    } else {
      stop = /^calc\(\S+\)$/g.test(str);
    }
  }
  return stop;
}

export default function isColorStop(color, stop) {
  return colord(color).isValid() && isStop(stop);
}