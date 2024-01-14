import {
  CodePoint,
  Rune,
  SafeInteger,
  StringEx,
  TextEncoding,
  Uint32,
  Uint8,
} from "../deps.ts";

const _BE_LABEL = "UTF-32BE";
const _LE_LABEL = "UTF-32LE";

const _MAX_BYTES_PER_RUNE = 4;

type _RuneBytes = Array<Uint8>; // [Uint8, Uint8, Uint8, Uint8] ;

function _encodeShared(
  srcString: string,
  dstBuffer: ArrayBuffer,
  dstOffset: SafeInteger,
  options: {
    fatal: boolean; // エンコードのエラーは単独のサロゲートの場合のみ
    replacementBytes: Array<Uint8>;
  },
  littleEndian: boolean,
): TextEncoderEncodeIntoResult {
  const dstView = new DataView(dstBuffer);

  let read = 0;
  let written = 0;

  for (const rune of srcString) {
    const codePoint = rune.codePointAt(0) as CodePoint;

    if ((written + (rune.length * Uint32.BYTES)) > dstView.byteLength) {
      break;
    }
    read = read + rune.length;

    if (CodePoint.isSurrogateCodePoint(codePoint) !== true) {
      dstView.setUint32(
        dstOffset + written,
        rune.codePointAt(0) as CodePoint,
        littleEndian,
      );
      written = written + Uint32.BYTES;
    } else {
      if (options.fatal === true) {
        throw new TypeError(
          `encode-error: \uFFFD ${CodePoint.toString(codePoint)}`,
        );
      } else {
        for (const byte of options.replacementBytes) {
          dstView.setInt8(dstOffset + written, byte);
          written = written + Uint8.BYTES;
        }
      }
    }
  }

  return {
    read,
    written,
  };
}

function _encodeBe(
  srcString: string,
  dstBuffer: ArrayBuffer,
  dstOffset: SafeInteger,
  options: {
    fatal: boolean;
    replacementBytes: Array<Uint8>;
  },
): TextEncoderEncodeIntoResult {
  return _encodeShared(srcString, dstBuffer, dstOffset, options, false);
}

function _encodeLe(
  srcString: string,
  dstBuffer: ArrayBuffer,
  dstOffset: SafeInteger,
  options: {
    fatal: boolean;
    replacementBytes: Array<Uint8>;
  },
): TextEncoderEncodeIntoResult {
  return _encodeShared(srcString, dstBuffer, dstOffset, options, true);
}

const _DEFAULT_REPLACEMENT_CHAR = "\u{FFFD}";
const _DEFAULT_REPLACEMENT_BYTES_BE: _RuneBytes = [0x00, 0x00, 0xFF, 0xFD];
const _DEFAULT_REPLACEMENT_BYTES_LE: _RuneBytes = [0xFD, 0xFF, 0x00, 0x00];

function _getReplacement(
  replacementRune: unknown,
  littleEndian: boolean,
): { rune: Rune; bytes: _RuneBytes } {
  if (StringEx.isString(replacementRune) && (replacementRune.length === 1)) {
    try {
      const tmp = new ArrayBuffer(_MAX_BYTES_PER_RUNE);
      const { written } = _encodeShared(
        replacementRune,
        tmp,
        0,
        {
          fatal: true,
          replacementBytes: littleEndian
            ? _DEFAULT_REPLACEMENT_BYTES_LE
            : _DEFAULT_REPLACEMENT_BYTES_BE,
        },
        littleEndian,
      );
      return {
        rune: replacementRune,
        bytes: [...new Uint8Array(tmp.slice(0, written))] as Array<Uint8>,
      };
    } catch {
      // _DEFAULT_REPLACEMENT_BYTES を返す
    }
  }
  return {
    rune: _DEFAULT_REPLACEMENT_CHAR,
    bytes: littleEndian
      ? _DEFAULT_REPLACEMENT_BYTES_LE
      : _DEFAULT_REPLACEMENT_BYTES_BE,
  };
}

export namespace Utf32 {
  export type EncoderOptions = {
    fatal?: boolean;
    prependBOM?: boolean;
    strict?: boolean;
  };

  /** @deprecated */
  export class BEEncoder extends TextEncoding.Encoder {
    constructor(options: EncoderOptions = {}) {
      super({
        name: _BE_LABEL,
        fatal: options?.fatal === true,
        replacementBytes:
          _getReplacement(_DEFAULT_REPLACEMENT_CHAR, false).bytes,
        encode: _encodeBe,
        prependBOM: options?.prependBOM === true,
        strict: options?.strict === true,
        maxBytesPerRune: _MAX_BYTES_PER_RUNE,
      });
    }
  }

  /** @deprecated */
  export class LEEncoder extends TextEncoding.Encoder {
    constructor(options: EncoderOptions = {}) {
      super({
        name: _LE_LABEL,
        fatal: options?.fatal === true,
        replacementBytes:
          _getReplacement(_DEFAULT_REPLACEMENT_CHAR, true).bytes,
        encode: _encodeLe,
        prependBOM: options?.prependBOM === true,
        strict: options?.strict === true,
        maxBytesPerRune: _MAX_BYTES_PER_RUNE,
      });
    }
  }

  /** @deprecated */
  export class BEEncoderStream extends TextEncoding.EncoderStream {
    constructor(options: EncoderOptions = {}) {
      super({
        name: _BE_LABEL,
        fatal: options?.fatal === true,
        replacementBytes:
          _getReplacement(_DEFAULT_REPLACEMENT_CHAR, false).bytes,
        encode: _encodeBe,
        prependBOM: options?.prependBOM === true,
        strict: options?.strict === true,
        maxBytesPerRune: _MAX_BYTES_PER_RUNE,
      });
    }
  }

  /** @deprecated */
  export class LEEncoderStream extends TextEncoding.EncoderStream {
    constructor(options: EncoderOptions = {}) {
      super({
        name: _LE_LABEL,
        fatal: options?.fatal === true,
        replacementBytes:
          _getReplacement(_DEFAULT_REPLACEMENT_CHAR, true).bytes,
        encode: _encodeLe,
        prependBOM: options?.prependBOM === true,
        strict: options?.strict === true,
        maxBytesPerRune: _MAX_BYTES_PER_RUNE,
      });
    }
  }
}

// function _decode(
//   label: string,
//   input: BufferSource,
//   options: Encoding.DecodeOptions,
// ): string {
//   let view: DataView;
//   if (ArrayBuffer.isView(input)) {
//     view = new DataView(input.buffer);
//   } else if (input instanceof ArrayBuffer) {
//     view = new DataView(input);
//   } else {
//     throw new TypeError("input");
//   }

//   if (view.byteLength % Uint32.BYTES !== 0) {
//     throw new TypeError("input");
//   }

//   const runes = [];
//   let codePoint: number;
//   for (let i = 0; i < view.byteLength; i = i + Uint32.BYTES) {
//     codePoint = view.getUint32(i, label === _LE_LABEL);
//     if (CodePoint.isCodePoint(codePoint) !== true) {
//       throw new TypeError("input[*]");
//     }
//     runes.push(
//       String.fromCodePoint(codePoint),
//     );
//   }

//   const str = runes.join("");
//   if (options?.ignoreBOM === true) {
//     return str;
//   } else {
//     return str.startsWith(BOM) ? str.substring(1) : str;
//   }
// }
