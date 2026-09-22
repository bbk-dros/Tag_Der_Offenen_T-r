# Schnittstelle: Früchte-Duell

Drei Teams, drei Dateien in `module/`. Jede Datei hält sich an die Form unten.
Dann passt alles zusammen, ohne dass ein Team auf ein anderes wartet.

## Architektur

```
 Kamera ──► MediaPipe Pose ──► lib/main.js ──► poses ──► module/klingen.js
            (2 Personen)                                      │ list
                                                              ▼
 Maus (Taste M) ──► lib/main.js ── Mausklinge ────────────► blades
                                                              │
                          ┌───────────────────────────────────┤
                          ▼                                   ▼
                 module/ablauf.js ── start(players) ──► module/arena.js
                 Warten, Countdown,  ◄── running, scores,   Früchte, Treffer,
                 Ergebnis, Effekte       events ──          Punkte, Bomben
```

Ablauf in jedem Bild (etwa 60-mal pro Sekunde):

1. `lib/main.js` zeichnet das Kamerabild gespiegelt.
2. Hat die Kamera ein neues Bild ausgewertet (etwa 15- bis 30-mal pro Sekunde),
   ruft es `klingen.update(dt, now, poses)` auf.
3. Es ruft `ablauf.update(dt, now, view)` auf.
4. Es ruft `arena.update(dt, blades)` und `arena.draw(ctx)` auf.
5. Es ruft `ablauf.draw(ctx)` auf. Der Ablauf zeichnet also über der Arena.
6. Es zeichnet zu jeder Klinge einen Punkt in der Farbe ihrer Seite, groß, wenn sie `fast` ist.

`dt` ist die Zeit seit dem letzten Aufruf in Sekunden, `now` die aktuelle Zeit
in Sekunden. Alle Koordinaten sind Bildschirm-Pixel, das Bild ist schon gespiegelt.

## Was lib/stage.js allen gibt

```js
import { ctx, size, drawText, POSE, SIDES } from '../lib/stage.js';
```

| Name | Was |
|---|---|
| `ctx` | Zeichenfläche (Canvas 2D) über den ganzen Bildschirm |
| `size` | `{ width, height }` in Pixeln. Größen immer daraus rechnen, zum Beispiel `size.height * 0.07` |
| `drawText(text, x, y, fontSize, color, { align, weight })` | Text mit dunklem Rand |
| `POSE` | Nummern der Körperpunkte: `NOSE`, `LEFT_SHOULDER`, `RIGHT_SHOULDER`, `LEFT_ELBOW`, `RIGHT_ELBOW`, `LEFT_WRIST`, `RIGHT_WRIST`, `LEFT_HIP`, `RIGHT_HIP` |
| `SIDES` | `[{ name: 'BLAU', color }, { name: 'ORANGE', color }]`, Index 0 = links, 1 = rechts |

## Die Daten zwischen den Modulen

**poses** (von `lib/main.js`): je erkannter Person ein Array mit 33 Punkten.

```js
poses = [
  [{ x: 640, y: 210, visibility: 0.99 }, …],   // Person 1, poses[0][POSE.NOSE] ist die Nase
  [{ x: 1320, y: 190, visibility: 0.97 }, …],  // Person 2
]
```

`visibility` (0..1) sagt, wie sicher das Modell ist. Die Reihenfolge der
Personen ist zufällig und kann von Bild zu Bild wechseln.

**blades** (von `module/klingen.js` oder der Maus):

```js
blades = [
  { side: 0, x: 812, y: 344, px: 790, py: 330, fast: true },
  …
]
// side: 0 = links/blau, 1 = rechts/orange
// px, py: Position derselben Klinge im Bild davor
// fast: schnell genug für einen Schnitt
```

## module/klingen.js

```js
export default {
  list: [],                    // die Klingen im aktuellen Bild, Form wie oben
  update(dt, now, poses) { },  // aus poses die Klingen berechnen, in list ablegen
};
```

Das Klingen-Team entscheidet, **wann** geschnitten wird (`fast`) und **wer**
schneidet (`side`).

## module/arena.js

```js
export default {
  running: false,        // läuft gerade eine Runde?
  scores: [0, 0],        // Punkte [links, rechts]; im Einzelspiel zählt nur scores[0]
  events: [],            // was in diesem Bild passiert ist, siehe unten
  start(players) { },    // neue Runde mit 1 oder 2 Spielern, running = true
  stop() { },            // Runde sofort abbrechen, running = false
  update(dt, blades) { },// Früchte bewegen, Treffer prüfen, events neu füllen
  draw(ctx) { },         // Früchte zeichnen, auch wenn keine Runde läuft
};

// events, jedes Bild neu:
events = [{ type: 'slice', side: 0, x: 500, y: 300, color: '#ff4d6d' },
          { type: 'bomb',  side: 1, x: 1400, y: 250, color: '#444' }]
```

Das Früchte-Team prüft nur, **was** getroffen wird. Es rechnet nicht selbst
aus, ob eine Klinge schnell ist, sondern liest `fast`. Die Arena beendet die
Runde selbst, wenn die Zeit um ist (`running = false`).

## module/ablauf.js

```js
export default {
  update(dt, now, view) { },  // view = { poses, blades, arena }
  draw(ctx) { },              // Warten, Countdown, Ergebnis, Effekte
  reset() { },                // zurück zum Warten (Taste Esc)
};
```

Der Ablauf startet die Runde mit `view.arena.start(players)`, merkt am
Ende `running === false` und liest `scores`. Für Effekte liest er
`view.arena.events` und `view.blades`. Er ändert nichts an Klingen oder Früchten.

## Testen

| Adresse | Was läuft |
|---|---|
| `http://localhost:8123/` | alles |
| `http://localhost:8123/?nur=arena` | Arena ohne Ablauf, eine Runde startet von selbst |
| `http://localhost:8123/?nur=klingen` | nur Skelette und Klingen, kein Spiel |
| `http://localhost:8123/?modell=full` | genaueres, aber langsameres Modell |

| Taste | Wirkung |
|---|---|
| M | Maus statt Kamera: eine Klinge, Seite nach Bildhälfte. Noch einmal M schaltet zurück |
| D | Technik-Anzeige: Skelette, Anzahl Personen und Klingen, Punkte |
| F | Vollbild |
| Esc | zurück zum Warten |

Hat eine Datei einen Fehler, läuft der Rest weiter. Oben oder unten erscheint
eine rote Meldung, Datei und Zeile stehen in der Konsole (F12).
