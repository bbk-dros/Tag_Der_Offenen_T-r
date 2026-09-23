# Tickets Team Klingen

Datei: `module/klingen.js` · Testen: `http://localhost:8123/?nur=klingen` (Skelette sind an)

Aus den Körperpunkten zweier Personen werden Klingen. Ihr entscheidet, wann
geschnitten wird und wer schneidet. Getestet wird vor der Kamera, am besten zu
zweit, 2 bis 3 m entfernt.

## T1: Handgelenke als Klingen (Di 29.09.)

- [ ] Jedes sichtbare Handgelenk (`POSE.LEFT_WRIST`, `POSE.RIGHT_WRIST`) wird eine Klinge in `list`
- [ ] Punkte mit `visibility` unter dem Wert im CONFIG-Block werden nicht verwendet
- [ ] Die Seite (`side`) richtet sich nach der Schultermitte der Person: linke Bildhälfte 0, rechte 1
- [ ] Stehen zwei Personen im Bild, hat jede ihre eigene Seite, auch wenn eine etwas über die Mitte tritt
- [ ] `px` und `py` sind die Position derselben Klinge beim letzten Aufruf. `fast` ist vorerst immer true

### KI-Notiz

- Weg und KI:
- Anfragen:
- Was hat die KI gemacht?
- Was mussten wir korrigieren?

## T2: Glätten und Tempo (bis Fr 02.10.)

- [ ] Die Klingen zittern nicht. Die neue Position wird mit der alten verrechnet, der Faktor steht im CONFIG-Block
- [ ] `fast` ist nur true, wenn sich die Klinge schneller als eine Schwelle bewegt. Die Schwelle steht im CONFIG-Block, gemessen in Bildschirmhöhen pro Sekunde
- [ ] Wer die Hand ruhig hält, schneidet nicht. Wer schnell wischt, schneidet
- [ ] In der KI-Notiz steht, welche Werte ihr vor der Kamera ausprobiert habt und warum ihr euch entschieden habt

### KI-Notiz

- Weg und KI:
- Anfragen:
- Was hat die KI gemacht?
- Was mussten wir korrigieren?

## T3: Längere Klinge, verschwundene Person (bis Di 06.10.)

- [ ] Die Klinge sitzt nicht am Handgelenk, sondern ein Stück darüber hinaus in Richtung Ellbogen → Handgelenk. Wie weit, steht im CONFIG-Block
- [ ] Verschwindet eine Person kurz (unter einer halben Sekunde) aus der Erkennung, springt ihre Klinge beim Wiederauftauchen nicht quer über den Bildschirm und schneidet dabei nichts
- [ ] Eine Person allein vor der Kamera funktioniert genauso wie zwei

### KI-Notiz

- Weg und KI:
- Anfragen:
- Was hat die KI gemacht?
- Was mussten wir korrigieren?
