# Tickets Team Ablauf und Wirkung

Datei: `module/ablauf.js` · Testen: `http://localhost:8123/`, mit der Maus: Taste M

Ihr macht aus der Arena ein Spiel, das Besucher ohne Erklärung verstehen:
Warten, Start, Countdown, Runde, Ergebnis. Dazu kommt, was es für Zuschauer
spannend macht.

## T1: Die Zustände (Di 29.09.)

- [ ] Es gibt vier Zustände: Warten → Countdown → Runde → Ergebnis → Warten
- [ ] Beim Warten stehen groß der Spielname und in einem Satz, worum es geht
- [ ] Der Countdown zählt 3, 2, 1 groß in der Mitte herunter und startet dann `arena.start(players)`
- [ ] Die Runde endet, wenn `arena.running` false wird. Das Ergebnis zeigt die Punkte und steht 9 Sekunden, dann geht es zurück zum Warten
- [ ] Die Tasten 1 (allein) und 2 (zu zweit) starten weiterhin den Countdown. `reset()` (Esc) bricht jederzeit ab

### KI-Notiz

- Weg und KI:
- Anfragen:
- Was hat die KI gemacht?
- Was mussten wir korrigieren?

## T2: Start mit dem Körper, Siegerbildschirm (bis Fr 02.10.)

- [ ] Beim Warten startet der Countdown, wenn eine Person 0,8 Sekunden lang beide Handgelenke über die Nase hält. Ein Ring über dem Kopf zeigt, wie lange noch
- [ ] Steht während des Countdowns eine zweite Person im Bild, wird es ein Duell, sonst ein Einzelspiel. Der Countdown sagt an, was es wird
- [ ] Nach einem Duell steht groß „BLAU GEWINNT!“, „ORANGE GEWINNT!“ oder „UNENTSCHIEDEN!“ in der Farbe der Seite
- [ ] Nach dem Ergebnis gibt es 2 Sekunden Sperre, damit jubelnde Gewinner nicht sofort die nächste Runde starten

### KI-Notiz

- Weg und KI:
- Anfragen:
- Was hat die KI gemacht?
- Was mussten wir korrigieren?

## T3: Wirkung (bis Di 06.10.)

- [ ] Jede schnelle Klinge zieht eine kurze Leuchtspur in der Farbe ihrer Seite
- [ ] Zu jedem Eintrag in `arena.events` gibt es Partikel an der Stelle, bei einer Bombe zusätzlich ein Wackeln des Bildes
- [ ] Geräusche für Schnitt, Bombe, Countdown und Sieg, erzeugt mit der Web Audio API (keine Audiodateien)
- [ ] Der Tagesrekord wird im Browser gespeichert (`localStorage`), gilt nur für heute und steht beim Warten und beim Ergebnis. Ein neuer Rekord wird groß gefeiert
- [ ] Die Datei bleibt unter 250 Zeilen. Wird es zu viel, sagt ihr es im Stand-up

### KI-Notiz

- Weg und KI:
- Anfragen:
- Was hat die KI gemacht?
- Was mussten wir korrigieren?
