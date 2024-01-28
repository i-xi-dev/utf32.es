import { assertStrictEquals, assertThrows } from "../deps.ts";
import { Utf32 } from "../../mod.ts";

Deno.test("Utf32.Be.Encoder.encode(string)", () => {
  const encoder = new Utf32.Be.Encoder();

  // encode()
  assertStrictEquals(JSON.stringify([...encoder.encode()]), "[]");

  // encode(string)
  assertStrictEquals(JSON.stringify([...encoder.encode("")]), "[]");
  assertStrictEquals(
    JSON.stringify([...encoder.encode("ABCD")]),
    "[0,0,0,65,0,0,0,66,0,0,0,67,0,0,0,68]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("\u0000\u00FF")]),
    "[0,0,0,0,0,0,0,255]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("\u0100")]),
    "[0,0,1,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("\uFEFFあいう")]),
    "[0,0,254,255,0,0,48,66,0,0,48,68,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("\uFEFFあい\u{2000B}う")]),
    "[0,0,254,255,0,0,48,66,0,0,48,68,0,2,0,11,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uDC00う")]),
    "[0,0,48,66,0,0,48,68,0,0,255,253,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uDC00\uD800う")]),
    "[0,0,48,66,0,0,48,68,0,0,255,253,0,0,255,253,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uD800\uD800う")]),
    "[0,0,48,66,0,0,48,68,0,0,255,253,0,0,255,253,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uD800\uD7FFう")]),
    "[0,0,48,66,0,0,48,68,0,0,255,253,0,0,215,255,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あいう\uD800")]),
    "[0,0,48,66,0,0,48,68,0,0,48,70,0,0,255,253]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あいう\uDC00")]),
    "[0,0,48,66,0,0,48,68,0,0,48,70,0,0,255,253]",
  );

  // encode(any)
  assertStrictEquals(
    JSON.stringify([...encoder.encode(0 as unknown as string)]),
    "[0,0,0,48]",
  );
});

Deno.test("Utf32.Be.Encoder.encode(string) - strict", () => {
  const encoder = new Utf32.Be.Encoder({ strict: true });

  // encode()
  assertThrows(
    () => {
      encoder.encode();
    },
    TypeError,
    "srcRunesAsString",
  );

  // encode(string)
  assertStrictEquals(JSON.stringify([...encoder.encode("")]), "[]");
  assertStrictEquals(
    JSON.stringify([...encoder.encode("ABCD")]),
    "[0,0,0,65,0,0,0,66,0,0,0,67,0,0,0,68]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("\u0000\u00FF")]),
    "[0,0,0,0,0,0,0,255]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("\u0100")]),
    "[0,0,1,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("\uFEFFあいう")]),
    "[0,0,254,255,0,0,48,66,0,0,48,68,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("\uFEFFあい\u{2000B}う")]),
    "[0,0,254,255,0,0,48,66,0,0,48,68,0,2,0,11,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uDC00う")]),
    "[0,0,48,66,0,0,48,68,0,0,255,253,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uDC00\uD800う")]),
    "[0,0,48,66,0,0,48,68,0,0,255,253,0,0,255,253,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uD800\uD800う")]),
    "[0,0,48,66,0,0,48,68,0,0,255,253,0,0,255,253,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uD800\uD7FFう")]),
    "[0,0,48,66,0,0,48,68,0,0,255,253,0,0,215,255,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あいう\uD800")]),
    "[0,0,48,66,0,0,48,68,0,0,48,70,0,0,255,253]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あいう\uDC00")]),
    "[0,0,48,66,0,0,48,68,0,0,48,70,0,0,255,253]",
  );

  // encode(any)
  assertThrows(
    () => {
      encoder.encode(0 as unknown as string);
    },
    TypeError,
    "srcRunesAsString",
  );
});

