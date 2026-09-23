# Tickets Team Früchte

Datei: `module/arena.js` · Ohne Ablauf testen: `http://localhost:8123/?nur=arena`
Mit der Maus testen: Taste M, dann schnell über die Früchte wischen.

Früchte fliegen auf Wurfbahnen durchs Bild. Ihr prüft, welche Klinge welche
Frucht trifft. Ob eine Klinge schnell genug ist, entscheidet das Klingen-Team
(`blade.fast`).

## T1: Wurfbahnen und Treffer (Di 29.09.)

- [ ] Nach `start()` werden regelmäßig Früchte (Emojis wie 🍉 🍎 🍊) vom unteren Rand nach oben geworfen und fallen wieder
- [ ] Die Bahn folgt der Schwerkraft. Gravitation, Größe und Abstand der Würfe stehen im CONFIG-Block
- [ ] Eine Frucht ist getroffen, wenn die Strecke von (`px`, `py`) nach (`x`, `y`) einer schnellen Klinge die Frucht berührt
- [ ] Eine getroffene Frucht zerfällt in zwei Hälften, die auseinanderfliegen
- [ ] Jeder Treffer kommt als `{ type: 'slice', side, x, y, color }` in `events`

### KI-Notiz

- Weg und KI:
- Anfragen:
- Was hat die KI gemacht?
- Was mussten wir korrigieren?

## T2: Punkte, Bomben, faires Duell (bis Fr 02.10.)

- [ ] Jeder Treffer gibt der Seite der Klinge einen Punkt in `scores`. Im Einzelspiel zählt alles für `scores[0]`
- [ ] Manchmal fliegt eine Bombe (💣). Wer sie trifft, verliert 5 Punkte, nicht unter 0. Das kommt als `type: 'bomb'` in `events`
- [ ] Im Duell hat jede Seite ihre Hälfte. Früchte bleiben in ihrer Hälfte, und nur Klingen dieser Seite können sie treffen
- [ ] Jede Welle wird für beide Seiten gespiegelt erzeugt, damit das Duell fair ist
- [ ] Die Punkte beider Seiten stehen oben links und rechts in den Farben aus `SIDES`

### KI-Notiz

- Weg und KI:
- Anfragen:
- Was hat die KI gemacht?
- Was mussten wir korrigieren?

## T3: Rundenzeit und Tempo (bis Di 06.10.)

- [ ] Eine Runde dauert 60 Sekunden. Die Restzeit steht oben in der Mitte, die letzten 10 Sekunden rot. Danach ist `running` false
- [ ] Im Lauf der Runde kommen die Würfe schneller und manchmal mehrere auf einmal
- [ ] Drei Personen, die das Spiel nicht kennen, haben es vor dem Board gespielt. Die Werte im CONFIG-Block sind danach angepasst. Was geändert wurde, steht in der KI-Notiz

### KI-Notiz

- Weg und KI:
- Anfragen:
- Was hat die KI gemacht?
- Was mussten wir korrigieren?
