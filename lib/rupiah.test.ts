// npx tsx lib/rupiah.test.ts
// ponytail: satu berkas cek, tanpa framework. Sengaja terpisah dari rupiah.ts
// supaya tidak ada penjaga `require.main === module` yang pecah saat dibundel.
import assert from "node:assert";
import { formatRupiah, parseRupiah } from "./rupiah";

assert.equal(parseRupiah("Rp 20.000.000"), 20000000);
assert.equal(parseRupiah("20000000"), 20000000);
assert.equal(parseRupiah(" 1.500 "), 1500);
assert.equal(parseRupiah("0"), 0);
assert.throws(() => parseRupiah("abc"));
assert.equal(formatRupiah(20000000).replace(/\u00a0/g, " "), "Rp 20.000.000");
console.log("ok");
