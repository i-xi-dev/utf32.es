import {
  CodePoint,
  Radix,
  Rune,
  SafeIntegerFormat,
  StringEx,
  TextEncoding,
  Uint32,
  Uint8,
} from "../deps.ts";

const _BE_LABEL = "UTF-32BE";
const _LE_LABEL = "UTF-32LE";

const _MAX_BYTES_PER_RUNE = 4;

type _RuneBytes = Array<Uint8>; // [Uint8, Uint8, Uint8, Uint8] ;

const _formatOptions = SafeIntegerFormat.Options.resolve({
  minIntegralDigits: 8,
  radix: Radix.HEXADECIMAL,
});

//TODO プラットフォームのバイトオーダーでエンコード

function _decodeShared(
  srcBuffer: ArrayBuffer,
  dstRunes: Array<Rune>,
  options: {
    allowPending: boolean;
    fatal: boolean;
    replacementRune: Rune;
  },
  littleEndian: boolean,
): TextEncoding.DecodeResult {
  const srcView = new DataView(srcBuffer);

  let readByteCount = 0;
  let writtenRuneCount = 0;
  const pendingBytes: Array<Uint8> = [];

  const srcByteCount = srcView.byteLength;
  const loopCount = (srcByteCount % Uint32.BYTES)
    ? (srcByteCount + Uint32.BYTES)
    : srcByteCount;
  for (let i = 0; i < loopCount; i = i + Uint32.BYTES) {
    let s = false;
    let uint32: number;
    if ((srcByteCount - i) < Uint32.BYTES) {
      if (options.allowPending === true) {
        for (let j = i; j < srcByteCount; j++) {
          pendingBytes.push(srcView.getUint8(j) as Uint8);
        }
        break;
      } else {
        // 4バイトで割り切れない場合TextDecode("utf-16xx")に合わせる
        if (options.fatal === true) {
          throw new TypeError(`decode-error: invalid data`);
        } else {
          // 端数バイトはU+FFFDにデコードする）
          s = true;
          uint32 = Number.NaN;
        }
      }
    } else {
      uint32 = srcView.getUint32(i, littleEndian);
    }

    // if ((writtenRuneCount + 1) > xxx) {
    //   break;
    // }
    readByteCount = readByteCount + Uint32.BYTES;

    if (CodePoint.isCodePoint(uint32)) {
      dstRunes.push(String.fromCodePoint(uint32));
      writtenRuneCount = writtenRuneCount + 1;
    } else {
      if (options.fatal === true) {
        throw new TypeError(
          `decode-error: 0x${
            SafeIntegerFormat.format(uint32 as number, _formatOptions)
          }`,
        );
      } else {
        dstRunes.push(options.replacementRune);
        writtenRuneCount = writtenRuneCount + 1;
      }
    }

    if (s === true) {
      break;
    }
  }

  return {
    readByteCount,
    writtenRuneCount,
    pendingBytes,
  };
}

function _decodeBe(
  srcBuffer: ArrayBuffer,
  dstRunes: Array<Rune>,
  options: {
    allowPending: boolean;
    fatal: boolean;
    replacementRune: Rune;
  },
): TextEncoding.DecodeResult {
  return _decodeShared(srcBuffer, dstRunes, options, false);
}

function _decodeLe(
  srcBuffer: ArrayBuffer,
  dstRunes: Array<Rune>,
  options: {
    allowPending: boolean;
    fatal: boolean;
    replacementRune: Rune;
  },
): TextEncoding.DecodeResult {
  return _decodeShared(srcBuffer, dstRunes, options, true);
}

