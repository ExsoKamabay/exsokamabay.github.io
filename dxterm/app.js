// dracxterm landing page: hero parallax, the replayed claw session, and the screenshot strip.
// Everything here is decoration on top of a page that already works without it.
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  // ---- hero: pointer tilts the stage, scroll pulls the layers apart ----
  var hero = document.querySelector(".hero");
  if (hero && !reduce) {
    var targetX = 0, targetY = 0, curX = 0, curY = 0, scroll = 0, ticking = false;
    var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    function frame() {
      ticking = false;
      curX += (targetX - curX) * 0.12;
      curY += (targetY - curY) * 0.12;
      root.style.setProperty("--rx", curX.toFixed(3));
      root.style.setProperty("--ry", curY.toFixed(3));
      root.style.setProperty("--scroll", scroll.toFixed(4));
      if (Math.abs(targetX - curX) > 0.01 || Math.abs(targetY - curY) > 0.01) request();
    }
    function request() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(frame); }
    }
    if (finePointer) {
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;
        targetY = nx * 14;   // degrees around Y
        targetX = -ny * 10;  // degrees around X
        request();
      });
      hero.addEventListener("pointerleave", function () { targetX = 0; targetY = 0; request(); });
    }
    function onScroll() {
      var h = hero.offsetHeight || 1;
      scroll = Math.min(1, Math.max(0, window.scrollY / h));
      request();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ---- replay of a real claw chat session, typed out once it scrolls into view ----
  var pre = document.querySelector("[data-replay]");
  if (pre) {
    var tpl = document.getElementById(pre.getAttribute("data-replay"));
    var lines = tpl ? tpl.content.querySelectorAll("[data-line]") : [];
    var played = false;

    function showAll() {
      pre.textContent = "";
      for (var i = 0; i < lines.length; i++) {
        pre.appendChild(lines[i].cloneNode(true));
        pre.appendChild(document.createTextNode("\n"));
      }
      var caret = document.createElement("span");
      caret.className = "caret";
      pre.appendChild(caret);
    }

    function play() {
      if (played) return;
      played = true;
      if (reduce || !lines.length) { showAll(); return; }
      pre.textContent = "";
      var caret = document.createElement("span");
      caret.className = "caret";
      var i = 0;
      function nextLine() {
        if (i >= lines.length) { pre.appendChild(caret); return; }
        var src = lines[i++];
        var typed = src.getAttribute("data-line") === "typed";
        var node = src.cloneNode(true);
        if (!typed) {
          pre.appendChild(node);
          pre.appendChild(document.createTextNode("\n"));
          setTimeout(nextLine, src.getAttribute("data-pause") ? +src.getAttribute("data-pause") : 90);
          return;
        }
        // Typed lines keep their prompt span and type the rest character by character.
        var text = node.getAttribute("data-text") || "";
        node.removeAttribute("data-text");
        var cmd = document.createElement("span");
        node.appendChild(cmd);
        pre.appendChild(node);
        pre.appendChild(caret);
        var k = 0;
        (function type() {
          if (k <= text.length) {
            cmd.textContent = text.slice(0, k++);
            setTimeout(type, 28 + Math.random() * 40);
          } else {
            pre.removeChild(caret);
            pre.appendChild(document.createTextNode("\n"));
            setTimeout(nextLine, 650);
          }
        })();
      }
      nextLine();
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { play(); io.disconnect(); }
        });
      }, { threshold: 0.35 });
      io.observe(pre);
    } else {
      showAll();
    }
  }

  // ---- screenshot strip: each phone turns toward the centre as it passes ----
  var strip = document.querySelector(".shots");
  if (strip && !reduce) {
    var shots = strip.querySelectorAll(".shot");
    var pending = false;
    function tilt() {
      pending = false;
      var mid = strip.getBoundingClientRect().left + strip.clientWidth / 2;
      for (var i = 0; i < shots.length; i++) {
        var r = shots[i].getBoundingClientRect();
        var d = (r.left + r.width / 2 - mid) / strip.clientWidth; // about -0.5 .. 0.5
        var c = Math.max(-1, Math.min(1, d * 2));
        shots[i].style.setProperty("--tilt", (-c * 24).toFixed(2));
        shots[i].style.setProperty("--lift", ((1 - Math.abs(c)) * 40).toFixed(1));
      }
    }
    function queue() { if (!pending) { pending = true; window.requestAnimationFrame(tilt); } }
    strip.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    tilt();
  }
})();
