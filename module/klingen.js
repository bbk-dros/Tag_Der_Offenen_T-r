// Klingen · Team Klingen
// Platzhalter aus dem Starter. Er erfüllt die Schnittstelle (SCHNITTSTELLE.md),
// liefert aber noch keine Klingen. Im Maus-Modus (Taste M) erzeugt lib/main.js
// eine Klinge aus der Maus, damit die anderen Teams schon testen können.
// Skelette und Klingen ansehen: http://localhost:8123/?nur=klingen
import { size, POSE } from '../lib/stage.js';

const CONFIG = {
  minVisibility: 0.5,   // unsichere Punkte nicht verwenden
};

export default {
  // Alle Klingen im aktuellen Bild: [{ side, x, y, px, py, fast }]
  list: [],

  // Wird nur aufgerufen, wenn die Kamera ein neues Bild ausgewertet hat.
  // poses: je erkannter Person ein Array mit 33 Punkten { x, y, visibility },
  // x und y in Bildschirm-Pixeln. Die Nummern stehen in POSE.
  update(dt, now, poses) {
    this.list = [];
  },
};
