// Tests du calcul CP 140.03 — lancer avec : npm test (node --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDaily, nightMinutes } from './timesheet.js';

const row = (act, start, end, depart = 'Brussel', arrivee = 'Brussel') => ({
  'Activité': act, 'Heure de début': start, 'Heure de fin': end,
  'Position de départ': depart, 'Emplacement de fin': arrivee,
});
const day = (rows) => computeDaily(rows, null, null).breakdown;

test('(a) shift 19:00 → 00:00 : 5 h de travail dont 4 h de nuit', () => {
  const [d] = day([row('Conduite', '01/07/26 19:00', '02/07/26 00:00')]);
  assert.equal(d.date, '01.07.26');
  assert.equal(d.tempsTravail, 5);
  assert.equal(d.heureNuit, 4);
});

test('(b) pause de 45 min entre 20:00 et 06:00 : retirée de la disponibilité ET des heures de nuit', () => {
  const [d] = day([
    row('Conduite', '01/07/26 20:00', '01/07/26 22:30'),
    row('Repos', '01/07/26 22:30', '01/07/26 23:15'),
    row('Conduite', '01/07/26 23:15', '02/07/26 02:00'),
  ]);
  assert.equal(d.tempsTravail, 5.25);   // 2 h 30 + 2 h 45
  assert.equal(d.disponibilite, 0);     // 45 min de repos − 45 min de pause
  assert.equal(d.heureNuit, 5.25);      // avant correction : 6,00 (la pause restait en nuit)
});

test('(b bis) pause prise de jour : les heures de nuit ne sont pas réduites', () => {
  const [d] = day([
    row('Conduite', '01/07/26 15:00', '01/07/26 17:30'),
    row('Repos', '01/07/26 17:30', '01/07/26 18:15'),
    row('Conduite', '01/07/26 18:15', '01/07/26 22:00'),
  ]);
  assert.equal(d.tempsTravail, 6.25);
  assert.equal(d.heureNuit, 2);         // 20:00 → 22:00
});

test('(c) nuit à cheval sur minuit (20:06 → 01:13) : comptée une seule fois, sur le jour de début', () => {
  const rows = [
    row('Conduite', '30/06/26 20:06', '30/06/26 23:39'),
    row('Conduite', '30/06/26 23:39', '01/07/26 01:13'),
    row('Travail', '01/07/26 01:13', '01/07/26 01:17'),
  ];
  const days = day(rows);
  assert.equal(days.length, 1);
  assert.equal(days[0].date, '30.06.26');
  // 20:06→23:39 = 213 min, 23:39→01:13 = 94 min, 01:13→01:17 = 4 min → 311 min = 5,18 h
  assert.equal(days[0].tempsTravail, 5.18);
  assert.equal(days[0].heureNuit, 5.18); // tout est entre 20:00 et 06:00, minuit compris
  // 23:00 → 01:00 : exactement 120 minutes de nuit, sans perte ni doublon à minuit
  assert.equal(nightMinutes(new Date(2026, 5, 30, 23, 0), new Date(2026, 6, 1, 1, 0)), 120);
});

test('les heures de nuit ne dépassent jamais le temps de service', () => {
  for (const d of day([
    row('Conduite', '01/07/26 21:00', '02/07/26 02:00'),
    row('Disponibilité', '02/07/26 02:00', '02/07/26 02:30'),
    row('Conduite', '02/07/26 02:30', '02/07/26 04:00'),
  ])) {
    assert.ok(d.heureNuit <= d.tempsTravail + d.disponibilite + 1e-9);
    assert.ok(d.heureNuit >= 0);
  }
});
