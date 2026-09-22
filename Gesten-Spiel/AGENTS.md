<!-- Dieselben Regeln wie in .github/copilot-instructions.md. Diese Datei lesen andere Agenten (z. B. ChatGPT/Codex). Beide Dateien gleich halten. -->

# Regeln für dieses Projekt

Ein Browser-Spiel für den Tag der offenen Tür. Mehrere Teams
arbeiten gleichzeitig daran, jedes an einer eigenen Datei in module/.

- Ändere nur die Datei, die im Ticket genannt ist. Müsste eine
  andere Datei geändert werden, schreib das in die Antwort und
  ändere sie nicht.
- Halte dich an SCHNITTSTELLE.md. Benenne keine Methode und kein
  Feld um, das dort steht.
- Ändere nichts in lib/ und vendor/.
- Reines JavaScript im Browser. Keine Bibliotheken, kein npm.
- Bezeichner auf Englisch, Texte auf dem Bildschirm auf Deutsch.
- Zahlen, die man beim Testen anpasst (Tempo, Größe, Zeiten),
  gehören in den CONFIG-Block am Anfang der Datei.
- Die Datei bleibt unter 250 Zeilen.
- Starte keinen Server und installiere nichts. Getestet wird
  von Hand im Browser.
- Erkläre zum Schluss in höchstens fünf Sätzen auf Deutsch,
  was du geändert hast.
