/* Happy Hill — jedan JS fajl, bez biblioteka.
   Mobilna navigacija, slajderi i tabovi za menije. */

(function () {
  'use strict';

  /* ============================================================
     GDE STIZE UPIT SA FORME

     Sajt je na GitHub Pages, a GitHub Pages nema server, pa forma
     ne moze sama da posalje mejl. Dva su nacina:

     1) Formspree (preporuceno kad bude vremena)
        Napravi se besplatan nalog na formspree.io, unese se
        happyhill.bocke@gmail.com, dobije se ID forme tipa "xyzabcd"
        i upise ovde dole. Upiti tada stizu na mejl i cuvaju se
        u Formspree nalogu.

     2) Ako je FORMSPREE prazno (kao sada)
        Dugme otvara mejl program sa vec popunjenim upitom, koji
        korisnik samo posalje. Radi bez ijednog naloga.

     Ako se sajt ikad vrati na Netlify, obrisati ovaj blok:
     Netlify Forms su vec u HTML-u i prorade sami.
     ============================================================ */
  var FORMSPREE = '';
  var PRIMALAC = 'happyhill.bocke@gmail.com';

  /* ---------- mobilna navigacija ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('open')) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        toggle.focus();
      }
    });
  }


  /* ---------- hero slajder ----------
     Slike su jedna preko druge i utapaju se. Stane kad je mis na heroju
     i kad je tab u pozadini. Ko je iskljucio animacije, vidi prvu sliku. */
  var heroSlides = document.querySelector('.hero-slides');
  if (heroSlides && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var slides = Array.prototype.slice.call(heroSlides.querySelectorAll('img'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
    if (slides.length > 1) {
      var i = 0, timer = null, PAUZA = 6000;

      heroSlides.classList.add('js');
      slides[0].classList.add('on');

      function show(n) {
        slides[i].classList.remove('on');
        if (dots[i]) dots[i].setAttribute('aria-current', 'false');
        i = (n + slides.length) % slides.length;
        slides[i].classList.add('on');
        if (dots[i]) dots[i].setAttribute('aria-current', 'true');
      }
      function start() { stop(); timer = setInterval(function () { show(i + 1); }, PAUZA); }
      function stop() { if (timer) { clearInterval(timer); timer = null; } }

      dots.forEach(function (d, n) {
        d.addEventListener('click', function () { show(n); start(); });
      });

      var hero = document.querySelector('.hero');
      hero.addEventListener('mouseenter', stop);
      hero.addEventListener('mouseleave', start);
      document.addEventListener('visibilitychange', function () {
        document.hidden ? stop() : start();
      });

      start();
    }
  }

  /* ---------- slajderi ----------
     Pomeranje ide preko scroll-snap trake, pa prst na telefonu radi sam
     od sebe, a strelice samo skroluju za jednu vidljivu sirinu. */
  Array.prototype.forEach.call(document.querySelectorAll('.slider'), function (slider) {
    var track = slider.querySelector('.slider-track');
    var prev = slider.querySelector('[data-slider="prev"]');
    var next = slider.querySelector('[data-slider="next"]');
    if (!track) return;

    function step() {
      var first = track.querySelector('.slide');
      if (!first) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
      return first.getBoundingClientRect().width + gap;
    }

    function sync() {
      var max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
    }

    if (prev) prev.addEventListener('click', function () { track.scrollLeft -= step(); });
    if (next) next.addEventListener('click', function () { track.scrollLeft += step(); });
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });

  /* ---------- forma za upit ---------- */
  var upit = document.querySelector('form[name="upit"]');
  if (upit) {
    var polja = [
      ['ime', 'Ime i prezime'], ['telefon', 'Telefon'], ['email', 'Email'],
      ['datum', 'Zeljeni datum'], ['vrsta', 'Vrsta proslave'],
      ['gosti', 'Broj gostiju'], ['meni', 'Meni'], ['poruka', 'Poruka']
    ];

    if (FORMSPREE) {
      upit.setAttribute('action', 'https://formspree.io/f/' + FORMSPREE);
      upit.setAttribute('method', 'POST');
    } else {
      upit.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!upit.reportValidity()) return;
        var d = new FormData(upit);
        var telo = polja
          .map(function (p) { return p[1] + ': ' + (d.get(p[0]) || ''); })
          .join('\n');
        var naslov = 'Upit sa sajta — ' + (d.get('vrsta') || 'proslava');
        window.location.href = 'mailto:' + PRIMALAC +
          '?subject=' + encodeURIComponent(naslov) +
          '&body=' + encodeURIComponent(telo);
        setTimeout(function () { window.location.href = 'hvala.html'; }, 800);
      });
    }
  }

  /* ---------- tabovi za menije ---------- */
  var tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { select(tab); });
    });

    tablist.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var n = null;
      if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') n = tabs[0];
      if (e.key === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); select(n, true); }
    });
  }
})();
