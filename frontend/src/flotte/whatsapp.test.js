import { test } from 'node:test';
import assert from 'node:assert/strict';
import { waNumber, waLink } from './wa.js';

test('numéros WhatsApp au format international', () => {
  assert.equal(waNumber('0470 12 34 56'), '32470123456');
  assert.equal(waNumber('+32 470/12.34.56'), '32470123456');
  assert.equal(waNumber('0032470123456'), '32470123456');
  assert.equal(waNumber('+33 6 12 34 56 78'), '33612345678');
  assert.equal(waNumber(''), '');
  assert.equal(waNumber('123'), '');
});

test('lien wa.me avec message encodé', () => {
  assert.equal(waLink('0470123456', 'Bonjour à tous'), 'https://wa.me/32470123456?text=Bonjour%20%C3%A0%20tous');
  assert.equal(waLink(null, 'x'), 'https://wa.me/?text=x');
});
