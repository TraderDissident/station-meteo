/*
 * LA BANNIÈRE D'INSTALLATION, POUR UN SITE SANS CONSTRUCTION · La même que banniere.tsx (même
 * dessin, installation.css ; mêmes textes, textes.ts ; même comportement), pour un site qui ne
 * prend ni React ni module : Station Météo, iPad sous iOS 12 (Matt, 20/11/2026). JavaScript ES2017,
 * un script classique ; il pose `window.SocleInstallation`. Copie diffusée par outils/diffuser.mjs :
 * ne jamais la modifier dans le site.
 *
 *   <link rel="stylesheet" href="socle/installation.css">
 *   <script src="socle/installation.js"></script>
 *   SocleInstallation.monter({ produit: "stationmeteo", nom: "Station Météo", icone: "img/icon-180.png" });
 *
 * `nom` peut être une fonction de la langue (« fr », « en ») ; `langue`, une fonction qui la rend
 * (par défaut, `<html lang>` au moment où la bannière s'affiche). Le site enregistre son propre
 * service worker : celui-ci n'en enregistre pas.
 *
 * Quand elle se montre, après 2,5 s, si l'app n'est pas déjà installée et qu'on ne l'a pas fermée
 * depuis 30 jours : le navigateur sait installer (`beforeinstallprompt`) → « Installer » ; iPhone et
 * iPad → la marche à suivre par Partager ; Safari sur Mac → « Ajouter au Dock » ; ailleurs, rien.
 */