Deno.test("Utf32.Be.Encoder.encode(string) - prependBOM", () => {
  const encoder = new Utf32.Be.Encoder({ prependBOM: true });

  // encode()
  assertStrictEquals(
    JSON.stringify([...encoder.encode(undefined)]),
    "[0,0,254,255]",
  );

  // encode(string)
  assertStrictEquals(
    JSON.stringify([...encoder.encode("")]),
    "[0,0,254,255]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("ABCD")]),
    "[0,0,254,255,0,0,0,65,0,0,0,66,0,0,0,67,0,0,0,68]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("\u0000\u00FF")]),
    "[0,0,254,255,0,0,0,0,0,0,0,255]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("\u0100")]),
    "[0,0,254,255,0,0,1,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("\uFEFFあいう")]),
    "[0,0,254,255,0,0,48,66,0,0,48,68,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("\uFEFFあい\u{2000B}う")]),
    "[0,0,254,255,0,0,48,66,0,0,48,68,0,2,0,11,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uDC00う")]),
    "[0,0,254,255,0,0,48,66,0,0,48,68,0,0,255,253,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uDC00\uD800う")]),
    "[0,0,254,255,0,0,48,66,0,0,48,68,0,0,255,253,0,0,255,253,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uD800\uD800う")]),
    "[0,0,254,255,0,0,48,66,0,0,48,68,0,0,255,253,0,0,255,253,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uD800\uD7FFう")]),
    "[0,0,254,255,0,0,48,66,0,0,48,68,0,0,255,253,0,0,215,255,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あいう\uD800")]),
    "[0,0,254,255,0,0,48,66,0,0,48,68,0,0,48,70,0,0,255,253]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あいう\uDC00")]),
    "[0,0,254,255,0,0,48,66,0,0,48,68,0,0,48,70,0,0,255,253]",
  );

  // encode(any)
  assertStrictEquals(
    JSON.stringify([...encoder.encode(0 as unknown as string)]),
    "[0,0,254,255,0,0,0,48]",
  );
});

Deno.test("Utf32.Be.Encoder.encode(string) - fatal", () => {
  const encoder = new Utf32.Be.Encoder({ fatal: true });

  // encode()
  assertStrictEquals(JSON.stringify([...encoder.encode()]), "[]");

  // encode(string)
  assertStrictEquals(JSON.stringify([...encoder.encode("")]), "[]");
  assertStrictEquals(
    JSON.stringify([...encoder.encode("ABCD")]),
    "[0,0,0,65,0,0,0,66,0,0,0,67,0,0,0,68]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("\u0000\u00FF")]),
    "[0,0,0,0,0,0,0,255]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("\u0100")]),
    "[0,0,1,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("\uFEFFあいう")]),
    "[0,0,254,255,0,0,48,66,0,0,48,68,0,0,48,70]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("\uFEFFあい\u{2000B}う")]),
    "[0,0,254,255,0,0,48,66,0,0,48,68,0,2,0,11,0,0,48,70]",
  );

  assertThrows(
    () => {
      encoder.encode("あい\uDC00う");
    },
    TypeError,
    "encode-error: U+DC00",
  );

  assertThrows(
    () => {
      encoder.encode("あい\uDC00\uD800う");
    },
    TypeError,
    "encode-error: U+DC00",
  );

  assertThrows(
    () => {
      encoder.encode("あい\uD800\uD800う");
    },
    TypeError,
    "encode-error: U+D800",
  );

  assertThrows(
    () => {
      encoder.encode("あい\uD800\uD7FFう");
    },
    TypeError,
    "encode-error: U+D800",
  );

  assertThrows(
    () => {
      encoder.encode("あいう\uD800");
    },
    TypeError,
    "encode-error: U+D800",
  );

  assertThrows(
    () => {
      encoder.encode("あいう\uDC00");
    },
    TypeError,
    "encode-error: U+DC00",
  );

  // encode(any)
  assertStrictEquals(
    JSON.stringify([...encoder.encode(0 as unknown as string)]),
    "[0,0,0,48]",
  );
});
