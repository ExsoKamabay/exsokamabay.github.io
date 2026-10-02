// dracxterm landing page: hero parallax, the replayed claw session, and the screenshot strip.
// Everything here is decoration on top of a page that already works without it.
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  // ---- hero backdrop: matrix-style falling code on the <canvas class="matrix"> ----
  var canvas = document.querySelector(".matrix");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var glyphs = "01<>/\\|#%&*+=:ABCDEF0123456789$abcdef{}[]".split("");
    var fontSize = 14, cols = 0, drops = [], dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;

    function resize() {
      var r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(r.width));
      h = Math.max(1, Math.floor(r.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = fontSize + "px 'JetBrains Mono', monospace";
      ctx.textBaseline = "top";
      cols = Math.ceil(w / fontSize);
      drops = [];
      for (var i = 0; i < cols; i++) drops.push(Math.floor(Math.random() * (h / fontSize)));
    }

    function draw() {
      // Trail: paint a translucent dark layer over the last frame so glyphs fade out.
      ctx.fillStyle = "rgba(4, 8, 10, 0.08)";
      ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < cols; i++) {
        var x = i * fontSize;
        var y = drops[i] * fontSize;
        var ch = glyphs[(Math.random() * glyphs.length) | 0];
        ctx.fillStyle = "rgba(190, 255, 220, 0.95)"; // bright leading glyph
        ctx.fillText(ch, x, y);
        ctx.fillStyle = "rgba(57, 255, 140, 0.55)"; // green trail
        ctx.fillText(glyphs[(Math.random() * glyphs.length) | 0], x, y - fontSize);
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        else drops[i]++;
      }
    }

    resize();
    var rsz;
    window.addEventListener("resize", function () { clearTimeout(rsz); rsz = setTimeout(resize, 200); });

    if (reduce) {
      // One static frame instead of an animation loop.
      ctx.fillStyle = "#04080a";
      ctx.fillRect(0, 0, w, h);
      for (var p = 0; p < 6; p++) draw();
    } else {
      var running = true, acc = 0, last = 0;
      function loop(ts) {
        if (!running) return;
        if (!last) last = ts;
        acc += ts - last; last = ts;
        if (acc >= 55) { draw(); acc = 0; } // ~18fps is plenty for code rain, and cheap
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
      // Pause the loop while the hero is off-screen, to save battery.
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (ents) {
          ents.forEach(function (e) {
            if (e.isIntersecting && !running) { running = true; last = 0; requestAnimationFrame(loop); }
            else if (!e.isIntersecting) { running = false; }
          });
        }, { threshold: 0 }).observe(canvas);
      }
    }
  }

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
