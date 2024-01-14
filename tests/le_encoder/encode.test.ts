import { assertStrictEquals, assertThrows } from "../deps.ts";
import { Utf32 } from "../../mod.ts";

Deno.test("Utf32.LEEncoder.encode(string)", () => {
  const encoder = new Utf32.LEEncoder();

  // encode()
  assertStrictEquals(JSON.stringify([...encoder.encode()]), "[]");

  // encode(string)
  assertStrictEquals(JSON.stringify([...encoder.encode("")]), "[]");
  assertStrictEquals(
    JSON.stringify([...encoder.encode("ABCD")]),
    "[65,0,0,0,66,0,0,0,67,0,0,0,68,0,0,0]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("\u0000\u00FF")]),
    "[0,0,0,0,255,0,0,0]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("\u0100")]),
    "[0,1,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("\uFEFFあいう")]),
    "[255,254,0,0,66,48,0,0,68,48,0,0,70,48,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("\uFEFFあい\u{2000B}う")]),
    "[255,254,0,0,66,48,0,0,68,48,0,0,11,0,2,0,70,48,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uDC00う")]),
    "[66,48,0,0,68,48,0,0,253,255,0,0,70,48,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uDC00\uD800う")]),
    "[66,48,0,0,68,48,0,0,253,255,0,0,253,255,0,0,70,48,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uD800\uD800う")]),
    "[66,48,0,0,68,48,0,0,253,255,0,0,253,255,0,0,70,48,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uD800\uD7FFう")]),
    "[66,48,0,0,68,48,0,0,253,255,0,0,255,215,0,0,70,48,0,0]",
  );

  // encode(any)
  assertStrictEquals(
    JSON.stringify([...encoder.encode(0 as unknown as string)]),
    "[48,0,0,0]",
  );
});

Deno.test("Utf32.LEEncoder.encode(string) - strict", () => {
  const encoder = new Utf32.LEEncoder({ strict: true });

  // encode()
  assertThrows(
    () => {
      encoder.encode();
    },
    TypeError,
    "input",
  );

  // encode(string)
  assertStrictEquals(JSON.stringify([...encoder.encode("")]), "[]");
  assertStrictEquals(
    JSON.stringify([...encoder.encode("ABCD")]),
    "[65,0,0,0,66,0,0,0,67,0,0,0,68,0,0,0]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("\u0000\u00FF")]),
    "[0,0,0,0,255,0,0,0]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("\u0100")]),
    "[0,1,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("\uFEFFあいう")]),
    "[255,254,0,0,66,48,0,0,68,48,0,0,70,48,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("\uFEFFあい\u{2000B}う")]),
    "[255,254,0,0,66,48,0,0,68,48,0,0,11,0,2,0,70,48,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uDC00う")]),
    "[66,48,0,0,68,48,0,0,253,255,0,0,70,48,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uDC00\uD800う")]),
    "[66,48,0,0,68,48,0,0,253,255,0,0,253,255,0,0,70,48,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uD800\uD800う")]),
    "[66,48,0,0,68,48,0,0,253,255,0,0,253,255,0,0,70,48,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uD800\uD7FFう")]),
    "[66,48,0,0,68,48,0,0,253,255,0,0,255,215,0,0,70,48,0,0]",
  );

  // encode(any)
  assertThrows(
    () => {
      encoder.encode(0 as unknown as string);
    },
    TypeError,
    "input",
  );
});

Deno.test("Utf32.LEEncoder.encode(string) - prependBOM", () => {
  const encoder = new Utf32.LEEncoder({ prependBOM: true });

  // encode()
  assertStrictEquals(
    JSON.stringify([...encoder.encode(undefined)]),
    "[255,254,0,0]",
  );

  // encode(string)
  assertStrictEquals(
    JSON.stringify([...encoder.encode("")]),
    "[255,254,0,0]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("ABCD")]),
    "[255,254,0,0,65,0,0,0,66,0,0,0,67,0,0,0,68,0,0,0]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("\u0000\u00FF")]),
    "[255,254,0,0,0,0,0,0,255,0,0,0]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("\u0100")]),
    "[255,254,0,0,0,1,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("\uFEFFあいう")]),
    "[255,254,0,0,66,48,0,0,68,48,0,0,70,48,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("\uFEFFあい\u{2000B}う")]),
    "[255,254,0,0,66,48,0,0,68,48,0,0,11,0,2,0,70,48,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uDC00う")]),
    "[255,254,0,0,66,48,0,0,68,48,0,0,253,255,0,0,70,48,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uDC00\uD800う")]),
    "[255,254,0,0,66,48,0,0,68,48,0,0,253,255,0,0,253,255,0,0,70,48,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uD800\uD800う")]),
    "[255,254,0,0,66,48,0,0,68,48,0,0,253,255,0,0,253,255,0,0,70,48,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("あい\uD800\uD7FFう")]),
    "[255,254,0,0,66,48,0,0,68,48,0,0,253,255,0,0,255,215,0,0,70,48,0,0]",
  );

  // encode(any)
  assertStrictEquals(
    JSON.stringify([...encoder.encode(0 as unknown as string)]),
    "[255,254,0,0,48,0,0,0]",
  );
});

Deno.test("Utf32.LEEncoder.encode(string) - fatal", () => {
  const encoder = new Utf32.LEEncoder({ fatal: true });

  // encode()
  assertStrictEquals(JSON.stringify([...encoder.encode()]), "[]");

  // encode(string)
  assertStrictEquals(JSON.stringify([...encoder.encode("")]), "[]");
  assertStrictEquals(
    JSON.stringify([...encoder.encode("ABCD")]),
    "[65,0,0,0,66,0,0,0,67,0,0,0,68,0,0,0]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("\u0000\u00FF")]),
    "[0,0,0,0,255,0,0,0]",
  );
  assertStrictEquals(
    JSON.stringify([...encoder.encode("\u0100")]),
    "[0,1,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("\uFEFFあいう")]),
    "[255,254,0,0,66,48,0,0,68,48,0,0,70,48,0,0]",
  );

  assertStrictEquals(
    JSON.stringify([...encoder.encode("\uFEFFあい\u{2000B}う")]),
    "[255,254,0,0,66,48,0,0,68,48,0,0,11,0,2,0,70,48,0,0]",
  );

  assertThrows(
    () => {
      encoder.encode("あい\uDC00う");
    },
    TypeError,
    "encode-error: \uFFFD U+DC00",
  );

  assertThrows(
    () => {
      encoder.encode("あい\uDC00\uD800う");
    },
    TypeError,
    "encode-error: \uFFFD U+DC00",
  );

  assertThrows(
    () => {
      encoder.encode("あい\uD800\uD800う");
    },
    TypeError,
    "encode-error: \uFFFD U+D800",
  );

  assertThrows(
    () => {
      encoder.encode("あい\uD800\uD7FFう");
    },
    TypeError,
    "encode-error: \uFFFD U+D800",
  );

  // encode(any)
  assertStrictEquals(
    JSON.stringify([...encoder.encode(0 as unknown as string)]),
    "[48,0,0,0]",
  );
});
