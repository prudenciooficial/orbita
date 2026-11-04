/* ==========================================================================
   ÓRBITA — camada de interface para o MeshCentral
   - Aplica a classe "orb" (que liga o tema do custom.css).
   - Acrescenta marca, busca global (Ctrl+K), ações rápidas nos cartões,
     resumo de dispositivos e barra de status.
   Só usa funções públicas da própria página (go, gotoDevice, setNightMode...)
   e tudo roda dentro de try/catch: se algo falhar, a interface original segue
   funcionando normalmente.
   ========================================================================== */
(function () {
    'use strict';

    // Nome e subtítulo da marca. Trocar aqui muda o painel e o login.
    var BRAND = { name: 'Órbita', tagline: 'Central de acesso remoto' };

    // Só as páginas servidas na raiz do domínio (painel e login) recebem o tema.
    // Janelas auxiliares (terminal avulso, compartilhamento, player...) ficam como estão.
    if (!/\/$/.test(window.location.pathname)) return;
    var root = document.documentElement;
    root.classList.add('orb');

    // ---------- Versão: o Safari do iPhone pode ficar com scripts antigos ----------
    // Mesmo com max-age=0 ele reaproveita o que guardou, sem perguntar ao servidor.
    // O construir.sh grava a mesma versão aqui e em orbita/versao.txt: se elas
    // diferem, esta cópia está velha. Os arquivos são baixados de novo e a página
    // recarrega, uma vez por aba, para não entrar em laço se a troca não pegar.
    var VERSION = 'b422eba100f9';
    var VERSION_FILES = ['scripts/custom.js', 'scripts/orbita-files.js', 'scripts/orbita-touch.js', 'styles/custom.css'];
    root.setAttribute('data-orb-version', VERSION);

    function checkVersion() {
        if (!window.fetch) return;
        fetch('orbita/versao.txt?t=' + Date.now(), { cache: 'no-store' }).then(function (r) {
            return r.ok ? r.text() : '';
        }).then(function (text) {
            var latest = text.trim();
            if (!latest || latest === VERSION || sessionStorage.getItem('orbVersion') === latest) return;
            return Promise.all(VERSION_FILES.map(function (f) { return fetch(f, { cache: 'reload' }); })).then(function () {
                sessionStorage.setItem('orbVersion', latest);
                // Logo depois do login a página veio de um POST: sem isto, recarregar reenviaria o formulário.
                history.replaceState(history.state, '', location.href);
                location.reload();
            });
        }).catch(function () { });
    }

    var isMac =/Mac|iPhone|iPad/.test(navigator.platform || '');
    var MOD = isMac ? '⌘' : 'Ctrl';

    var ICON = {
        search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
        desktop: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
        terminal: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="m7 9 3 3-3 3"/><path d="M12.5 15H17"/>',
        files: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
        info: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
        sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
        moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
        logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
        devices: '<path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8"/><path d="M10 19v-4"/><path d="M7 19h5"/><rect x="16" y="11" width="6" height="10" rx="1.6"/>',
        account: '<circle cx="12" cy="8" r="4.2"/><path d="M20 21a8 8 0 0 0-16 0"/>',
        events: '<path d="M22 12h-4l-3 8L9 4l-3 8H2"/>',
        users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        server: '<rect x="2" y="3" width="20" height="7.5" rx="2"/><rect x="2" y="13.5" width="20" height="7.5" rx="2"/><path d="M6 6.75h.01"/><path d="M6 17.25h.01"/>',
        notes: '<path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/>',
        expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
        theme: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor"/>',
        close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
        arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'
    };
    var DEV_ICON = {
        1: ICON.desktop,
        2: '<path d="M4.5 5h15A1.5 1.5 0 0 1 21 6.5V16H3V6.5A1.5 1.5 0 0 1 4.5 5Z"/><path d="M1.5 19.5h21"/>',
        3: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
        4: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 6h6"/><path d="M9 10h6"/><path d="M12 17h.01"/>',
        5: '<path d="M22 12H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
        6: '<rect x="2" y="14" width="20" height="8" rx="2"/><path d="M15 10v4"/><path d="M17.84 7.17a4 4 0 0 0-5.66 0"/><path d="M20.66 4.34a8 8 0 0 0-11.31 0"/>',
        7: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/>',
        8: '<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/>'
    };

    function ic(name, raw) {
        var body = raw || ICON[name] || '';
        return '<svg class="orb-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
    }

    // Marca: planeta com anel inclinado e um satélite que percorre a órbita devagar.
    function brandMark(id, animate) {
        var still = !animate || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        var ring = 'M4.8,16 A11.2,3.7 0 0 1 27.2,16', front = 'M4.8,16 A11.2,3.7 0 0 0 27.2,16';
        var sat = still ? '<circle cx="4.97" cy="16.64" r="1.7" fill="#fff"/>' :
            '<circle r="1.7" fill="#fff"><animateMotion dur="18s" repeatCount="indefinite" path="M4.8,16 A11.2,3.7 0 1 0 27.2,16 A11.2,3.7 0 1 0 4.8,16"/></circle>';
        return '<svg class="orb-brand-mark" viewBox="0 0 32 32" aria-hidden="true"><defs>' +
            '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8c7bff"/><stop offset=".5" stop-color="#5b4cf0"/><stop offset="1" stop-color="#22b8ec"/></linearGradient>' +
            '<linearGradient id="' + id + 'c" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse" gradientTransform="rotate(24 16 16)"><stop offset="0" stop-color="#8c7bff"/><stop offset=".5" stop-color="#5b4cf0"/><stop offset="1" stop-color="#22b8ec"/></linearGradient>' +
            '<linearGradient id="' + id + 'p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d9d4ff"/></linearGradient></defs>' +
            '<rect width="32" height="32" rx="9.5" fill="url(#' + id + 'g)"/>' +
            '<g transform="rotate(-24 16 16)"><path d="' + ring + '" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"/></g>' +
            '<circle cx="16" cy="16" r="5.6" fill="url(#' + id + 'p)"/>' +
            '<g transform="rotate(-24 16 16)"><path d="' + front + '" fill="none" stroke="url(#' + id + 'c)" stroke-width="3.6"/>' +
            '<path d="' + front + '" fill="none" stroke="#fff" stroke-width="1.45" stroke-linecap="round"/>' + sat + '</g></svg>';
    }

    function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
    function $(id) { return document.getElementById(id); }
    function safe(fn) { try { return fn(); } catch (ex) { if (window.console) console.warn('[orbita]', ex); } }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function visible(e) { return !!(e && e.offsetParent !== null && getComputedStyle(e).display !== 'none'); }
    function has(name) { return typeof window[name] === 'function'; }
    function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

    // ---------- Título da aba ----------
    function fixTitle() {
        var t = document.title;
        if (t && t.indexOf('MeshCentral') >= 0) { document.title = t.split('MeshCentral').join(BRAND.name); }
    }
    function renameTitle() {
        fixTitle();
        // No painel o <title> fica fora do <head>, por isso a busca é no documento todo.
        var t = document.querySelector('title');
        if (t && window.MutationObserver) { new MutationObserver(fixTitle).observe(t, { childList: true, characterData: true, subtree: true }); }
    }

    // ---------- Login ----------
    function initLogin() {
        var cell = $('logincell');
        if (!cell || cell.querySelector('.orb-login-brand')) return;
        var b = el('div', 'orb-login-brand', brandMark('orbLoginGrad', true) +
            '<div class="orb-login-title">' + esc(BRAND.name) + '</div><div class="orb-login-sub">' + esc(BRAND.tagline) + '</div>');
        var panel = $('loginpanel');
        cell.insertBefore(b, panel || cell.firstChild);
        safe(function () { var u = $('username'); if (u && !u.value && visible(u)) u.focus(); });
    }

    // ---------- Painel ----------
    var state = { view: 0 };

    function viewNow() { return (typeof window.xxcurrentView === 'number') ? window.xxcurrentView : -1; }

    function shortLabel(t) {
        t = String(t || '').replace(/^(Meus|Minhas|Meu|Minha|My|Mis|Mes|Mon|Ma)\s+/i, '');
        return t.charAt(0).toUpperCase() + t.slice(1);
    }

    function buildHeader() {
        var mh = $('masthead');
        if (!mh || mh.querySelector('.orb-brand')) return;

        var brand = el('div', 'orb-brand', brandMark('orbHeadGrad') +
            '<div class="orb-brand-text"><span class="orb-brand-name">' + esc(BRAND.name) + '</span><span class="orb-brand-sub">' + esc(BRAND.tagline) + '</span></div>');
        brand.title = 'Início';
        brand.addEventListener('click', function () { safe(function () { window.go(1); }); });
        mh.insertBefore(brand, mh.firstChild);

        var search = el('button', 'orb-search', ic('search') + '<span class="orb-search-label">Buscar dispositivo ou ação…</span><span class="orb-kbd">' + MOD + ' K</span>');
        search.type = 'button';
        search.title = 'Busca rápida (' + MOD + '+K)';
        search.addEventListener('click', function () { openPalette(''); });
        mh.appendChild(search);

        var actions = el('div', 'orb-actions');
        var theme = el('button', 'orb-iconbtn', ic('moon').replace('orb-ico', 'orb-ico orb-theme-moon') + ic('sun').replace('orb-ico', 'orb-ico orb-theme-sun'));
        theme.type = 'button';
        theme.title = 'Alternar tema claro/escuro';
        theme.addEventListener('click', toggleTheme);
        actions.appendChild(theme);
        mh.appendChild(actions);
    }

    function buildUserChip() {
        var mh = $('masthead');
        if (!mh || mh.querySelector('.orb-user')) return;
        var lc = window.logoutControls || {};
        var name = lc.name || (window.userinfo && window.userinfo.name) || '';
        if (!name) return;
        var initials = name.replace(/[^A-Za-zÀ-ÿ0-9 ._-]/g, '').split(/[ ._-]+/).filter(Boolean).slice(0, 2).map(function (p) { return p.charAt(0); }).join('').toUpperCase() || name.charAt(0).toUpperCase();
        var chip = el('div', 'orb-user', '<span class="orb-avatar">' + esc(initials) + '</span><span class="orb-user-name">' + esc(name) + '</span>');
        chip.title = 'Minha conta';
        chip.addEventListener('click', function () { safe(function () { window.go(2); }); });
        var link = document.querySelector('#logoutControlSpan a');
        if (link) {
            var out = el('button', 'orb-iconbtn', ic('logout'));
            out.type = 'button';
            out.title = link.textContent || 'Sair';
            out.addEventListener('click', function (e) { e.stopPropagation(); link.click(); });
            chip.appendChild(out);
        }
        mh.appendChild(chip);
        root.classList.add('orb-user-ready');
    }

    function labelRail() {
        var btns = document.querySelectorAll('#page_leftbar .lbbutton');
        for (var i = 0; i < btns.length; i++) { btns[i].setAttribute('data-orb-label', shortLabel(btns[i].getAttribute('title'))); }
    }

    function toggleTheme() {
        safe(function () {
            var dark = document.body.classList.contains('night');
            if (has('putstore')) { window.putstore('nightMode', dark ? '2' : '1'); } else { localStorage.setItem('nightMode', dark ? '2' : '1'); }
            if (has('setNightMode')) window.setNightMode();
            toast(dark ? 'Tema claro' : 'Tema escuro');
        });
    }

    // ---------- Barra de status e resumo ----------
    var crumb, sbConn, sbDevices;

    function buildStatus() {
        var footer = $('footer');
        if (footer && !footer.querySelector('.orb-statusbar')) {
            var bar = el('div', 'orb-statusbar',
                '<span class="orb-sb-item" data-k="conn"><span class="orb-dot on"></span><span>Conectado</span></span>' +
                '<span class="orb-sb-sep"></span>' +
                '<span class="orb-sb-item" data-k="devs"></span>' +
                '<span class="orb-sb-spacer"></span>' +
                '<span class="orb-sb-item"><span class="orb-kbd">' + MOD + ' K</span> busca rápida</span>' +
                '<span class="orb-sb-sep"></span>');
            var kids = [].slice.call(footer.children);
            for (var i = 0; i < kids.length; i++) bar.appendChild(kids[i]);
            footer.appendChild(bar);
            sbConn = bar.querySelector('[data-k="conn"]');
            sbDevices = bar.querySelector('[data-k="devs"]');
        }
        var dummy = $('UserDummyMenuSpan');
        if (dummy && !dummy.querySelector('.orb-crumb')) {
            crumb = el('div', 'orb-crumb');
            dummy.appendChild(crumb);
        }
    }

    function deviceStats() {
        var list = window.nodes, total = 0, on = 0;
        if (list && list.length) {
            total = list.length;
            for (var i = 0; i < list.length; i++) { if (list[i] && list[i].conn) on++; }
        }
        return { total: total, on: on, off: total - on };
    }

    function updateStatus() {
        var s = deviceStats();
        if (sbDevices) {
            sbDevices.innerHTML = '<b>' + s.total + '</b> dispositivos <span class="orb-dot on" style="margin-left:6px"></span><b>' + s.on + '</b> online';
        }
        if (sbConn) {
            var p0 = $('p0'), down = p0 && p0.style.display !== 'none';
            sbConn.innerHTML = down ? '<span class="orb-dot warn"></span><span>Desconectado do servidor</span>' : '<span class="orb-dot on"></span><span>Conectado</span>';
        }
        if (crumb) {
            var v = viewNow();
            // Se a página já tem abas próprias nesta linha, o resumo some.
            var tabs = ['MainSubMenuSpan', 'MeshSubMenuSpan', 'EventsSubMenuSpan', 'UserSubMenuSpan', 'UsersSubMenuSpan', 'ServerSubMenuSpan'].some(function (id) { var e = $(id); return e && e.style.display !== 'none'; });
            if (tabs) { crumb.innerHTML = ''; return; }
            if (v === 1) {
                crumb.innerHTML = '<span class="orb-chip"><span class="orb-dot on"></span><b>' + s.on + '</b> online</span>' +
                    '<span class="orb-chip"><span class="orb-dot"></span><b>' + s.off + '</b> offline</span>' +
                    '<span class="orb-chip"><b>' + s.total + '</b> no total</span>';
            } else {
                var sel = document.querySelector('#page_leftbar .lbbuttonsel, #page_leftbar .lbbuttonsel2');
                crumb.innerHTML = sel ? '<span>' + esc(BRAND.name) + '</span><span style="opacity:.5">/</span><span style="color:var(--orb-text-2);font-weight:550">' + esc(sel.getAttribute('data-orb-label') || '') + '</span>' : '';
            }
        }
    }

    // ---------- Dispositivo atual na barra de abas ----------
    var devctx;

    function buildDevCtx() {
        var host = document.querySelector('#topbar > div > div');
        if (!host || host.querySelector('.orb-devctx')) return;
        devctx = el('div', 'orb-devctx');
        host.appendChild(devctx);
        devctx.addEventListener('click', function (e) {
            if (!e.target.closest('[data-orb-full]')) return;
            e.preventDefault();
            // Desktop/terminal ocupando a página inteira + tela cheia do navegador (Esc sai).
            safe(function () { window.deskToggleFull({ shiftKey: true }); });
        });
    }

    function updateDevCtx() {
        if (!devctx) return;
        var v = viewNow(), n = window.currentNode;
        if (!(v >= 9 && v < 20) || !n) { devctx.innerHTML = ''; return; }
        var on = !!n.conn;
        devctx.innerHTML = '<span class="orb-dot' + (on ? ' on' : '') + '"></span><b>' + esc(n.name) + '</b>' +
            (meshName(n) ? '<span class="orb-devctx-mesh">' + esc(meshName(n)) + '</span>' : '') +
            ((v === 11 || v === 12) ? '<button type="button" class="orb-full" data-orb-full title="Tela cheia (Esc para sair)">' + ic('expand') + '<span>Tela cheia</span></button>' : '');
    }

    // ---------- Ações rápidas nos cartões ----------
    function nodeIdFromCard(card) {
        var id = card.id || '', k = id.indexOf('node/');
        return k >= 0 ? id.substring(k) : null;
    }

    function getNode(id) { return has('getNodeFromId') ? window.getNodeFromId(id) : null; }

    function decorateDevices() {
        var cards = document.querySelectorAll('#xdevices div[name^="xxdevice"]');
        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            if (card.querySelector(':scope > .orb-qa')) continue;
            var nid = nodeIdFromCard(card), node = nid && getNode(nid);
            if (!node || !node.agent || !(node.conn & 1)) continue;
            var caps = node.agent.caps || 0, html = '';
            if (caps & 1) html += '<button type="button" class="orb-qa-btn" data-t="desktop" title="Área de trabalho remota">' + ic('desktop') + '</button>';
            if (caps & 2) html += '<button type="button" class="orb-qa-btn" data-t="terminal" title="Terminal">' + ic('terminal') + '</button>';
            if (caps & 4) html += '<button type="button" class="orb-qa-btn" data-t="files" title="Arquivos">' + ic('files') + '</button>';
            if (!html) continue;
            var qa = el('div', 'orb-qa', html);
            qa.setAttribute('data-node', nid);
            card.appendChild(qa);
        }
    }

    // A lista é redesenhada pelo MeshCentral a cada atualização dos agentes, então o
    // botão pressionado pode ser substituído antes de o clique terminar. Por isso a
    // ação é registrada no mousedown e executada no mouseup, onde quer que ele caia.
    var qaDown = null;

    function qaTarget(e) {
        var btn = e.target && e.target.closest && e.target.closest('.orb-qa-btn');
        return btn ? { nid: btn.parentNode.getAttribute('data-node'), tool: btn.getAttribute('data-t') } : null;
    }

    function onQaDown(e) {
        var t = qaTarget(e);
        if (!t) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.button === 0) { qaDown = t; qaDown.at = Date.now(); }
    }

    function onQaUp(e) {
        if (!qaDown) return;
        var t = qaDown;
        qaDown = null;
        // Impede que o cartão redesenhado embaixo do ponteiro receba este mouseup.
        e.preventDefault();
        e.stopPropagation();
        if (Date.now() - t.at < 2000) openTool(t.nid, t.tool);
    }

    function onQaClick(e) {
        var t = qaTarget(e);
        if (!t) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.detail === 0) openTool(t.nid, t.tool); // ativado pelo teclado
    }

    var TOOL = {
        general: { panel: 10 },
        desktop: { panel: 11, tab: 'MainDevDesktop', btn: 'connectbutton1' },
        terminal: { panel: 12, tab: 'MainDevTerminal', btn: 'connectbutton2' },
        files: { panel: 13, tab: 'MainDevFiles', btn: 'p13Connect' }
    };

    // Abre o dispositivo já na ferramenta pedida e conecta, se o botão "Conectar" estiver disponível.
    function openTool(nid, tool) {
        var t = TOOL[tool] || TOOL.general;
        safe(function () {
            window.gotoDevice(nid, 10);
            if (t.tab) {
                var tab = $(t.tab);
                if (!tab || tab.style.display === 'none') { toast('Ferramenta indisponível para este dispositivo'); return; }
                window.go(t.panel);
            }
            if (t.btn) {
                setTimeout(function () {
                    safe(function () {
                        var b = $(t.btn);
                        if (viewNow() === t.panel && b && !b.disabled && visible(b)) b.click();
                    });
                }, 260);
            }
        });
    }

    // ---------- Ícone grande do dispositivo ----------
    function syncHero() {
        var img = $('MainComputerImage');
        if (!img) return;
        var hero = img.parentNode.querySelector('.orb-hero');
        if (!hero) { hero = el('span', 'orb-hero'); img.parentNode.insertBefore(hero, img); }
        var m = /icons256-(\d+)-/.exec(img.getAttribute('src') || '');
        var n = m ? m[1] : '1';
        if (!DEV_ICON[n]) { hero.style.display = 'none'; img.style.setProperty('display', 'inline', 'important'); return; }
        hero.style.display = '';
        img.style.removeProperty('display');
        hero.setAttribute('data-icon', n);
        hero.classList.toggle('off', img.classList.contains('gray'));
    }

    // ---------- Paleta de comandos ----------
    var pal = null, palInput, palList, palItems = [], palIndex = 0;

    function commands() {
        var list = [];
        var add = function (id, title, icon, run, meta) { list.push({ kind: 'cmd', id: id, title: title, icon: icon, run: run, meta: meta || '' }); };
        var railVisible = function (id) { var e = $(id); return e && e.style.display !== 'none'; };
        add('devices', 'Meus dispositivos', 'devices', function () { window.go(1); }, 'Ir para');
        if (railVisible('LeftMenuMyAccount')) add('account', 'Minha conta', 'account', function () { window.go(2); }, 'Ir para');
        if (railVisible('LeftMenuMyEvents')) add('events', 'Eventos', 'events', function () { window.go(3); }, 'Ir para');
        if (railVisible('LeftMenuMyFiles')) add('files', 'Meus arquivos', 'files', function () { window.go(5); }, 'Ir para');
        if (railVisible('LeftMenuMyUsers')) add('users', 'Usuários', 'users', function () { window.go(4); }, 'Ir para');
        if (railVisible('LeftMenuMyServer')) add('server', 'Servidor', 'server', function () { window.go(6); }, 'Ir para');
        add('theme', 'Alternar tema claro/escuro', 'theme', toggleTheme, 'Aparência');
        if (has('showNotes')) add('notes', 'Notas pessoais', 'notes', function () { window.showNotes(false); }, 'Ferramenta');
        if (has('toggleBrowserFullscreen')) add('full', 'Tela cheia do navegador', 'expand', function () { window.toggleBrowserFullscreen(); }, 'Ferramenta');
        var out = document.querySelector('#logoutControlSpan a');
        if (out) add('logout', 'Sair', 'logout', function () { out.click(); }, 'Sessão');
        return list;
    }

    function meshName(n) { var m = window.meshes && window.meshes[n.meshid]; return m ? m.name : ''; }

    function highlight(text, q) {
        if (!q) return esc(text);
        var i = norm(text).indexOf(q);
        if (i < 0) return esc(text);
        return esc(text.substring(0, i)) + '<mark>' + esc(text.substring(i, i + q.length)) + '</mark>' + esc(text.substring(i + q.length));
    }

    function searchAll(qRaw) {
        var q = norm(qRaw.trim()), out = [];
        var list = window.nodes || [];
        var devs = [];
        for (var i = 0; i < list.length; i++) {
            var n = list[i];
            if (!n || !n.name) continue;
            var hay = norm([n.name, n.rname, n.host, meshName(n), n.osdesc, n.ip, (n.tags || []).join(' ')].join(' '));
            if (q && hay.indexOf(q) < 0) continue;
            var score = (n.conn ? 0 : 1000) + (q ? (norm(n.name).indexOf(q) === 0 ? 0 : 100) : 0);
            devs.push({ n: n, s: score });
        }
        devs.sort(function (a, b) { return (a.s - b.s) || String(a.n.name).localeCompare(String(b.n.name)); });
        devs = devs.slice(0, q ? 30 : 8);
        for (var j = 0; j < devs.length; j++) out.push({ kind: 'dev', node: devs[j].n });
        var cmds = commands().filter(function (c) { return !q || norm(c.title).indexOf(q) >= 0 || norm(c.meta).indexOf(q) >= 0; });
        return { devs: out, cmds: cmds, q: q };
    }

    function renderPalette() {
        var r = searchAll(palInput.value), html = '', idx = 0;
        palItems = [];
        if (r.devs.length) {
            html += '<div class="orb-cmdk-group">Dispositivos' + (r.q ? '' : ' · online primeiro') + '</div>';
            r.devs.forEach(function (d) {
                var n = d.node, on = !!(n.conn & 1), caps = (n.agent && n.agent.caps) || 0;
                var meta = [meshName(n), n.osdesc, on ? 'online' : 'offline'].filter(Boolean).join(' · ');
                var acts = '';
                if (on && (caps & 1)) acts += '<button type="button" class="orb-cmd-act" data-tool="desktop" title="Área de trabalho (Shift+Enter)">' + ic('desktop') + 'Desktop</button>';
                if (on && (caps & 2)) acts += '<button type="button" class="orb-cmd-act" data-tool="terminal" title="Terminal (Ctrl+Enter)">' + ic('terminal') + '</button>';
                if (on && (caps & 4)) acts += '<button type="button" class="orb-cmd-act" data-tool="files" title="Arquivos (Alt+Enter)">' + ic('files') + '</button>';
                html += '<div class="orb-cmdk-item" data-i="' + idx + '"><span class="orb-cmdk-icon dev' + (on ? '' : ' off') + '">' + ic(null, DEV_ICON[n.icon] || DEV_ICON[1]) + '</span>' +
                    '<span class="orb-cmdk-text"><div class="orb-cmdk-title">' + highlight(n.name, r.q) + '</div><div class="orb-cmdk-meta">' + esc(meta) + '</div></span>' +
                    '<span class="orb-cmdk-acts">' + acts + '</span></div>';
                palItems.push({ kind: 'dev', node: n });
                idx++;
            });
        }
        if (r.cmds.length) {
            html += '<div class="orb-cmdk-group">Navegação e ações</div>';
            r.cmds.forEach(function (c) {
                html += '<div class="orb-cmdk-item" data-i="' + idx + '"><span class="orb-cmdk-icon">' + ic(c.icon) + '</span>' +
                    '<span class="orb-cmdk-text"><div class="orb-cmdk-title">' + highlight(c.title, r.q) + '</div><div class="orb-cmdk-meta">' + esc(c.meta) + '</div></span>' +
                    '<span class="orb-cmdk-acts" style="color:var(--orb-faint)">' + ic('arrow') + '</span></div>';
                palItems.push(c);
                idx++;
            });
        }
        if (!idx) html = '<div class="orb-cmdk-empty">Nada encontrado para “' + esc(palInput.value) + '”.</div>';
        palList.innerHTML = html;
        palIndex = Math.min(palIndex, Math.max(0, idx - 1));
        markActive(false);
    }

    function markActive(scroll) {
        var rows = palList.querySelectorAll('.orb-cmdk-item');
        for (var i = 0; i < rows.length; i++) rows[i].classList.toggle('active', i === palIndex);
        if (scroll && rows[palIndex]) rows[palIndex].scrollIntoView({ block: 'nearest' });
    }

    function runItem(i, tool) {
        var it = palItems[i];
        if (!it) return;
        closePalette();
        if (it.kind === 'dev') { openTool(it.node._id, tool || 'general'); }
        else safe(it.run);
    }

    function buildPalette() {
        pal = el('div', 'orb-cmdk',
            '<div class="orb-cmdk-panel" role="dialog" aria-label="Busca rápida">' +
            '<div class="orb-cmdk-head">' + ic('search') + '<input class="orb-cmdk-input" type="text" autocomplete="off" spellcheck="false" placeholder="Buscar dispositivos, grupos, sistemas ou ações…" /><span class="orb-kbd">Esc</span></div>' +
            '<div class="orb-cmdk-list"></div>' +
            '<div class="orb-cmdk-foot"><span><span class="orb-kbd">↑</span><span class="orb-kbd">↓</span> navegar</span><span><span class="orb-kbd">Enter</span> abrir</span>' +
            '<span><span class="orb-kbd">Shift ↵</span> desktop</span><span><span class="orb-kbd">Ctrl ↵</span> terminal</span><span><span class="orb-kbd">Alt ↵</span> arquivos</span></div>' +
            '</div>');
        pal.hidden = true;
        document.body.appendChild(pal);
        palInput = pal.querySelector('.orb-cmdk-input');
        palList = pal.querySelector('.orb-cmdk-list');
        pal.addEventListener('mousedown', function (e) { if (e.target === pal) closePalette(); });
        palInput.addEventListener('input', function () { palIndex = 0; renderPalette(); });
        palInput.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown') { e.preventDefault(); palIndex = Math.min(palIndex + 1, palItems.length - 1); markActive(true); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); palIndex = Math.max(palIndex - 1, 0); markActive(true); }
            else if (e.key === 'Enter') {
                e.preventDefault();
                var tool = e.shiftKey ? 'desktop' : (e.ctrlKey || e.metaKey) ? 'terminal' : e.altKey ? 'files' : null;
                runItem(palIndex, tool);
            }
            else if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
            e.stopPropagation();
        });
        palInput.addEventListener('keyup', function (e) { e.stopPropagation(); });
        palInput.addEventListener('keypress', function (e) { e.stopPropagation(); });
        palList.addEventListener('mousemove', function (e) {
            var row = e.target.closest('.orb-cmdk-item');
            if (row) { var i = +row.getAttribute('data-i'); if (i !== palIndex) { palIndex = i; markActive(false); } }
        });
        palList.addEventListener('click', function (e) {
            var row = e.target.closest('.orb-cmdk-item');
            if (!row) return;
            var act = e.target.closest('.orb-cmd-act');
            runItem(+row.getAttribute('data-i'), act ? act.getAttribute('data-tool') : null);
        });
    }

    function openPalette(q) {
        if (window.xxdialogMode) return;
        if (!pal) buildPalette();
        pal.hidden = false;
        palInput.value = q || '';
        palIndex = 0;
        renderPalette();
        setTimeout(function () { palInput.focus(); }, 0);
    }

    function closePalette() { if (pal) pal.hidden = true; }

    // Atalhos de teclado. Nunca interceptam teclas na área de trabalho remota,
    // no terminal, no console nem enquanto se digita em um campo.
    function typingTarget(t) {
        if (!t) return false;
        var tag = (t.tagName || '').toLowerCase();
        return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable;
    }

    function onKey(e) {
        var k = (e.key || '').toLowerCase();
        if (pal && !pal.hidden) { if (k === 'escape') { e.preventDefault(); closePalette(); } return; }
        var v = viewNow();
        if (v === 11 || v === 12 || v === 15 || v === 115 || document.body.classList.contains('fulldesk')) return;
        if (window.xxdialogMode) return;
        if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && k === 'k') {
            e.preventDefault(); e.stopPropagation(); openPalette(''); return;
        }
        if (k === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !typingTarget(e.target)) {
            e.preventDefault(); e.stopPropagation(); openPalette('');
        }
    }

    // ---------- Toast ----------
    var toastEl, toastTimer;
    function toast(msg) {
        if (!toastEl) { toastEl = el('div', 'orb-toast'); document.body.appendChild(toastEl); }
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
    }

    // ---------- Encaixe das áreas roláveis ----------
    // O MeshCentral calcula em JS a altura das listas, do desktop e do terminal
    // ("100vh - N px") contando com as barras originais, mais baixas. Aqui medimos
    // quanto o painel visível passa do limite da área de conteúdo e descontamos
    // essa diferença da própria fórmula dele, então tudo continua responsivo.
    var FIT = {
        1: ['xdevices'], 3: ['p3events'], 4: ['p3users'], 5: ['p5filetable'], 9: ['p9filetable'],
        11: ['deskarea3x'], 12: ['termarea3x', 'termarea3xdiv'], 13: ['p13filetable'],
        15: ['p15agentConsole', 'p15agentConsoleText'], 16: ['p16events'], 31: ['p31events'], 50: ['p50groups'], 115: ['p15agentConsole', 'p15agentConsoleText']
    };
    var FIT_PROPS = ['height', 'maxHeight'];
    function applyDelta(e) {
        var d = parseFloat(e.getAttribute('data-orb-delta') || '0');
        FIT_PROPS.forEach(function (prop) {
            var cur = e.style[prop] || '';
            var saved = e.getAttribute('data-orb-' + prop);
            // Se o MeshCentral limpou a altura (ex.: tela cheia), não reaplicamos nada.
            if (!cur) { e.removeAttribute('data-orb-' + prop); e.removeAttribute('data-orb-set-' + prop); return; }
            // Se o MeshCentral reescreveu a altura, essa passa a ser a nova base.
            if (cur !== e.getAttribute('data-orb-set-' + prop)) { saved = cur; e.setAttribute('data-orb-' + prop, cur); }
            if (!saved || saved === 'none' || saved.indexOf('calc') < 0) return;
            var val = d ? 'calc(' + saved + (d > 0 ? ' - ' : ' + ') + Math.abs(Math.round(d)) + 'px)' : saved;
            e.style[prop] = val;
            e.setAttribute('data-orb-set-' + prop, e.style[prop]);
        });
    }

    function fitView(v) {
        var ids = FIT[v], col = $('column_l');
        if (!ids || !col || document.body.classList.contains('fulldesk')) return;
        var panel = $('p' + (v === 115 ? 15 : v));
        if (!visible(panel)) return;
        var limit = col.getBoundingClientRect().bottom - 8;
        var pr = panel.getBoundingClientRect();
        ids.forEach(function (id, i) {
            var e = $(id);
            if (!e || !visible(e)) return;
            applyDelta(e);
            var r = e.getBoundingClientRect();
            var mh = parseFloat(getComputedStyle(e).maxHeight);
            var h = isNaN(mh) ? r.height : Math.max(r.height, mh);
            var below = Math.max(0, pr.bottom - r.bottom);
            var over = (r.top + h + below) - limit;
            var d = parseFloat(e.getAttribute('data-orb-delta') || '0');
            var nd = Math.round(d + over);
            if (Math.abs(nd - d) < 1) return;
            e.setAttribute('data-orb-delta', String(nd));
            applyDelta(e);
            // Os demais elementos do mesmo painel (ex.: terminal) seguem o primeiro.
            for (var j = i + 1; j < ids.length; j++) { var o = $(ids[j]); if (o) { o.setAttribute('data-orb-delta', String(nd)); applyDelta(o); } }
            pr = panel.getBoundingClientRect();
        });
        if (v === 11 && has('deskAdjust')) safe(window.deskAdjust);
        if (v === 12 && window.xtermfit) safe(function () { window.xtermfit.fit(); });
    }

    function scheduleFit() {
        requestAnimationFrame(function () { safe(function () { fitView(viewNow()); }); });
    }

    function hookAdjust() {
        if (!has('adjustPanels') || window.adjustPanels.__orb) return;
        var original = window.adjustPanels;
        var wrapped = function () {
            var r = original.apply(this, arguments);
            safe(function () {
                Object.keys(FIT).forEach(function (k) { FIT[k].forEach(function (id) { var e = $(id); if (e && e.getAttribute('data-orb-delta')) applyDelta(e); }); });
            });
            scheduleFit();
            return r;
        };
        wrapped.__orb = true;
        window.adjustPanels = wrapped;
    }

    // ---------- Desktop remoto: tela máxima, área de transferência e arquivos ----------
    function inFullDesk() { return document.body.classList.contains('fulldesk'); }

    // Barras flutuantes no modo tela cheia: aparecem com o mouse perto da borda.
    var barsTimer = null;

    function showBars(on) {
        document.body.classList.toggle('orb-bars', !!on);
    }

    function onDeskMouse(e) {
        if (!inFullDesk()) return;
        var y = e.clientY, h = window.innerHeight;
        var overBar = e.target && e.target.closest && e.target.closest('#deskarea1, #deskarea4, .orb-deskhandle, #dialog, .contextMenu');
        if (overBar || y < 40 || y > h - 48) {
            showBars(true);
            clearTimeout(barsTimer);
            barsTimer = setTimeout(function () { showBars(false); }, overBar ? 2500 : 1600);
        }
    }

    function buildDeskHandle() {
        if (document.querySelector('.orb-deskhandle')) return;
        var hnd = el('div', 'orb-deskhandle',
            '<button type="button" data-a="bars" title="Mostrar barras">' + ic(null, '<path d="m6 9 6 6 6-6"/>') + '</button>' +
            '<button type="button" data-a="fit" title="Alternar entre ajustar e preencher a tela">' + ic('expand') + '<span class="orb-fitlabel"></span></button>' +
            '<button type="button" data-a="exit" title="Sair da tela cheia">' + ic('close') + '<span>Sair</span></button>');
        hnd.addEventListener('click', function (e) {
            var b = e.target.closest('button');
            if (!b) return;
            e.preventDefault();
            var a = b.getAttribute('data-a');
            if (a === 'bars') { showBars(!document.body.classList.contains('orb-bars')); }
            else if (a === 'fit') { toggleFill(); }
            else if (a === 'exit') { safe(function () { window.deskToggleFull({}); }); }
        });
        document.body.appendChild(hnd);
        updateFitLabel();
    }

    // Ajustar (mantém proporção, pode sobrar borda) <-> Preencher (estica para ocupar tudo).
    function toggleFill() {
        safe(function () {
            var v = (window.deskAspectRatio === 2) ? 0 : 2;
            window.deskAspectRatio = v;
            if (has('putstore')) window.putstore('deskAspectRatio', v);
            if (has('deskAdjust')) window.deskAdjust();
            updateFitLabel();
            toast(v === 2 ? 'Preenchendo a tela (pode esticar a imagem)' : 'Mantendo a proporção da tela remota');
        });
    }

    function updateFitLabel() {
        var l = document.querySelector('.orb-fitlabel');
        if (l) l.textContent = (window.deskAspectRatio === 2) ? 'Ajustar' : 'Preencher';
    }

    // --- Área de transferência imediata ---
    // O MeshCentral sincroniza a área de transferência a cada 1 s. Se a pessoa copia e cola
    // logo em seguida, o lado remoto ainda tem o texto antigo. Aqui o Ctrl+V é segurado por
    // um instante: o texto (ou os arquivos) do evento "colar" vão primeiro e só então as teclas
    // seguem para o computador remoto, na mesma ordem em que foram pressionadas.
    var pasteState = null;

    function deskActive() {
        var d = window.desktop, ctl = $('DeskControl');
        return viewNow() === 11 && d && d.State === 3 && !window.xxdialogMode && (!ctl || ctl.checked);
    }

    function autoClip() {
        var d = window.desktop, st = window.desktopsettings || {};
        return !!d && (((d.contype != 4) && st.autoclipboard === true) || ((d.contype == 4) && st.rdpautoclipboard === true));
    }

    function isKey(e, letter, code) { return (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && ((e.keyCode === code) || (e.code === 'Key' + letter)); }

    function sendClip(text) {
        var d = window.desktop;
        if (d && d.m && d.m.setClipboard) { d.m.setClipboard(text); }
        else { window.meshserver.send({ action: 'msg', type: 'setclip', nodeid: window.currentNode._id, data: text }); }
        window.deskLastClipboardSent = text;
    }

    function replayKeys(q, skipV) {
        q.forEach(function (it) {
            var ev = it[1];
            if (skipV && (ev.keyCode === 86 || ev.code === 'KeyV')) return;
            safe(function () {
                if (it[0] === 'down') window.ondockeydown(ev);
                else if (it[0] === 'up') window.ondockeyup(ev);
                else if (window.ondockeypress) window.ondockeypress(ev);
            });
        });
    }

    function finishPaste(data) {
        var st = pasteState;
        if (!st) return;
        clearTimeout(st.timer);
        var flush = function (skipV) { if (pasteState === st) pasteState = null; replayKeys(st.q, skipV); };
        if (data && data.files && data.files.length) { flush(true); uploadToRemote(data.files); return; }
        if (data && data.text && autoClip() && data.text !== window.deskLastClipboardSent) {
            safe(function () { sendClip(data.text); });
            var d = window.desktop, lat = (d && d.latency && d.latency.current > 0) ? d.latency.current : 120;
            st.timer = setTimeout(function () { flush(false); }, Math.min(1200, Math.max(260, lat * 2 + 140)));
            return;
        }
        flush(false);
    }

    function onDeskKeyDown(e) {
        if (pasteState) { e.stopImmediatePropagation(); e.preventDefault(); pasteState.q.push(['down', e]); return; }
        if (!deskActive()) return;
        if (isKey(e, 'V', 86) && !e.repeat) {
            // Não cancela a tecla: o navegador precisa disparar o evento "colar".
            e.stopImmediatePropagation();
            pasteState = { q: [['down', e]] };
            pasteState.timer = setTimeout(function () { finishPaste(null); }, 200);
        }
    }

    function onDeskKeyUp(e) {
        if (pasteState) { e.stopImmediatePropagation(); e.preventDefault(); pasteState.q.push(['up', e]); return; }
        // Depois de um Ctrl+C no computador remoto, busca a cópia logo em vez de esperar o ciclo.
        if (deskActive() && autoClip() && isKey(e, 'C', 67) && window.desktop.contype != 4) {
            [350, 900].forEach(function (ms) {
                setTimeout(function () { safe(function () { if (window.currentNode) window.meshserver.send({ action: 'msg', type: 'getclip', nodeid: window.currentNode._id, tag: 3 }); }); }, ms);
            });
        }
    }

    function onDeskKeyPress(e) {
        if (pasteState) { e.stopImmediatePropagation(); e.preventDefault(); pasteState.q.push(['press', e]); }
    }

    function onPaste(e) {
        if (!pasteState) return;
        e.preventDefault();
        var dt = e.clipboardData, files = (dt && dt.files && dt.files.length) ? [].slice.call(dt.files) : null;
        finishPaste(files ? { files: files } : { text: dt ? dt.getData('text/plain') : '' });
    }

    // --- Envio de arquivos para o computador remoto ---
    function remoteTarget(node) {
        if (has('isWindowsNode') && window.isWindowsNode(node)) return { path: 'C:/Users/Public/Desktop', label: 'Área de Trabalho (Pública)' };
        return { path: '/tmp', label: '/tmp' };
    }

    function samePath(a, b) {
        var f = function (x) { return String(x || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '').toLowerCase(); };
        return f(a) === f(b);
    }

    function uploadToRemote(fileList) {
        var node = window.currentNode;
        if (!node) return;
        var list = [].slice.call(fileList).filter(function (f) { return f && f.size > 0; });
        if (!list.length) { toast('Pastas e arquivos vazios não podem ser enviados'); return; }
        if (!has('p13doUploadFiles') || !has('connectFiles')) { toast('Envio de arquivos indisponível'); return; }
        var target = remoteTarget(node), t0 = Date.now(), asked = false;
        toast('Enviando ' + list.length + (list.length > 1 ? ' arquivos' : ' arquivo') + ' para ' + target.label + '…');
        safe(function () {
            if (window.filesNode !== node && has('setupFiles')) window.setupFiles();
            if (!window.files) window.connectFiles(null, 1);
        });
        (function wait() {
            var f = window.files;
            if (Date.now() - t0 > 20000) { toast('Não foi possível abrir a transferência de arquivos'); return; }
            if (!f || f.State !== 3) { setTimeout(wait, 200); return; }
            if (!asked) { asked = true; window.p13targetpath = target.path; f.sendText({ action: 'ls', reqid: 1, path: target.path }); }
            var tree = window.p13filetree;
            if (tree && samePath(tree.path, target.path)) {
                if (window.xxdialogMode) { setTimeout(wait, 300); return; }
                safe(function () { window.p13doUploadFiles(list); });
                return;
            }
            setTimeout(wait, 200);
        })();
    }

    var SCRIPT_EXT = /\.(bat|ps1|sh|agentconsole|txt)$/i;

    function onDeskDrop(e) {
        var dt = e.dataTransfer;
        if (!dt || !dt.files || !dt.files.length || !deskActive()) return;
        var all = [].slice.call(dt.files);
        // Scripts e .txt continuam com o comportamento do MeshCentral (executar / digitar).
        if (all.every(function (f) { return SCRIPT_EXT.test(f.name); })) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        safe(function () { if (has('QV')) { window.QV('p11bigok', false); window.QV('p11bigfail', false); } });
        uploadToRemote(all);
    }

    function initDesktopExtras() {
        buildDeskHandle();
        document.addEventListener('mousemove', onDeskMouse, { passive: true });
        window.addEventListener('keydown', onDeskKeyDown, true);
        window.addEventListener('keyup', onDeskKeyUp, true);
        window.addEventListener('keypress', onDeskKeyPress, true);
        document.addEventListener('paste', onPaste, true);
        var area = $('deskarea0');
        if (area) area.addEventListener('drop', onDeskDrop, true);
    }

    // ---------- Integração com a navegação ----------
    function hookGo() {
        if (!has('go') || window.go.__orb) return;
        var original = window.go;
        var wrapped = function () {
            var r = original.apply(this, arguments);
            safe(afterNav);
            return r;
        };
        wrapped.__orb = true;
        window.go = wrapped;
    }

    function afterNav() {
        fixTitle(); // o go() do MeshCentral reescreve o título a cada navegação
        state.view = viewNow();
        document.body.setAttribute('data-orb-view', String(state.view));
        try { document.dispatchEvent(new CustomEvent('orb:view', { detail: state.view })); } catch (ex) { }
        updateDevCtx();
        scheduleFit();
        updateStatus();
        if (state.view >= 10 && state.view < 20) syncHero();
        if (state.view === 1) decorateDevices();
    }

    function observe() {
        if (!window.MutationObserver) return;
        var pending = false;
        var xd = $('xdevices');
        if (xd) {
            new MutationObserver(function () {
                if (pending) return;
                pending = true;
                requestAnimationFrame(function () { pending = false; safe(decorateDevices); safe(updateStatus); });
            }).observe(xd, { childList: true, subtree: true });
        }
        var img = $('MainComputerImage');
        if (img) new MutationObserver(function () { safe(syncHero); }).observe(img, { attributes: true, attributeFilter: ['src', 'class'] });
        var p0 = $('p0');
        if (p0) new MutationObserver(function () { safe(updateStatus); }).observe(p0, { attributes: true, attributeFilter: ['style'] });
    }

    function loadScript(name) {
        var s = document.createElement('script');
        s.src = 'scripts/' + name;
        document.head.appendChild(s);
    }

    function initAppEarly() {
        window.orbToast = toast;
        window.orbIcon = ic;
        window.orbDeskActive = deskActive;
        // Gerenciador de arquivos estilo Explorer (aba Arquivos)
        loadScript('orbita-files.js');
        // Ponteiro, gestos e teclado do desktop remoto, só em aparelhos sem mouse
        if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) loadScript('orbita-touch.js');
        buildHeader();
        labelRail();
        buildStatus();
        buildDevCtx();
        document.addEventListener('keydown', onKey, true);
        var xd = $('xdevices');
        if (xd) {
            xd.addEventListener('mousedown', onQaDown, true);
            xd.addEventListener('click', onQaClick, true);
            document.addEventListener('mouseup', onQaUp, true);
        }
    }

    function initAppLate() {
        buildUserChip();
        labelRail();
        hookGo();
        hookAdjust();
        initDesktopExtras();
        var rt;
        window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(scheduleFit, 160); });
        observe();
        afterNav();
        setInterval(function () { safe(updateStatus); }, 4000);
    }

    // ---------- Celular: a interface do Órbita é a clássica, em qualquer tela ----------
    // Em telefones o MeshCentral serve uma página própria ("mobile"), que o
    // Órbita não cobre. Ela é identificada pelos seus elementos e trocada pela
    // interface clássica (?mobile=0), que aqui é responsiva.
    function mobileRedirect() {
        if ($('page_leftbar') || document.body.classList.contains('login')) return false;
        if (!$('topMenu') || !$('page_content')) return false;
        if (/[?&]mobile=0(&|$)/.test(location.search)) return false;
        var u = new URL(location.href);
        u.searchParams.set('mobile', '0');
        location.replace(u.toString());
        return true;
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (safe(mobileRedirect)) return;
        safe(checkVersion);
        safe(renameTitle);
        var body = document.body;
        if (body && body.classList.contains('login')) { safe(initLogin); return; }
        if ($('masthead') && $('page_leftbar') && $('column_l')) {
            safe(initAppEarly);
            // Depois do startup() da página (registrado no onload do <body>).
            window.addEventListener('load', function () { setTimeout(function () { safe(initAppLate); }, 0); });
        }
    });
})();
