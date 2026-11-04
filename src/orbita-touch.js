/* ==========================================================================
   ÓRBITA — controle por toque da área de trabalho remota
   A tela remota do MeshCentral só escuta o mouse: num celular, um toque vira
   clique no ponto tocado e nenhum outro gesto chega ao computador. Aqui os
   gestos são lidos e mandados pelas funções da própria página (dmousedown,
   dmouseup, dmousemove, dmousewheel). Só carrega em aparelhos sem mouse.

   Modo ponteiro (touchpad): deslizar move o ponteiro, tocar clica onde ele
   está, segurar é o botão direito, tocar duas vezes e arrastar segura o botão
   esquerdo. Modo toque: o clique sai onde o dedo encostou e arrastar arrasta.
   Nos dois, dois dedos rolam a tela. O botão flutuante abre o teclado do
   aparelho e troca de modo.
   ========================================================================== */
(function () {
    'use strict';
    var root = document.documentElement;
    if (!root.classList.contains('orb')) return;

    var SLOP = 8;       // px que o dedo anda até um toque virar movimento
    var HOLD_MS = 500;  // tempo parado para o botão direito
    var TAP_MS = 220;   // espera por um segundo toque antes de soltar o clique
    var WHEEL_PX = 30;  // px de dois dedos por passo da roda do mouse
    var KB_REST = ' ';  // o campo nunca fica vazio: vazio, o apagar não gera evento
    var KB_KEYS = { 9: 0, 13: 0, 27: 0, 33: 1, 34: 1, 35: 1, 36: 1, 37: 1, 38: 1, 39: 1, 40: 1, 46: 1 }; // tecla: estendida?

    var ICON = {
        keyboard: '<path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/>',
        pointer: '<path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"/>',
        hand: '<path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>'
    };

    function $(id) { return document.getElementById(id); }
    function has(n) { return typeof window[n] === 'function'; }
    function noop() { }
    function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }
    function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
    function toast(m) { if (has('orbToast')) window.orbToast(m); }
    function ic(body) { return window.orbIcon(null, body); }
    function active() { return has('orbDeskActive') && !!window.orbDeskActive(); }
    function load(name, val) { return has('getstore') ? window.getstore(name, val) : val; }
    function save(name, val) { if (has('putstore')) window.putstore(name, val); }

    var mode = load('orbTouchMode', 'ponteiro') === 'toque' ? 'toque' : 'ponteiro';
    var shown = false;      // sessão conectada e aceitando controle
    var touched = false;    // o ponteiro já foi usado nesta sessão
    var ptr = { x: 0, y: 0 };
    var g = null;           // gesto em andamento
    var tapTimer = null;    // clique à espera de um possível segundo toque
    var dragging = false;   // botão esquerdo pressionado
    var ptrEl, kit, kb;

    // ---------- Ponteiro ----------
    // Parte visível da tela remota, em coordenadas da janela.
    function bounds() {
        var c = $('Desk').getBoundingClientRect(), p = $('DeskParent').getBoundingClientRect();
        return { l: Math.max(c.left, p.left), t: Math.max(c.top, p.top), r: Math.min(c.right, p.right), b: Math.min(c.bottom, p.bottom) };
    }

    function place(x, y) {
        var b = bounds();
        ptr.x = clamp(x, b.l, b.r - 1);
        ptr.y = clamp(y, b.t, b.b - 1);
        ptrEl.style.transform = 'translate3d(' + Math.round(ptr.x) + 'px,' + Math.round(ptr.y) + 'px,0)';
    }

    function center() { var b = bounds(); place((b.l + b.r) / 2, (b.t + b.b) / 2); }

    // ---------- Envio ao computador remoto ----------
    function mouse(which) {
        return {
            pageX: ptr.x + window.pageXOffset, pageY: ptr.y + window.pageYOffset, clientX: ptr.x, clientY: ptr.y,
            which: which || 0, button: which === 3 ? 2 : 0, buttons: which === 3 ? 2 : (which ? 1 : 0),
            preventDefault: noop, stopPropagation: noop
        };
    }

    function move() { window.dmousemove(mouse()); }

    function click(which) {
        move();
        window.dmousedown(mouse(which));
        window.dmouseup(mouse(which));
    }

    function grab() {
        move();
        window.dmousedown(mouse(1));
        dragging = true;
    }

    function drop() {
        if (!dragging) return;
        dragging = false;
        window.dmouseup(mouse(1));
    }

    function wheel(dir) {
        var m = mouse();
        m.wheelDelta = dir * 120;
        window.dmousewheel(m);
    }

    // ---------- Gestos ----------
    function isDesk(t) { return t === $('Desk') || t === $('DeskFocus') || t === $('DeskParent') || t === $('deskarea3x'); }

    function stopHold() { if (g && g.hold) { clearTimeout(g.hold); g.hold = null; } }

    function clearTap() { if (!tapTimer) return false; clearTimeout(tapTimer); tapTimer = null; return true; }

    function midY(e) { var s = 0; for (var i = 0; i < e.touches.length; i++) s += e.touches[i].clientY; return s / e.touches.length; }

    function startScroll(e) {
        stopHold();
        clearTap();
        drop();
        if (mode === 'toque') place((e.touches[0].clientX + e.touches[1].clientX) / 2, midY(e));
        g = { scroll: true, y: midY(e), n: e.touches.length, acc: 0 };
    }

    function onScroll(e) {
        var y = midY(e);
        if (e.touches.length === g.n) g.acc += y - g.y;
        g.y = y;
        g.n = e.touches.length;
        while (Math.abs(g.acc) >= WHEEL_PX) {
            var dir = g.acc > 0 ? 1 : -1; // os dedos descem, o conteúdo desce: roda para cima
            g.acc -= dir * WHEEL_PX;
            wheel(dir);
        }
    }

    function onHold() {
        g.hold = null;
        if (g.second) { grab(); return; } // tocou duas vezes e segurou: pronto para arrastar
        g.done = true;
        click(3);
        if (navigator.vibrate) navigator.vibrate(12);
    }

    function onStart(e) {
        if (!isDesk(e.target) || !active()) return;
        e.preventDefault();
        touched = true;
        if (e.touches.length > 1) { startScroll(e); return; }
        var t = e.touches[0];
        if (mode === 'toque') {
            var b = bounds();
            if (t.clientX < b.l || t.clientX >= b.r || t.clientY < b.t || t.clientY >= b.b) return; // fora da imagem
            place(t.clientX, t.clientY);
        }
        g = { sx: t.clientX, sy: t.clientY, lx: t.clientX, ly: t.clientY, lt: e.timeStamp, second: clearTap() };
        g.hold = setTimeout(onHold, HOLD_MS);
    }

    function onMove(e) {
        if (!g) return;
        e.preventDefault();
        if (g.scroll) { onScroll(e); return; }
        if (g.done) return;
        var t = e.touches[0];
        if (!g.moved) {
            if (Math.abs(t.clientX - g.sx) + Math.abs(t.clientY - g.sy) < SLOP) return;
            g.moved = true;
            stopHold();
            g.lx = t.clientX;
            g.ly = t.clientY;
            g.lt = e.timeStamp;
            if (!dragging && (mode === 'toque' || g.second)) grab();
        }
        if (mode === 'toque') {
            place(t.clientX, t.clientY);
        } else {
            // Devagar o ponteiro anda menos que o dedo, para mirar; rápido, anda mais.
            var dx = t.clientX - g.lx, dy = t.clientY - g.ly;
            var k = Math.min(2.4, 0.8 + Math.sqrt(dx * dx + dy * dy) / Math.max(8, e.timeStamp - g.lt));
            place(ptr.x + dx * k, ptr.y + dy * k);
            g.lx = t.clientX;
            g.ly = t.clientY;
            g.lt = e.timeStamp;
        }
        move();
    }

    function onEnd(e) {
        if (!g) return;
        e.preventDefault();
        if (e.touches.length) return;
        var d = g;
        stopHold();
        g = null;
        if (d.scroll || d.done) return;
        if (dragging) { drop(); return; }
        if (d.moved) return;
        if (mode === 'toque') { click(1); return; }
        if (d.second) { click(1); click(1); return; }
        // O clique espera um instante: se vier outro toque, é duplo clique ou arrastar.
        tapTimer = setTimeout(function () { tapTimer = null; click(1); }, TAP_MS);
    }

    function cancelGesture() {
        stopHold();
        clearTap();
        g = null;
        drop();
    }

    // ---------- Teclado do aparelho ----------
    // O texto chega por diferença com o que já foi enviado: os teclados de celular
    // reescrevem a palavra inteira a cada letra e o corretor troca o que foi digitado.
    var kbSent = KB_REST, kbComposing = false;

    function canType() { var d = window.desktop; return !!(d && d.m && d.m.SendStringUnicode && d.m.SendKeyMsgKC); }

    function pressKey(kc, ext) {
        var m = window.desktop.m;
        m.SendKeyMsgKC(1, kc, ext);
        m.SendKeyMsgKC(2, kc, ext);
    }

    function kbRest() {
        kb.value = kbSent = KB_REST;
        kb.setSelectionRange(1, 1);
    }

    function onKbInput() {
        var v = kb.value, i = 0;
        if (active() && canType()) {
            while (i < kbSent.length && i < v.length && kbSent.charAt(i) === v.charAt(i)) i++;
            for (var n = kbSent.length - i; n > 0; n--) pressKey(8);
            if (i < v.length) window.desktop.m.SendStringUnicode(v.slice(i));
            if (has('setSessionActivity')) window.setSessionActivity();
        }
        kbSent = v;
        if (!kbComposing) kbRest();
    }

    // Sem isto a página também trataria a tecla, e cada uma sairia duas vezes.
    function onKbKey(e) {
        e.stopPropagation();
        if (e.type !== 'keydown' || !(e.keyCode in KB_KEYS) || !canType()) return;
        e.preventDefault();
        pressKey(e.keyCode, !!KB_KEYS[e.keyCode]);
    }

    function toggleKeyboard() {
        if (document.activeElement === kb) { kb.blur(); return; }
        if (!canType()) { toast('O teclado não está disponível nesta conexão'); return; }
        kb.focus();
        kbRest();
    }

    function buildKeyboard() {
        kb = el('input', 'orb-softkey');
        kb.type = 'text';
        kb.tabIndex = -1;
        kb.setAttribute('aria-hidden', 'true');
        kb.setAttribute('inputmode', 'text');
        ['autocapitalize', 'autocomplete', 'autocorrect'].forEach(function (a) { kb.setAttribute(a, 'off'); });
        kb.spellcheck = false;
        kb.addEventListener('input', onKbInput);
        kb.addEventListener('keydown', onKbKey);
        kb.addEventListener('keypress', onKbKey);
        kb.addEventListener('keyup', onKbKey);
        kb.addEventListener('compositionstart', function () { kbComposing = true; });
        kb.addEventListener('compositionend', function () { kbComposing = false; setTimeout(kbRest, 0); });
        kb.addEventListener('focus', function () { kit.querySelector('[data-a="keyboard"]').classList.add('on'); });
        kb.addEventListener('blur', function () { kit.querySelector('[data-a="keyboard"]').classList.remove('on'); });
        document.body.appendChild(kb);
    }

    // ---------- Botão flutuante ----------
    var kitDrag = null, kitMoved = false, kitPos = null;

    function placeKit(x, y) {
        var r = kit.getBoundingClientRect();
        kit.style.left = clamp(x, 6, window.innerWidth - r.width - 6) + 'px';
        kit.style.top = clamp(y, 6, window.innerHeight - r.height - 6) + 'px';
        kit.style.right = 'auto';
    }

    function restoreKit() { if (kitPos && shown) placeKit(kitPos[0] * window.innerWidth, kitPos[1] * window.innerHeight); }

    function onKitStart(e) {
        var t = e.touches[0], r = kit.getBoundingClientRect();
        kitDrag = { x: t.clientX, y: t.clientY, l: r.left, t: r.top };
        kitMoved = false;
    }

    function onKitMove(e) {
        if (!kitDrag) return;
        e.preventDefault();
        var t = e.touches[0], dx = t.clientX - kitDrag.x, dy = t.clientY - kitDrag.y;
        if (!kitMoved && Math.abs(dx) + Math.abs(dy) < SLOP) return;
        kitMoved = true;
        placeKit(kitDrag.l + dx, kitDrag.t + dy);
    }

    function onKitEnd() {
        kitDrag = null;
        if (!kitMoved) return;
        var r = kit.getBoundingClientRect();
        kitPos = [r.left / window.innerWidth, r.top / window.innerHeight];
        save('orbTouchKit', kitPos.join(','));
    }

    function onKitClick(e) {
        var b = e.target.closest('button');
        if (!b || kitMoved) { kitMoved = false; return; }
        if (b.getAttribute('data-a') === 'keyboard') { toggleKeyboard(); return; }
        cancelGesture();
        mode = mode === 'ponteiro' ? 'toque' : 'ponteiro';
        save('orbTouchMode', mode);
        paintMode();
        toast(mode === 'ponteiro' ? 'Modo ponteiro: deslize para mover, toque para clicar' : 'Modo toque: o clique sai onde você tocar');
    }

    function paintMode() {
        var b = kit.querySelector('[data-a="mode"]'), pointer = mode === 'ponteiro';
        b.innerHTML = ic(pointer ? ICON.pointer : ICON.hand);
        b.title = pointer ? 'Modo ponteiro (trocar para toque)' : 'Modo toque (trocar para ponteiro)';
        b.setAttribute('aria-label', b.title);
        ptrEl.hidden = !shown || !pointer;
    }

    function buildKit() {
        kit = el('div', 'orb-tk',
            '<button type="button" data-a="keyboard" title="Teclado" aria-label="Teclado">' + ic(ICON.keyboard) + '</button>' +
            '<button type="button" data-a="mode"></button>');
        kit.hidden = true;
        kit.addEventListener('mousedown', function (e) { e.preventDefault(); }); // o toque no botão não fecha o teclado
        kit.addEventListener('touchstart', onKitStart, { passive: true });
        kit.addEventListener('touchmove', onKitMove, { passive: false });
        kit.addEventListener('touchend', onKitEnd);
        kit.addEventListener('click', onKitClick);
        document.body.appendChild(kit);
        var p = String(load('orbTouchKit', '')).split(',').map(parseFloat);
        if (p.length === 2 && !isNaN(p[0]) && !isNaN(p[1])) kitPos = p;
    }

    // ---------- Liga e desliga com a sessão ----------
    function sync() {
        var on = active();
        if (on !== shown) {
            shown = on;
            root.classList.toggle('orb-touchdesk', on);
            kit.hidden = !on;
            paintMode();
            restoreKit();
            if (!on) { cancelGesture(); kb.blur(); touched = false; }
        }
        if (!on) return;
        if (touched) place(ptr.x, ptr.y); else center(); // a tela remota muda de tamanho ao conectar
    }

    function init() {
        var area = $('deskarea3x');
        if (!area) return;
        ptrEl = el('div', 'orb-ptr', '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON.pointer + '</svg>');
        ptrEl.hidden = true;
        document.body.appendChild(ptrEl);
        buildKit();
        buildKeyboard();
        paintMode();
        var opts = { capture: true, passive: false };
        area.addEventListener('touchstart', onStart, opts);
        area.addEventListener('touchmove', onMove, opts);
        area.addEventListener('touchend', onEnd, opts);
        area.addEventListener('touchcancel', cancelGesture, opts);
        window.addEventListener('resize', restoreKit);
        setInterval(sync, 400);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