(function () {
  "use strict";

  var SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;
  var APPEAR_DELAY_MS = 2500;

  // Les textes de textes.ts, à l'identique (le test du socle compare les deux).
  var TEXTES = {
    fr: {
      titre: "Installer {nom}",
      corps: "Ajoutez l'app à votre écran d'accueil pour un accès instantané.",
      installer: "Installer",
      ios: "Appuyez sur {partager} puis « Sur l'écran d'accueil ».",
      macSafari: "Dans le menu Fichier, choisissez « Ajouter au Dock ».",
      partager: "Partager",
      fermer: "Fermer",
    },
    en: {
      titre: "Install {nom}",
      corps: "Add the app to your home screen for instant access.",
      installer: "Install",
      ios: "Tap {partager} then “Add to Home Screen”.",
      macSafari: "In the File menu, choose “Add to Dock”.",
      partager: "Share",
      fermer: "Close",
    },
  };

  // Les icônes de lucide (Share, X), celles de la bannière React.
  var SVG =
    'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  var ICONE_PARTAGER =
    '<path d="M12 2v13"/><path d="m16 6-4-4-4 4"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>';
  var ICONE_FERMER = '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>';

  function langueDe(l) {
    return String(l || "")
      .toLowerCase()
      .indexOf("fr") === 0
      ? "fr"
      : "en";
  }

  function isStandalone() {
    var media = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
    return Boolean(media) || window.navigator.standalone === true;
  }

  /** Un iPhone ou un iPad, quel que soit le navigateur (iPadOS se dit Mac : on le reconnaît au toucher). */
  function isIos() {
    var ua = navigator.userAgent;
    return (
      /iphone|ipad|ipod/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }

  /** Safari sur un Mac (pas un iPad) : « Ajouter au Dock » depuis Safari 17. */
  function isMacSafari() {
    var ua = navigator.userAgent;
    var safari = /safari/i.test(ua) && !/chrome|chromium|crios|fxios|edg|opr|brave/i.test(ua);
    var m = /version\/(\d+)/i.exec(ua);
    var version = m ? Number(m[1]) : 0;
    return /macintosh/i.test(ua) && !(navigator.maxTouchPoints > 1) && safari && version >= 17;
  }

  function recentlyDismissed(cle) {
    try {
      var v = window.localStorage.getItem(cle);
      return Boolean(v) && Date.now() - Number(v) < SNOOZE_MS;
    } catch (e) {
      return false;
    }
  }

  function el(tag, classe, texte) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texte) n.textContent = texte;
    return n;
  }

  function icone(chemin, libelle) {
    var s = el("span");
    s.innerHTML =
      "<svg " + SVG + (libelle ? ' role="img"' : ' aria-hidden="true"') + ">" + chemin + "</svg>";
    var svg = s.firstChild;
    if (libelle) svg.setAttribute("aria-label", libelle);
    return svg;
  }

  function monter(options) {
    var o = options || {};
    var cle = o.produit + "-pwa-dismissed-at";
    if (isStandalone() || recentlyDismissed(cle)) return;
    var mode = null;
    var differe = null;
    var minuteur = null;
    var cadre = null;

    function textes() {
      var l = langueDe(
        typeof o.langue === "function" ? o.langue() : o.langue || document.documentElement.lang,
      );
      var t = TEXTES[l];
      var nom = typeof o.nom === "function" ? o.nom(l) : o.nom;
      return { t: t, nom: nom };
    }

    function retirer() {
      if (cadre && cadre.parentNode) cadre.parentNode.removeChild(cadre);
      cadre = null;
    }

    function fermer() {
      retirer();
      try {
        window.localStorage.setItem(cle, String(Date.now()));
      } catch (e) {
        /* stockage indisponible : fermée pour cette page seulement */
      }
    }

    function afficher() {
      if (!mode || isStandalone()) return;
      if (mode === "installer" && !differe) return;
      retirer();
      var x = textes();
      var t = x.t;
      var titre = t.titre.replace("{nom}", x.nom);
      cadre = el("div", "banniere-installation inst-cadre");
      cadre.setAttribute("role", "region");
      cadre.setAttribute("aria-label", titre);
      var carte = el("div", "inst-carte");
      var img = el("img", "inst-icone");
      img.src = o.icone;
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      carte.appendChild(img);
      var bloc = el("div", "inst-textes");
      bloc.appendChild(el("p", "inst-titre", titre));
      var corps = el("p", "inst-corps");
      if (mode === "ios") {
        var morceaux = t.ios.split("{partager}");
        corps.appendChild(document.createTextNode(morceaux[0]));
        corps.appendChild(icone(ICONE_PARTAGER, t.partager));
        corps.appendChild(document.createTextNode(morceaux[1] || ""));
      } else {
        corps.textContent = mode === "mac-safari" ? t.macSafari : t.corps;
      }
      bloc.appendChild(corps);
      carte.appendChild(bloc);
      if (mode === "installer") {
        var installer = el("button", "inst-installer", t.installer);
        installer.type = "button";
        installer.addEventListener("click", function () {
          var d = differe;
          if (!d) return;
          d.prompt();
          Promise.resolve(d.userChoice)
            .catch(function () {})
            .then(function () {
              differe = null;
              retirer();
            });
        });
        carte.appendChild(installer);
      }
      var croix = el("button", "inst-fermer");
      croix.type = "button";
      croix.setAttribute("aria-label", t.fermer);
      var x16 = icone(ICONE_FERMER, "");
      x16.setAttribute("width", "16");
      x16.setAttribute("height", "16");
      croix.appendChild(x16);
      croix.addEventListener("click", fermer);
      carte.appendChild(croix);
      cadre.appendChild(carte);
      document.body.appendChild(cadre);
    }

    function montrer(m) {
      mode = m;
      if (minuteur) clearTimeout(minuteur);
      minuteur = setTimeout(afficher, APPEAR_DELAY_MS);
    }

    // Le navigateur sait installer : il le dit, et garde la fenêtre pour « Installer ».
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      differe = e;
      montrer("installer");
    });
    window.addEventListener("appinstalled", retirer);
    // Sans événement : la marche à suivre.
    if (isIos()) montrer("ios");
    else if (isMacSafari()) montrer("mac-safari");
  }

  window.SocleInstallation = { monter: monter, textes: TEXTES };
})();
