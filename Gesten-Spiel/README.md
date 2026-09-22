# Früchte-Duell

Zwei Personen stehen vor dem Board und zerschneiden mit den Händen Früchte.
Eine KI (MediaPipe Pose von Google) erkennt die Körper. Sie läuft im Browser,
es wird nichts gespeichert und nichts gesendet.

## Starten

1. Im Projektordner **`start.cmd` doppelklicken.** Ein schwarzes Fenster mit dem
   Webserver geht auf, der Browser öffnet das Spiel. Das Fenster offen lassen.
2. Der Browser fragt nach der Kamera: **Zulassen**.
3. Ohne Kamera testen: Taste **M** (Maus).

Ein Doppelklick direkt auf `index.html` funktioniert **nicht**. Dann sperrt der
Browser Kamera und KI. Die Adresse muss mit `http://localhost:8123` beginnen.

## Was wo liegt

| Ordner oder Datei | Was | Wer ändert es |
|---|---|---|
| `module/klingen.js` | aus den Körperpunkten werden Klingen | Team Klingen |
| `module/arena.js` | Früchte, Treffer, Punkte | Team Früchte |
| `module/ablauf.js` | Warten, Countdown, Ergebnis, Effekte | Team Ablauf |
| `SCHNITTSTELLE.md` | wie die Dateien zusammenpassen, mit Schaubild | niemand |
| `tickets/` | eine Datei je Team: Tickets, Akzeptanzkriterien, KI-Notizen | das Team |
| `prompt-vorlagen/` | Regeln und Schnittstelle für die KI im Browser (Weg B) | niemand |
| `.github/copilot-instructions.md`, `AGENTS.md` | Regeln für den Agenten (Weg A) | niemand |
| `lib/` | Kamera, KI, Hauptschleife, Hilfsfunktionen | niemand |
| `vendor/` | MediaPipe und die KI-Modelle, damit alles ohne Internet läuft | niemand |

## Ablauf für ein Ticket

1. **Synchronisieren**, damit Sie den Stand der anderen Teams haben.
2. Ticket in `tickets/` lesen.
3. Mit der KI umsetzen:
   - **Weg A, Agent:** neuer Chat, Modus *Agent*, zum Beispiel
     „Setze T1 aus tickets/arena.md um. Ändere nur module/arena.js.“
   - **Weg B, Browser:** neuer Chat, den ganzen Inhalt Ihrer Datei aus
     `prompt-vorlagen/` einfügen, darunter Ihre Datei und das Ticket.
4. Im Browser testen: Seite neu laden (F5), zuerst mit der Maus, dann mit der Kamera.
5. Läuft es: **Commit** mit Ticketnummer („T1: …“), dann **Synchronisieren**.
6. KI-Notiz unter das Ticket schreiben, committen, synchronisieren.

## Wenn es nicht läuft

- **F12** drücken, oben **Konsole** wählen. Rote Zeilen sind Fehler. Dort stehen
  Datei und Zeile. Die Meldung kopieren Sie in den Chat.
- Das Spiel läuft trotz eines Fehlers in einer Datei weiter. Unten erscheint
  dann ein roter Balken.
- Die Datei ist kaputt und Sie wissen nicht mehr weiter: in der
  Quellcodeverwaltung *Änderungen verwerfen*. Dann gilt wieder der letzte Commit.

## Tasten

| Taste | Wirkung |
|---|---|
| M | Maus statt Kamera, noch einmal M schaltet zurück |
| Esc | zurück zum Warten |
| D | Technik-Anzeige |
| F | Vollbild |

Alles Weitere steht in `SCHNITTSTELLE.md` und auf dem Projektblatt.