function _encodeShared(
  srcString: string,
  dstBuffer: ArrayBuffer,
  options: {
    fatal: boolean; // エンコードのエラーは単独のサロゲートの場合のみ
    replacementBytes: Array<Uint8>;
  },
  littleEndian: boolean,
): TextEncoding.EncodeResult {
  const dstView = new DataView(dstBuffer);

  let readCharCount = 0;
  let writtenByteCount = 0;

  for (const rune of srcString) {
    const codePoint = rune.codePointAt(0) as CodePoint;

    if (
      (writtenByteCount + (rune.length * Uint32.BYTES)) > dstView.byteLength
    ) {
      break;
    }
    readCharCount = readCharCount + rune.length;

    if (CodePoint.isSurrogateCodePoint(codePoint) !== true) {
      dstView.setUint32(
        writtenByteCount,
        rune.codePointAt(0) as CodePoint,
        littleEndian,
      );
      writtenByteCount = writtenByteCount + Uint32.BYTES;
    } else {
      if (options.fatal === true) {
        throw new TypeError(
          `encode-error: ${CodePoint.toString(codePoint)}`,
        );
      } else {
        for (const byte of options.replacementBytes) {
          dstView.setUint8(writtenByteCount, byte);
          writtenByteCount = writtenByteCount + Uint8.BYTES;
        }
      }
    }
  }

  return {
    readCharCount,
    writtenByteCount,
  };
}

function _encodeBe(
  srcString: string,
  dstBuffer: ArrayBuffer,
  options: {
    fatal: boolean;
    replacementBytes: Array<Uint8>;
  },
): TextEncoding.EncodeResult {
  return _encodeShared(srcString, dstBuffer, options, false);
}

function _encodeLe(
  srcString: string,
  dstBuffer: ArrayBuffer,
  options: {
    fatal: boolean;
    replacementBytes: Array<Uint8>;
  },
): TextEncoding.EncodeResult {
  return _encodeShared(srcString, dstBuffer, options, true);
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
      const { writtenByteCount } = _encodeShared(
        replacementRune,
        tmp,
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
        bytes: [...new Uint8Array(tmp.slice(0, writtenByteCount))] as Array<
          Uint8
        >,
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
  export type DecoderOptions = {
    fatal?: boolean;
    ignoreBOM?: boolean;
    // strict?: boolean;
  };

  // /** @deprecated */
  // export class Decoder extends TextEncoding.Decoder {
  // BOMで判定してデコード、BOMが無ければエラー
  // }

  export type EncoderOptions = {
    fatal?: boolean;
    prependBOM?: boolean;
    strict?: boolean;
  };

  // /** @deprecated */
  // export class Encoder extends TextEncoding.Encoder {
  // プラットフォームのバイトオーダーでエンコード
  // }

  // /** @deprecated */
  // export class EncoderStream extends TextEncoding.EncoderStream {
  // プラットフォームのバイトオーダーでエンコード
  // }

  export namespace Be {
    /** @deprecated */
    export class Decoder extends TextEncoding.Decoder {
      constructor(options: DecoderOptions = {}) {
        super({
          name: _BE_LABEL,
          fatal: options?.fatal === true,
          replacementRune:
            _getReplacement(_DEFAULT_REPLACEMENT_CHAR, false).rune,
          decode: _decodeBe,
          ignoreBOM: options?.ignoreBOM === true,
          // strict: options?.strict === true,
          maxBytesPerRune: _MAX_BYTES_PER_RUNE,
        });
      }
    }

    /** @deprecated */
    export class Encoder extends TextEncoding.Encoder {
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
    export class EncoderStream extends TextEncoding.EncoderStream {
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

      get [Symbol.toStringTag](): string {
        return "Utf32.Be.EncoderStream";
      }
    }
  }

  export namespace Le {
    /** @deprecated */
    export class Decoder extends TextEncoding.Decoder {
      constructor(options: DecoderOptions = {}) {
        super({
          name: _LE_LABEL,
          fatal: options?.fatal === true,
          replacementRune:
            _getReplacement(_DEFAULT_REPLACEMENT_CHAR, true).rune,
          decode: _decodeLe,
          ignoreBOM: options?.ignoreBOM === true,
          // strict: options?.strict === true,
          maxBytesPerRune: _MAX_BYTES_PER_RUNE,
        });
      }
    }

    /** @deprecated */
    export class Encoder extends TextEncoding.Encoder {
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
    export class EncoderStream extends TextEncoding.EncoderStream {
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

      get [Symbol.toStringTag](): string {
        return "Utf32.Le.EncoderStream";
      }
    }
  }
}
