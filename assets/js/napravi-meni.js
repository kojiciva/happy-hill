/* Happy Hill — „Napravite svoj meni".
   Jela i cene dolaze iz assets/data/meni.json, koji pravi
   alati/excel-u-meni.py iz Nemanjinog Excela. Ovde nema nijedne cene.

   Tok: proslava → koraci sa jelima (iz JSON-a) → piće → rezime i slanje.
   Minimumi po koraku su u JSON-u (dogovor sa sastanka 28.9.2026). */

(function () {
  'use strict';

  /* Isti ID kao FORMSPREE u main.js. Dok je prazno, slanje otvara
     mejl program sa popunjenim menijem, kao forma na kontaktu. */
  var FORMSPREE = '';
  var PRIMALAC = 'happyhill.bocke@gmail.com';

  var builder = document.getElementById('builder');
  if (!builder) return;

  var el = {
    koraciJela: document.getElementById('koraci-jela'),
    broj: document.getElementById('korak-broj'),
    ukupno: document.getElementById('korak-ukupno'),
    fill: document.getElementById('progress-fill'),
    nazad: document.getElementById('nazad'),
    dalje: document.getElementById('dalje'),
    pricebar: document.getElementById('pricebar'),
    brojac: document.getElementById('brojac'),
    cena: document.getElementById('cena'),
    rezimeCena: document.getElementById('rezime-cena'),
    rezimeLista: document.getElementById('rezime-lista'),
    forma: document.getElementById('meni-upit'),
    gosti: document.getElementById('gosti'),
    vrsta: document.getElementById('vrsta'),
    greska: document.getElementById('greska')
  };

  var podaci = null;      // ceo JSON
  var jelo = {};          // id jela → { naziv, cena, kategorija }
  var izbor = {};         // id koraka → { id jela: true }
  var koraci = [];        // svi koraci redom: { id, el, tip, def }
  var tekuci = 0;

  function evri(n) {
    return n.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }

  function izabrana(korakId) {
    return Object.keys(izbor[korakId] || {});
  }

  /* Jelo izabrano u jednom glavnom jelu ne nudi se u drugom (važi u oba smera). */
  function par(korakId) {
    var p = null;
    podaci.koraci.forEach(function (k) {
      k.grupe.forEach(function (g) {
        if (g.iskljuci && k.id === korakId) p = g.iskljuci;
        if (g.iskljuci === korakId) p = k.id;
      });
    });
    return p;
  }

  function uGrupi(korakId, kategorija) {
    return izabrana(korakId).filter(function (id) { return jelo[id].kategorija === kategorija; }).length;
  }

  function zbir() {
    var s = 0;
    Object.keys(izbor).forEach(function (k) {
      izabrana(k).forEach(function (id) { s += jelo[id].cena; });
    });
    return Math.round(s * 100) / 100;
  }

  function korakIspunjen(k) {
    if (k.tip === 'proslava') return el.gosti.checkValidity();
    if (k.tip !== 'jela') return true;
    return k.def.grupe.every(function (g) { return uGrupi(k.id, g.kategorija) >= g.min; });
  }

  /* ---------- crtanje koraka sa jelima ---------- */
  function nacrtajKorak(def) {
    var sec = document.createElement('section');
    sec.className = 'step';
    sec.hidden = true;
    sec.setAttribute('data-korak', def.id);
    sec.setAttribute('aria-labelledby', 'h-' + def.id);

    var h = document.createElement('h2');
    h.className = 'h-sm';
    h.id = 'h-' + def.id;
    h.tabIndex = -1;
    h.textContent = def.naslov;
    sec.appendChild(h);

    var hint = document.createElement('p');
    hint.className = 'step-hint';
    hint.textContent = def.opis;
    sec.appendChild(hint);

    def.grupe.forEach(function (g) {
      var fs = document.createElement('fieldset');
      fs.className = 'dish-group';
      var lg = document.createElement('legend');
      lg.className = def.grupe.length > 1 ? 'label dish-legend' : 'sr-only';
      lg.textContent = g.kategorija.replace('/', ' / ');
      fs.appendChild(lg);

      var lista = document.createElement('div');
      lista.className = 'dish-list';
      var jedan = g.max === 1;

      podaci.jela[g.kategorija].forEach(function (j) {
        var lbl = document.createElement('label');
        lbl.className = 'dish';
        var inp = document.createElement('input');
        inp.type = jedan ? 'radio' : 'checkbox';
        inp.name = def.id + '-' + g.kategorija;
        inp.value = j.id;
        inp.addEventListener('change', function () {
          izbor[def.id] = izbor[def.id] || {};
          if (jedan) {
            podaci.jela[g.kategorija].forEach(function (x) { delete izbor[def.id][x.id]; });
          }
          if (inp.checked) izbor[def.id][j.id] = true;
          else delete izbor[def.id][j.id];
          osvezi();
        });
        var ime = document.createElement('span');
        ime.className = 'dish-name';
        ime.textContent = j.naziv;
        var cena = document.createElement('span');
        cena.className = 'dish-price';
        cena.textContent = evri(j.cena);
        var vec = document.createElement('span');
        vec.className = 'dish-taken';
        lbl.appendChild(inp);
        lbl.appendChild(ime);
        lbl.appendChild(cena);
        lbl.appendChild(vec);
        lista.appendChild(lbl);
      });

      fs.appendChild(lista);
      sec.appendChild(fs);
    });

    return sec;
  }

  /* Isključi jela koja su već izabrana u paru (glavno 1 ↔ glavno 2). */
  function zakljucajPar(k) {
    var drugi = par(k.id);
    if (!drugi) return;
    var drugiNaslov = '';
    podaci.koraci.forEach(function (d) { if (d.id === drugi) drugiNaslov = d.naslov; });
    Array.prototype.forEach.call(k.el.querySelectorAll('.dish'), function (lbl) {
      var inp = lbl.querySelector('input');
      var zauzeto = !!(izbor[drugi] && izbor[drugi][inp.value]);
      inp.disabled = zauzeto;
      lbl.classList.toggle('is-taken', zauzeto);
      lbl.querySelector('.dish-taken').textContent = zauzeto ? 'već u: ' + drugiNaslov : '';
    });
  }

  /* ---------- prikaz ---------- */
  function osvezi() {
    var k = koraci[tekuci];
    var s = zbir();
    el.cena.textContent = evri(s);
    el.rezimeCena.textContent = evri(s);

    if (k.tip === 'jela') {
      el.brojac.textContent = k.def.grupe.map(function (g) {
        var n = uGrupi(k.id, g.kategorija);
        var ime = k.def.grupe.length > 1 ? g.kategorija + ': ' : 'Izabrano ';
        return ime + n + (g.max === 1 ? ' od 1' : ', najmanje ' + g.min) + (n >= g.min ? ' ✓' : '');
      }).join(' · ');
    } else {
      var ukupnoJela = 0;
      Object.keys(izbor).forEach(function (id) { ukupnoJela += izabrana(id).length; });
      el.brojac.textContent = 'Izabrano jela: ' + ukupnoJela;
    }

    var ok = korakIspunjen(k);
    el.dalje.disabled = !ok;
    el.dalje.hidden = k.tip === 'rezime';
    el.nazad.hidden = tekuci === 0;
  }

  function prikazi(i, fokus) {
    koraci[tekuci].el.hidden = true;
    tekuci = i;
    var k = koraci[i];
    k.el.hidden = false;
    if (k.tip === 'jela') zakljucajPar(k);
    if (k.tip === 'rezime') nacrtajRezime();

    el.broj.textContent = 'Korak ' + (i + 1);
    el.fill.style.width = ((i + 1) / koraci.length * 100) + '%';
    el.pricebar.hidden = i === 0;
    osvezi();

    if (fokus) {
      builder.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var h = k.el.querySelector('h2');
      if (h) h.focus({ preventScroll: true });
    }
  }

  function nacrtajRezime() {
    el.rezimeLista.innerHTML = '';
    podaci.koraci.forEach(function (d) {
      var ids = izabrana(d.id);
      if (!ids.length) return;
      var blok = document.createElement('div');
      blok.className = 'summary-course';
      var p = document.createElement('p');
      p.className = 'label';
      p.textContent = d.naslov;
      var ul = document.createElement('ul');
      ids.forEach(function (id) {
        var li = document.createElement('li');
        var a = document.createElement('span');
        a.textContent = jelo[id].naziv;
        var b = document.createElement('span');
        b.textContent = evri(jelo[id].cena);
        li.appendChild(a);
        li.appendChild(b);
        ul.appendChild(li);
      });
      blok.appendChild(p);
      blok.appendChild(ul);
      el.rezimeLista.appendChild(blok);
    });
  }

  /* ---------- slanje ---------- */
  function teloPoruke(d) {
    var r = [
      'Vrsta proslave: ' + el.vrsta.value,
      'Broj gostiju: ' + (el.gosti.value || 'nije upisano'),
      'Okvirna cena hrane po gostu: ' + evri(zbir()),
      ''
    ];
    podaci.koraci.forEach(function (k) {
      var ids = izabrana(k.id);
      if (!ids.length) return;
      r.push(k.naslov.toUpperCase());
      ids.forEach(function (id) { r.push('- ' + jelo[id].naziv + ' (' + evri(jelo[id].cena) + ')'); });
      r.push('');
    });
    r.push('Piće: paket se dogovara');
    r.push('');
    r.push('Ime i prezime: ' + (d.get('ime') || ''));
    r.push('Telefon: ' + (d.get('telefon') || ''));
    r.push('Email: ' + (d.get('email') || ''));
    r.push('Željeni datum: ' + (d.get('datum') || ''));
    r.push('Poruka: ' + (d.get('poruka') || ''));
    return r.join('\n');
  }

  el.forma.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!el.forma.reportValidity()) return;
    var d = new FormData(el.forma);
    var naslov = 'Napravi svoj meni — ' + el.vrsta.value + ', ' + evri(zbir()) + ' po gostu';
    var telo = teloPoruke(d);

    if (FORMSPREE) {
      fetch('https://formspree.io/f/' + FORMSPREE, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ _subject: naslov, email: d.get('email'), poruka: telo })
      }).then(function (r) {
        if (!r.ok) throw new Error();
        window.location.href = 'hvala.html';
      }).catch(function () {
        window.location.href = 'mailto:' + PRIMALAC + '?subject=' + encodeURIComponent(naslov) +
          '&body=' + encodeURIComponent(telo);
      });
      return;
    }

    window.location.href = 'mailto:' + PRIMALAC +
      '?subject=' + encodeURIComponent(naslov) +
      '&body=' + encodeURIComponent(telo);
    setTimeout(function () { window.location.href = 'hvala.html'; }, 800);
  });

  /* ---------- pokretanje ---------- */
  function pokreni(json) {
    podaci = json;
    Object.keys(podaci.jela).forEach(function (kat) {
      podaci.jela[kat].forEach(function (j) {
        jelo[j.id] = { naziv: j.naziv, cena: j.cena, kategorija: kat };
      });
    });

    koraci.push({ id: 'proslava', tip: 'proslava', el: builder.querySelector('[data-korak="proslava"]') });
    podaci.koraci.forEach(function (def) {
      var sec = nacrtajKorak(def);
      el.koraciJela.appendChild(sec);
      koraci.push({ id: def.id, tip: 'jela', def: def, el: sec });
    });
    koraci.push({ id: 'pice', tip: 'pice', el: builder.querySelector('[data-korak="pice"]') });
    koraci.push({ id: 'rezime', tip: 'rezime', el: builder.querySelector('[data-korak="rezime"]') });

    el.ukupno.textContent = koraci.length;
    builder.hidden = false;

    el.dalje.addEventListener('click', function () {
      var k = koraci[tekuci];
      if (k.tip === 'proslava' && !el.gosti.reportValidity()) return;
      if (korakIspunjen(k) && tekuci < koraci.length - 1) prikazi(tekuci + 1, true);
    });
    el.nazad.addEventListener('click', function () {
      if (tekuci > 0) prikazi(tekuci - 1, true);
    });
    el.gosti.addEventListener('input', osvezi);

    prikazi(0, false);
  }

  fetch('assets/data/meni.json')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(pokreni)
    .catch(function () { el.greska.hidden = false; });
})();
