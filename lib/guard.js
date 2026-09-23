// Klassisches Skript (kein Modul), damit es auch lädt, wenn die Seite
// versehentlich per Doppelklick als Datei geöffnet wurde. Dann blockiert der
// Browser alle Module, und ohne diesen Hinweis passiert beim Klick einfach nichts.
(function () {
  function showProblem(title, text, link) {
    var box = document.createElement('div');
    box.className = 'overlay';
    box.style.zIndex = '100';
    box.innerHTML =
      '<div class="box"><h1>' + title + '</h1><p>' + text + '</p>' +
      (link ? '<p><a href="' + link + '">' + link + '</a></p>' : '') + '</div>';
    document.body.appendChild(box);
  }

  window.addEventListener('DOMContentLoaded', function () {
    if (location.protocol === 'file:') {
      var page = location.pathname.split('/').pop() || 'index.html';
      showProblem(
        'Bitte über start.cmd öffnen',
        'Die Seite wurde direkt als Datei geöffnet. So blockiert der Browser Kamera und KI.<br>' +
        'Im Projektordner <b>start.cmd</b> doppelklicken. Läuft der Server schon, reicht dieser Link:',
        'http://localhost:8123/' + page
      );
      return;
    }
    // Das Modul setzt window.appReady, sobald es geladen ist.
    if (!document.querySelector('script[type="module"]')) return;
    setTimeout(function () {
      if (!window.appReady) {
        showProblem(
          'Skripte nicht geladen',
          'Die Programmteile der Seite konnten nicht geladen werden. Seite mit Strg+F5 neu laden. ' +
          'Hilft das nicht: F12 drücken und unter „Konsole“ nach roten Meldungen schauen.'
        );
      }
    }, 8000);
  });
})();
