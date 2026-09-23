Du hilfst einem Schülerteam bei einem Browser-Spiel für den Tag der offenen Tür
unserer Schule: einem Früchte-Duell, bei dem zwei Personen vor einem großen
Bildschirm mit den Händen Früchte zerschneiden. Mehrere Teams arbeiten
gleichzeitig daran, jedes an einer eigenen Datei. Unser Team ist für
**module/ablauf.js** zuständig (Ablauf und Wirkung).
Unter diesem Text schicke ich dir unsere Datei und ein Ticket.

## Regeln

- Ändere nur module/ablauf.js. Müsste eine andere Datei geändert werden, schreib das
  dazu und ändere sie nicht.
- Halte dich an die Schnittstelle unten. Benenne keine Methode und kein Feld um.
- Reines JavaScript im Browser (ES-Module). Keine Bibliotheken, kein npm.
- Bezeichner auf Englisch, Texte auf dem Bildschirm auf Deutsch.
- Zahlen, die man beim Testen anpasst (Tempo, Größe, Zeiten), gehören in den
  CONFIG-Block am Anfang der Datei.
- Die Datei bleibt unter 250 Zeilen.
- **Gib immer die ganze Datei in einem einzigen Codeblock zurück**, nicht nur
  die geänderten Stellen.
- Erkläre danach in höchstens fünf Sätzen auf Deutsch, was du geändert hast.

## Was das Projekt schon bereitstellt

Das Spiel läuft im Browser über der gespiegelten Kamera. Eine KI (MediaPipe
Pose) erkennt bis zu zwei Personen. Alle Koordinaten sind Bildschirm-Pixel.
`dt` ist die Zeit seit dem letzten Aufruf in Sekunden, `now` die aktuelle Zeit
in Sekunden.

```js
import { ctx, size, drawText, POSE, SIDES } from '../lib/stage.js';
// ctx     Canvas-2D-Kontext über den ganzen Bildschirm
// size    { width, height } in Pixeln, Größen immer daraus rechnen
// drawText(text, x, y, fontSize, color = '#fff', { align = 'center', weight = 800 })
// POSE    { NOSE: 0, LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12, LEFT_ELBOW: 13,
//           RIGHT_ELBOW: 14, LEFT_WRIST: 15, RIGHT_WRIST: 16, LEFT_HIP: 23, RIGHT_HIP: 24 }
// SIDES   [{ name: 'BLAU', color: '#3db8ff' }, { name: 'ORANGE', color: '#ff9f1c' }]
//         Index 0 = linke Bildhälfte, 1 = rechte
```

Eine Klinge sieht so aus:

```js
{ side: 0, x: 812, y: 344, px: 790, py: 330, fast: true }
// side: 0 = links/blau, 1 = rechts/orange
// px, py: Position derselben Klinge im Bild davor
// fast: schnell genug für einen Schnitt
```

## Schnittstelle unserer Datei

```js
export default {
  update(dt, now, view) { },  // view = { poses, blades, arena }
  draw(ctx) { },              // Warten, Countdown, Ergebnis, Effekte
  reset() { },                // zurück zum Warten (Taste Esc)
};
```

`update` und `draw` werden etwa 60-mal pro Sekunde aufgerufen, `draw` nach der
Arena. `view.poses` enthält je erkannter Person ein Array mit 33 Punkten
`{ x, y, visibility }` in Bildschirm-Pixeln. `view.blades` ist ein Array von
Klingen (Form oben). `view.arena` gehört einem anderen Team. Wir benutzen davon nur:

```js
arena.start(players)   // Runde mit 1 oder 2 Spielern starten
arena.stop()           // Runde abbrechen
arena.running          // läuft die Runde noch?
arena.scores           // [links, rechts]
arena.events           // in diesem Bild: [{ type: 'slice' | 'bomb', side, x, y, color }]
```

Wir ändern nichts an Klingen oder Früchten.

## Unsere Datei und das Ticket

