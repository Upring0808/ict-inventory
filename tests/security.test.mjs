import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import typescript from 'typescript';

function loadPureTypescript(relativePath) {
  const source = readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
  const compiled = typescript.transpileModule(source, {
    compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2022 },
  });
  const loadedModule = { exports: {} };
  vm.runInNewContext(compiled.outputText, {
    module: loadedModule,
    exports: loadedModule.exports,
    TextEncoder,
    TextDecoder,
    Uint8Array,
    URL,
    atob,
    btoa,
    Buffer,
  }, { filename: relativePath });
  return loadedModule.exports;
}

const publicEquipment = loadPureTypescript('lib/publicEquipmentSummary.ts');
const input = loadPureTypescript('lib/security/input.ts');
const qr = loadPureTypescript('lib/qrEquipment.ts');
const tokenClaims = loadPureTypescript('lib/security/tokenClaims.ts');

test('public QR projection excludes confidential equipment fields', () => {
  const row = {
    property_number: 'EXAMPLE-QR-001',
    serial_number: 'SECRET-SERIAL',
    accountable_personnel: 'Private Person',
    verification_history: [{ verifiedBy: 'Private Person' }],
  };
  const summary = publicEquipment.publicEquipmentSummary(row);
  assert.equal(JSON.stringify(summary), JSON.stringify({ propertyNumber: 'EXAMPLE-QR-001', registered: true }));
  assert.equal(publicEquipment.validPublicPropertyNumber('EXAMPLE-QR-001'), true);
  assert.equal(publicEquipment.validPublicPropertyNumber('EXAMPLE\nQR'), false);
  assert.equal(publicEquipment.validPublicPropertyNumber('A'.repeat(161)), false);
});

test('bounded API input rejects oversized and non-object JSON', async () => {
  const request = (body) => new Request('https://inventory.example/api/setup', {
    method: 'POST',
    body,
  });
  assert.equal((await input.readJsonObject(request('{"email":"sample@example.test"}'))).email, 'sample@example.test');
  assert.equal(await input.readJsonObject(request('[]')), null);
  assert.equal(await input.readJsonObject(request('{invalid')), null);
  assert.equal(await input.readJsonObject(request('A'.repeat(8193))), null);
});

test('QR links round-trip and reject other origins', () => {
  const propertyNumber = 'EXAMPLE-QR-001';
  const reference = qr.encodeEquipmentReference(propertyNumber);
  assert.equal(qr.decodeEquipmentReference(reference), propertyNumber);
  const url = qr.equipmentVerificationUrl({ propertyNumber }, 'https://inventory.example');
  assert.equal(qr.getVerificationPathFromScan(url, 'https://inventory.example'), `/verify?asset=${reference}`);
  assert.equal(qr.getVerificationPathFromScan(url, 'https://other.example'), null);
  assert.equal(qr.decodeEquipmentReference('not a valid reference'), null);
});

test('recovery proof requires the same user and a recent recovery event', () => {
  const now = Date.UTC(2026, 9, 11, 12);
  const nowSeconds = Math.floor(now / 1000);
  const token = (claims) => `e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
  const recent = token({ sub: 'user-1', amr: [{ method: 'recovery', timestamp: nowSeconds - 30 }] });
  assert.equal(tokenClaims.hasRecentRecoveryProof(recent, 'user-1', now), true);
  assert.equal(tokenClaims.hasRecentRecoveryProof(recent, 'user-2', now), false);
  assert.equal(tokenClaims.hasRecentRecoveryProof(token({ sub: 'user-1', amr: [{ method: 'password', timestamp: nowSeconds }] }), 'user-1', now), false);
  assert.equal(tokenClaims.hasRecentRecoveryProof(token({ sub: 'user-1', amr: [{ method: 'recovery', timestamp: nowSeconds - 601 }] }), 'user-1', now), false);
  assert.equal(tokenClaims.hasRecentRecoveryProof('malformed', 'user-1', now), false);
});
