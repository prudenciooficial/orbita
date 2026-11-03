/* ==========================================================================
   ÓRBITA — gerenciador de arquivos estilo Explorer para a aba Arquivos
   Desenha uma tela própria por cima da aba "Arquivos" do MeshCentral e usa as
   funções da própria página para tudo (listar, renomear, excluir, copiar,
   colar, enviar e baixar). A lista original continua no DOM, escondida, e as
   caixas de seleção dela são espelhadas a partir da seleção daqui.
   ========================================================================== */
(function () {
    'use strict';
    var root = document.documentElement;
    if (!root.classList.contains('orb')) return;

    function $(id) { return document.getElementById(id); }
    function has(n) { return typeof window[n] === 'function'; }
    function safe(fn) { try { return fn(); } catch (ex) { if (window.console) console.warn('[orbita-files]', ex); } }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
    function toast(m) { if (has('orbToast')) window.orbToast(m); }
    function view() { return (typeof window.xxcurrentView === 'number') ? window.xxcurrentView : -1; }
    function typing(t) { var n = (t && t.tagName || '').toLowerCase(); return n === 'input' || n === 'textarea' || n === 'select' || (t && t.isContentEditable); }
    function tree() { return window.p13filetree || null; }
    function connected() { var f = window.files; return !!(f && f.State === 3); }
    function isWin() { return has('isWindowsNode') && window.currentNode && window.isWindowsNode(window.currentNode); }
    function loc() { return (window.p13filetreelocation || []).slice(); }

    var FX = {
        sel: {}, anchor: null, focus: null, sortKey: 'name', sortDir: 1, filter: '',
        hist: [], hpos: -1, fromHist: false, drives: null, remoteCopyAt: 0, lastBlurAt: 0,
        queue: [], uploading: false, pasteTimer: null, viewMode: 'details'
    };
    try { FX.viewMode = localStorage.getItem('orbFxView') || 'details'; } catch (ex) { }

    // ---------- Ícones ----------
    var UI = {
        back: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
        fwd: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
        up: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
        refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
        search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
        plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
        cut: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88"/><path d="M14.47 14.48 20 20"/><path d="M8.12 8.12 12 12"/>',
        copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
        paste: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
        rename: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
        trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
        upload: '<path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/>',
        download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
        sort: '<path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>',
        viewI: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
        more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
        chev: '<path d="m9 18 6-6-6-6"/>',
        chevD: '<path d="m6 9 6 6 6-6"/>',
        pc: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
        desk: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
        docs: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h8"/><path d="M8 17h5"/>',
        dl: '<circle cx="12" cy="12" r="9"/><path d="M12 7v8"/><path d="m8.5 11.5 3.5 3.5 3.5-3.5"/>',
        users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        zip: '<path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>',
        open: '<path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/>',
        edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>',
        find: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/><path d="M8 11h6"/>',
        selall: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
        folderUp: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M12 10v6"/><path d="m9 13 3-3 3 3"/>'
    };
    function ui(n, cls) { return '<svg class="fx-i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + UI[n] + '</svg>'; }

    var EXT = {
        pdf: ['Documento PDF', '#e5483f', 'PDF'], doc: ['Documento do Microsoft Word', '#2b6cd9', 'W'], docx: ['Documento do Microsoft Word', '#2b6cd9', 'W'], rtf: ['Documento RTF', '#2b6cd9', 'RTF'], odt: ['Documento de texto', '#2b6cd9', 'ODT'],
        xls: ['Planilha do Microsoft Excel', '#1e9e5b', 'X'], xlsx: ['Planilha do Microsoft Excel', '#1e9e5b', 'X'], xlsm: ['Planilha do Microsoft Excel', '#1e9e5b', 'X'], csv: ['Arquivo CSV', '#1e9e5b', 'CSV'], ods: ['Planilha', '#1e9e5b', 'ODS'],
        ppt: ['Apresentação do PowerPoint', '#e0662f', 'P'], pptx: ['Apresentação do PowerPoint', '#e0662f', 'P'],
        txt: ['Documento de Texto', '#8a93a6', 'TXT'], log: ['Documento de Texto', '#8a93a6', 'LOG'], md: ['Arquivo Markdown', '#8a93a6', 'MD'],
        jpg: ['Imagem JPEG', '#18a7a0', 'JPG'], jpeg: ['Imagem JPEG', '#18a7a0', 'JPG'], png: ['Imagem PNG', '#18a7a0', 'PNG'], gif: ['Imagem GIF', '#18a7a0', 'GIF'], bmp: ['Imagem BMP', '#18a7a0', 'BMP'], webp: ['Imagem WebP', '#18a7a0', 'WEBP'], svg: ['Imagem SVG', '#18a7a0', 'SVG'], ico: ['Ícone', '#18a7a0', 'ICO'], heic: ['Imagem HEIC', '#18a7a0', 'HEIC'],
        zip: ['Pasta compactada', '#d9a21b', 'ZIP'], rar: ['Arquivo RAR', '#d9a21b', 'RAR'], '7z': ['Arquivo 7-Zip', '#d9a21b', '7Z'], gz: ['Arquivo GZ', '#d9a21b', 'GZ'], tar: ['Arquivo TAR', '#d9a21b', 'TAR'],
        exe: ['Aplicativo', '#3f5bd8', 'EXE'], msi: ['Pacote do Windows Installer', '#3f5bd8', 'MSI'], dll: ['Extensão de aplicativo', '#5b6b8c', 'DLL'], bat: ['Arquivo em Lotes do Windows', '#5b6b8c', 'BAT'], cmd: ['Script de Comando do Windows', '#5b6b8c', 'CMD'], ps1: ['Script do PowerShell', '#3f6fb5', 'PS1'], sh: ['Script de shell', '#5b6b8c', 'SH'], lnk: ['Atalho', '#8a93a6', 'LNK'], url: ['Atalho da Internet', '#8a93a6', 'URL'],
        mp3: ['Áudio MP3', '#9b59d0', 'MP3'], wav: ['Áudio WAV', '#9b59d0', 'WAV'], mp4: ['Vídeo MP4', '#d2416e', 'MP4'], mkv: ['Vídeo MKV', '#d2416e', 'MKV'], avi: ['Vídeo AVI', '#d2416e', 'AVI'], mov: ['Vídeo MOV', '#d2416e', 'MOV'],
        iso: ['Arquivo de imagem de disco', '#5b6b8c', 'ISO'], ini: ['Definições de configuração', '#8a93a6', 'INI'], cfg: ['Arquivo de configuração', '#8a93a6', 'CFG'], conf: ['Arquivo de configuração', '#8a93a6', 'CONF'],
        json: ['Arquivo JSON', '#5b6b8c', '{ }'], xml: ['Documento XML', '#5b6b8c', 'XML'], html: ['Documento HTML', '#e0662f', 'HTML'], htm: ['Documento HTML', '#e0662f', 'HTML'], css: ['Folha de estilos', '#3f6fb5', 'CSS'], js: ['Arquivo JavaScript', '#d9a21b', 'JS'], sql: ['Arquivo SQL', '#5b6b8c', 'SQL'], py: ['Arquivo Python', '#3f6fb5', 'PY'], xml_: null,
        pfx: ['Troca de Informações Pessoais', '#5b6b8c', 'PFX'], cer: ['Certificado de segurança', '#5b6b8c', 'CER'], bak: ['Arquivo de backup', '#8a93a6', 'BAK'], db: ['Arquivo de banco de dados', '#5b6b8c', 'DB']
    };
    function extOf(n) { var m = /\.([^.\\/]+)$/.exec(n || ''); return m ? m[1].toLowerCase() : ''; }
    function info(it) {
        if (it.t === 1 || it.dt) {
            var dt = String(it.dt || '').toUpperCase();
            return ['', dt === 'REMOVABLE' ? 'Unidade removível' : dt === 'CDROM' ? 'Unidade de CD' : dt === 'NETWORK' ? 'Unidade de rede' : 'Disco Local'];
        }
        if (it.t < 3) return ['', 'Pasta de arquivos'];
        var e = extOf(it.n), m = EXT[e];
        return [e, m ? m[0] : (e ? 'Arquivo ' + e.toUpperCase() : 'Arquivo')];
    }

    function folderSvg(sz) {
        return '<svg class="fx-ico" width="' + sz + '" height="' + sz + '" viewBox="0 0 48 48" aria-hidden="true">' +
            '<path d="M5 12a3 3 0 0 1 3-3h10.2a3 3 0 0 1 2.3 1.1l2.3 2.8a3 3 0 0 0 2.3 1.1H40a3 3 0 0 1 3 3v3H5z" fill="#e5a42e"/>' +
            '<path d="M5 18a3 3 0 0 1 3-3h32a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" fill="#f6c443"/>' +
            '<path d="M5 18a3 3 0 0 1 3-3h32a3 3 0 0 1 3 3v2H5z" fill="#fbd770"/></svg>';
    }
    function driveSvg(sz, removable) {
        return '<svg class="fx-ico" width="' + sz + '" height="' + sz + '" viewBox="0 0 48 48" aria-hidden="true">' +
            '<rect x="5" y="17" width="38" height="17" rx="3.5" fill="' + (removable ? '#7c8aa5' : '#8f9bb3') + '"/>' +
            '<rect x="5" y="17" width="38" height="5" rx="2.5" fill="#b8c2d6"/>' +
            '<rect x="9" y="27" width="20" height="3" rx="1.5" fill="#5d6a84"/><circle cx="37.5" cy="28.5" r="2" fill="#3ddc84"/></svg>';
    }
    function fileSvg(sz, ext) {
        var m = EXT[ext], color = m ? m[1] : '#a0a8b8', label = m ? m[2] : (ext ? ext.toUpperCase().slice(0, 4) : '');
        var showLabel = sz >= 32 && label;
        return '<svg class="fx-ico" width="' + sz + '" height="' + sz + '" viewBox="0 0 48 48" aria-hidden="true">' +
            '<path d="M11 4h18l10 10v28a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#fff" stroke="#c5cbd8" stroke-width="1.5"/>' +
            '<path d="M29 4v8a2 2 0 0 0 2 2h8" fill="#eef1f6" stroke="#c5cbd8" stroke-width="1.5" stroke-linejoin="round"/>' +
            (showLabel ? '<rect x="5" y="25" width="' + Math.min(36, 8 + label.length * 6.2) + '" height="12" rx="2.5" fill="' + color + '"/><text x="' + (5 + Math.min(36, 8 + label.length * 6.2) / 2) + '" y="33.6" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-weight="700" font-size="8" fill="#fff">' + esc(label) + '</text>'
                : '<rect x="13" y="30" width="22" height="6" rx="2" fill="' + color + '"/>') +
            '</svg>';
    }
    function iconFor(it, sz) {
        if (it.t === 1 || it.dt) return driveSvg(sz, String(it.dt || '').toUpperCase() === 'REMOVABLE');
        if (it.t < 3) return folderSvg(sz);
        return fileSvg(sz, extOf(it.n));
    }

    // ---------- Formatação ----------
    function fmtDate(d) {
        if (d == null) return '';
        var x = (typeof d === 'number') ? new Date(d * 1000) : new Date(d);
        if (isNaN(x)) return '';
        var p = function (n) { return (n < 10 ? '0' : '') + n; };
        return p(x.getDate()) + '/' + p(x.getMonth() + 1) + '/' + x.getFullYear() + ' ' + p(x.getHours()) + ':' + p(x.getMinutes());
    }
    function fmtKB(s) { if (!s) return '0 KB'; return Math.max(1, Math.ceil(s / 1024)).toLocaleString('pt-BR') + ' KB'; }
    function fmtHuman(s) {
        if (!s) return '0 bytes';
        var u = ['bytes', 'KB', 'MB', 'GB', 'TB'], i = Math.min(4, Math.floor(Math.log(s) / Math.log(1024)));
        return (i === 0 ? s : (s / Math.pow(1024, i)).toLocaleString('pt-BR', { maximumFractionDigits: 2 })) + ' ' + u[i];
    }

    // ---------- Dados ----------
    function items() {
        var t = tree();
        if (!t || !t.dir) return [];
        var arr = [];
        for (var i in t.dir) {
            var f = t.dir[i];
            if (!f || f.n == null) continue;
            var tt = parseInt(f.t); if (isNaN(tt)) tt = 3;
            arr.push({ i: String(i), n: String(f.n), t: tt, s: f.s || 0, d: f.d, dt: f.dt });
        }
        return arr;
    }
    function visibleItems() {
        var q = FX.filter.trim().toLowerCase(), list = items();
        if (q) list = list.filter(function (x) { return x.n.toLowerCase().indexOf(q) >= 0; });
        var k = FX.sortKey, dir = FX.sortDir;
        list.sort(function (a, b) {
            var fa = a.t < 3 ? 0 : 1, fb = b.t < 3 ? 0 : 1;
            if (fa !== fb) return fa - fb; // pastas primeiro, como no Windows
            var r = 0;
            if (k === 'size') r = (a.s || 0) - (b.s || 0);
            else if (k === 'date') r = (new Date(typeof a.d === 'number' ? a.d * 1000 : a.d) - new Date(typeof b.d === 'number' ? b.d * 1000 : b.d)) || 0;
            else if (k === 'type') r = info(a)[1].localeCompare(info(b)[1], 'pt-BR');
            if (!r) r = a.n.localeCompare(b.n, 'pt-BR', { numeric: true, sensitivity: 'base' });
            return r * dir;
        });
        return list;
    }
    function byName(n) { var l = items(); for (var i = 0; i < l.length; i++) { if (l[i].n === n) return l[i]; } return null; }
    function selected() { return items().filter(function (x) { return FX.sel[x.n]; }); }
    function pathKey() { return loc().join('/'); }

    // Espelha a seleção nas caixas escondidas do MeshCentral, que todas as operações leem.
    function syncChecks() {
        var t = tree(), boxes = document.getElementsByName('fd');
        for (var i = 0; i < boxes.length; i++) {
            var f = t && t.dir ? t.dir[boxes[i].value] : null;
            boxes[i].checked = !!(f && FX.sel[f.n]);
        }
        if (has('p13setActions')) safe(window.p13setActions);
        updateCommands();
    }
    function mcEnabled(id) { var b = $(id); return !!(b && !b.disabled); }

    // ---------- Navegação ----------
    function gotoPath(p) {
        if (!connected()) return;
        p = String(p || '').replace(/\\/g, '/').replace(/\/+$/, '');
        window.p13targetpath = p;
        if (has('p13storeCurrentPath')) safe(function () { window.p13storeCurrentPath(p); });
        window.files.sendText({ action: 'ls', reqid: 1, path: p });
    }
    function openItem(it) {
        if (!it) return;
        if (it.t < 3) { FX.sel = {}; if (has('p13folderset')) window.p13folderset(it.i); }
        else downloadItems([it]);
    }
    function goUp() { if (loc().length && has('p13folderup')) window.p13folderup(); }
    function refresh() { if (has('p13folderup')) window.p13folderup(9999); }
    function goHist(d) {
        var n = FX.hpos + d;
        if (n < 0 || n >= FX.hist.length) return;
        FX.hpos = n; FX.fromHist = true;
        gotoPath(FX.hist[n]);
    }

    // ---------- Download ----------
    function fileUrl(it) {
        var n = window.currentNode;
        return 'devicefile.ashx?c=' + window.authCookie + '&m=' + n.meshid.split('/')[2] + '&n=' + n._id.split('/')[2] + '&f=' + window.encodeURIComponentEx(loc().join('/') + '/' + it.n);
    }
    function downloadItems(list) {
        var filesOnly = list.filter(function (x) { return x.t === 3; });
        if (filesOnly.length < list.length) toast('Pastas não são baixadas direto: use "Compactar" e baixe o .zip');
        filesOnly.forEach(function (it, k) {
            setTimeout(function () { safe(function () { window.downloadFile(fileUrl(it), window.encodeURIComponentEx(it.n)); }); }, k * 400);
        });
        if (filesOnly.length) toast(filesOnly.length > 1 ? 'Baixando ' + filesOnly.length + ' arquivos…' : 'Baixando ' + filesOnly[0].n + '…');
    }

    // ---------- Upload (arquivos e pastas) ----------
    function collect(dt) {
        var out = [];
        if (dt && dt.items && dt.items.length) {
            for (var i = 0; i < dt.items.length; i++) {
                var it = dt.items[i];
                if (it.kind !== 'file') continue;
                var en = it.webkitGetAsEntry ? it.webkitGetAsEntry() : null;
                if (en) out.push({ entry: en });
                else { var f = it.getAsFile(); if (f) out.push({ file: f }); }
            }
        }
        if (!out.length && dt && dt.files) { for (var j = 0; j < dt.files.length; j++) out.push({ file: dt.files[j] }); }
        return out;
    }
    function plan(list, cb) {
        var p = { dirs: [], groups: { '': [] }, empty: 0 }, pending = 1, done = false;
        function add(rel, f) { if (!f.size) { p.empty++; return; } (p.groups[rel] = p.groups[rel] || []).push(f); }
        function fin() { if (--pending === 0 && !done) { done = true; cb(p); } }
        function walk(entry, rel) {
            if (entry.isFile) { pending++; entry.file(function (f) { add(rel, f); fin(); }, fin); }
            else if (entry.isDirectory) {
                var d = rel ? rel + '/' + entry.name : entry.name;
                p.dirs.push(d); p.groups[d] = p.groups[d] || [];
                var reader = entry.createReader();
                pending++;
                (function read() { reader.readEntries(function (ents) { if (!ents.length) { fin(); return; } ents.forEach(function (x) { walk(x, d); }); read(); }, fin); })();
            }
        }
        list.forEach(function (x) {
            if (x.entry) walk(x.entry, '');
            else if (x.file) {
                var rp = x.file.webkitRelativePath || '';
                if (rp.indexOf('/') > 0) {
                    var parts = rp.split('/'); parts.pop();
                    for (var k = 1; k <= parts.length; k++) { var dd = parts.slice(0, k).join('/'); if (p.dirs.indexOf(dd) < 0) { p.dirs.push(dd); p.groups[dd] = p.groups[dd] || []; } }
                    add(parts.join('/'), x.file);
                } else add('', x.file);
            }
        });
        fin();
    }
    function upload(list, targetParts) {
        if (!connected()) { toast('Conecte primeiro aos arquivos do dispositivo'); return; }
        if (!mcEnabled('p13UploadButton')) { toast('Você não tem permissão para enviar arquivos aqui'); return; }
        var here = loc().join('/'), target = targetParts.join('/');
        plan(list, function (p) {
            var total = 0; Object.keys(p.groups).forEach(function (k) { total += p.groups[k].length; });
            if (!total && !p.dirs.length) { toast(p.empty ? 'Arquivos vazios não são enviados' : 'Nada para enviar'); return; }
            if (p.empty) toast(p.empty + (p.empty > 1 ? ' arquivos vazios ignorados' : ' arquivo vazio ignorado'));
            // Só arquivos na pasta atual: usa o fluxo do MeshCentral (pergunta antes de sobrescrever).
            if (!p.dirs.length && target === here) { safe(function () { window.p13doUploadFiles(p.groups['']); }); return; }
            p.dirs.sort(function (a, b) { return a.split('/').length - b.split('/').length; });
            p.dirs.forEach(function (d) { window.files.sendText({ action: 'mkdir', reqid: 1, path: targetParts.concat(d.split('/')).join('/') }); });
            FX.queue = Object.keys(p.groups).filter(function (k) { return p.groups[k].length; }).map(function (k) {
                return { parts: targetParts.concat(k ? k.split('/') : []), files: p.groups[k] };
            });
            if (!FX.queue.length) { refresh(); toast(p.dirs.length > 1 ? p.dirs.length + ' pastas criadas' : 'Pasta criada'); return; }
            toast('Enviando ' + total + (total > 1 ? ' arquivos' : ' arquivo') + (p.dirs.length ? ' em ' + p.dirs.length + (p.dirs.length > 1 ? ' pastas' : ' pasta') : '') + '…');
            nextBatch();
        });
    }
    function nextBatch() {
        var b = FX.queue.shift();
        if (!b) { if (FX.uploading) { FX.uploading = false; toast('Envio concluído'); } return; }
        FX.uploading = true;
        var saved = window.p13filetreelocation;
        window.p13filetreelocation = b.parts;
        try { window.p13uploadFileContinue(1, b.files); } finally { window.p13filetreelocation = saved; }
    }
    function pickFiles(folder) {
        var inp = el('input');
        inp.type = 'file'; inp.multiple = true;
        if (folder) { inp.setAttribute('webkitdirectory', ''); inp.setAttribute('directory', ''); }
        inp.style.display = 'none';
        inp.addEventListener('change', function () {
            var l = []; for (var i = 0; i < inp.files.length; i++) l.push({ file: inp.files[i] });
            if (l.length) upload(l, loc());
            inp.remove();
        });
        document.body.appendChild(inp);
        inp.click();
    }

    // ---------- Operações ----------
    function uniqueName(base, ext) {
        var names = {}; items().forEach(function (x) { names[x.n.toLowerCase()] = 1; });
        var n = base + ext, k = 2;
        while (names[n.toLowerCase()]) { n = base + ' (' + (k++) + ')' + ext; }
        return n;
    }
    function newFolder() {
        if (!mcEnabled('p13NewFolderButton')) return;
        var n = uniqueName('Nova pasta', '');
        window.files.sendText({ action: 'mkdir', reqid: 1, path: loc().join('/') + '/' + n });
        FX.sel = {}; FX.sel[n] = true; FX.focus = n; refresh();
        toast('"' + n + '" criada — F2 para renomear');
    }
    function newTextFile() {
        if (!mcEnabled('p13NewFileButton')) return;
        var n = uniqueName('Novo Documento de Texto', '.txt');
        window.files.sendText({ action: 'mkfile', reqid: 1, path: loc().join('/') + '/' + n });
        FX.sel = {}; FX.sel[n] = true; FX.focus = n; refresh();
    }
    function run(cmd) {
        syncChecks();
        var sel = selected();
        switch (cmd) {
            case 'open': if (sel.length) openItem(sel[0]); break;
            case 'download': if (sel.length) downloadItems(sel); else toast('Selecione os arquivos para baixar'); break;
            case 'upload': pickFiles(false); break;
            case 'uploadDir': pickFiles(true); break;
            case 'newFolder': newFolder(); break;
            case 'newFile': newTextFile(); break;
            case 'cut': if (sel.length && mcEnabled('p13CutButton')) { FX.lastCopyHadDirs = sel.some(function (x) { return x.t < 3; }); window.p13copyFile(1); FX.remoteCopyAt = Date.now(); toast(sel.length + (sel.length > 1 ? ' itens recortados' : ' item recortado') + ' — cole em outra pasta'); } break;
            case 'copy': if (sel.length && mcEnabled('p13CopyButton')) { FX.lastCopyHadDirs = sel.some(function (x) { return x.t < 3; }); window.p13copyFile(0); FX.remoteCopyAt = Date.now(); toast(sel.length + (sel.length > 1 ? ' itens copiados' : ' item copiado') + ' — cole em outra pasta deste dispositivo'); } break;
            case 'paste': remotePaste(); break;
            case 'rename': if (sel.length === 1 && mcEnabled('p13RenameFileButton')) window.p13renamefile(); break;
            case 'delete': if (sel.length && mcEnabled('p13DeleteFileButton')) window.p13deletefile(); break;
            case 'zip': if (sel.length && mcEnabled('p13ZipButton')) window.p13zipFiles(); break;
            case 'unzip': if (mcEnabled('p13UnzipButton')) window.p13unzipFile(); break;
            case 'edit': if (mcEnabled('p13ViewFileButton')) window.p13viewfile(); break;
            case 'find': if (mcEnabled('p13FindButton')) window.p13findfile(); break;
            case 'selectAll': items().forEach(function (x) { FX.sel[x.n] = true; }); render(); break;
            case 'refresh': refresh(); break;
            case 'up': goUp(); break;
            case 'back': goHist(-1); break;
            case 'fwd': goHist(1); break;
        }
    }
    // O agente só completa a "/" inicial em "path"; em copiar/mover (scpath/dspath) ela precisa vir pronta
    // em Linux/macOS, senão a operação falha em silêncio (vale até para a interface original).
    function agentPath(p) {
        p = String(p || '').replace(/\\/g, '/');
        if (isWin()) return p;
        return '/' + p.replace(/^\/+/, '');
    }
    function remotePaste() {
        var clip = window.p13clipboard;
        if (!(clip && clip.length)) { toast('Nada copiado neste dispositivo. Para trazer do seu PC, arraste ou cole (Ctrl+V) os arquivos aqui.'); return; }
        if (!mcEnabled('p13PasteButton') || !connected()) return;
        var cut = window.p13clipboardCut == 1;
        window.files.sendText({ action: cut ? 'move' : 'copy', reqid: 1, scpath: agentPath(window.p13clipboardFolder), dspath: agentPath(loc().join('/')), names: clip });
        if (cut) { window.p13clipboard = null; window.p13clipboardFolder = null; window.p13clipboardCut = 0; if (has('p13updateClipview')) safe(window.p13updateClipview); }
        toast((cut ? 'Movendo ' : 'Colando ') + clip.length + (clip.length > 1 ? ' itens…' : ' item…') + (clip.length && FX.lastCopyHadDirs ? ' (pastas não são copiadas pelo agente)' : ''));
        setTimeout(refresh, 400);
    }
    function moveInto(names, folder) {
        if (!names.length || !connected()) return;
        var src = agentPath(loc().join('/')), dst = agentPath(loc().join('/') + '/' + folder);
        if (names.some(function (n) { var it = byName(n); return it && it.t < 3; })) toast('O agente só move arquivos — pastas ficam onde estão');
        window.files.sendText({ action: 'move', reqid: 1, scpath: src, dspath: dst, names: names });
        FX.sel = {}; setTimeout(refresh, 400);
        toast('Movendo ' + names.length + (names.length > 1 ? ' itens' : ' item') + ' para "' + folder + '"');
    }

    // ---------- Interface ----------
    var fx, listEl, crumbsEl, pathInput, searchInput, sideEl, statusCount, statusSel, popEl, dropEl, emptyEl, headEl;

    function build() {
        var p13 = $('p13'), toolbar = $('p13toolbar');
        if (!p13 || !toolbar || $('orb-fx')) return false;
        fx = el('div', 'orb-fx');
        fx.id = 'orb-fx';
        fx.innerHTML =
            '<div class="fx-top">' +
            '<div class="fx-nav">' +
            '<button type="button" data-c="back" title="Voltar (Alt+←)">' + ui('back') + '</button>' +
            '<button type="button" data-c="fwd" title="Avançar (Alt+→)">' + ui('fwd') + '</button>' +
            '<button type="button" data-c="up" title="Para cima (Alt+↑)">' + ui('up') + '</button>' +
            '<button type="button" data-c="refresh" title="Atualizar (F5)">' + ui('refresh') + '</button>' +
            '</div>' +
            '<div class="fx-address" title="Clique para digitar um caminho"><div class="fx-crumbs"></div><input class="fx-path" type="text" spellcheck="false" autocomplete="off" /></div>' +
            '<label class="fx-search">' + ui('search') + '<input type="text" spellcheck="false" autocomplete="off" placeholder="Pesquisar" /></label>' +
            '</div>' +
            '<div class="fx-cmd">' +
            '<button type="button" class="fx-new" data-c="menuNew">' + ui('plus') + '<span>Novo</span>' + ui('chevD', 'fx-dd') + '</button>' +
            '<span class="fx-sep"></span>' +
            '<button type="button" data-c="cut" title="Recortar (Ctrl+X)">' + ui('cut') + '</button>' +
            '<button type="button" data-c="copy" title="Copiar (Ctrl+C)">' + ui('copy') + '</button>' +
            '<button type="button" data-c="paste" title="Colar (Ctrl+V)">' + ui('paste') + '</button>' +
            '<button type="button" data-c="rename" title="Renomear (F2)">' + ui('rename') + '</button>' +
            '<button type="button" data-c="delete" title="Excluir (Delete)">' + ui('trash') + '</button>' +
            '<span class="fx-sep"></span>' +
            '<button type="button" data-c="menuUpload" title="Enviar do seu PC">' + ui('upload') + '<span>Carregar</span>' + ui('chevD', 'fx-dd') + '</button>' +
            '<button type="button" data-c="download" title="Baixar para o seu PC">' + ui('download') + '<span>Baixar</span></button>' +
            '<span class="fx-sep"></span>' +
            '<button type="button" data-c="menuSort">' + ui('sort') + '<span>Classificar</span>' + ui('chevD', 'fx-dd') + '</button>' +
            '<button type="button" data-c="menuView">' + ui('viewI') + '<span>Exibir</span>' + ui('chevD', 'fx-dd') + '</button>' +
            '<button type="button" data-c="menuMore" title="Ver mais">' + ui('more') + '</button>' +
            '</div>' +
            '<div class="fx-body">' +
            '<nav class="fx-side"></nav>' +
            '<div class="fx-main" tabindex="0">' +
            '<div class="fx-head"><span data-k="name">Nome</span><span data-k="date">Data de modificação</span><span data-k="type">Tipo</span><span data-k="size">Tamanho</span></div>' +
            '<div class="fx-list" role="grid"></div>' +
            '<div class="fx-empty"></div>' +
            '<div class="fx-drop"><div>' + ui('upload') + '<span class="fx-drop-t"></span></div></div>' +
            '</div>' +
            '</div>' +
            '<div class="fx-status"><span class="fx-count"></span><span class="fx-selinfo"></span><span class="fx-spacer"></span>' +
            '<span class="fx-hint">Arraste arquivos ou pastas do PC para cá · arraste um arquivo daqui para uma pasta do Windows para baixar</span></div>';
        toolbar.parentNode.insertBefore(fx, toolbar.nextSibling);
        popEl = el('div', 'fx-pop'); popEl.id = 'orb-fx-pop'; popEl.hidden = true; document.body.appendChild(popEl);

        listEl = fx.querySelector('.fx-list'); crumbsEl = fx.querySelector('.fx-crumbs'); pathInput = fx.querySelector('.fx-path');
        searchInput = fx.querySelector('.fx-search input'); sideEl = fx.querySelector('.fx-side'); statusCount = fx.querySelector('.fx-count');
        statusSel = fx.querySelector('.fx-selinfo'); dropEl = fx.querySelector('.fx-drop'); emptyEl = fx.querySelector('.fx-empty'); headEl = fx.querySelector('.fx-head');
        bind();
        root.classList.add('orb-fx-on');
        return true;
    }

    function updateCommands() {
        if (!fx) return;
        var sel = selected(), on = connected() && !!tree();
        var set = function (c, en) { var b = fx.querySelector('[data-c="' + c + '"]'); if (b) b.disabled = !en; };
        set('back', on && FX.hpos > 0);
        set('fwd', on && FX.hpos < FX.hist.length - 1);
        set('up', on && loc().length > 0);
        set('refresh', on);
        set('menuNew', on && (mcEnabled('p13NewFolderButton') || mcEnabled('p13NewFileButton')));
        set('cut', on && sel.length > 0 && mcEnabled('p13CutButton'));
        set('copy', on && sel.length > 0 && mcEnabled('p13CopyButton'));
        set('paste', on && mcEnabled('p13PasteButton') && !!(window.p13clipboard && window.p13clipboard.length));
        set('rename', on && sel.length === 1 && mcEnabled('p13RenameFileButton'));
        set('delete', on && sel.length > 0 && mcEnabled('p13DeleteFileButton'));
        set('menuUpload', on && mcEnabled('p13UploadButton'));
        set('download', on && sel.some(function (x) { return x.t === 3; }));
        set('menuSort', on); set('menuView', on); set('menuMore', on);
    }

    function renderCrumbs() {
        var parts = loc(), rootName = isWin() ? 'Este Computador' : 'Raiz (/)';
        var h = '<button type="button" class="fx-crumb" data-up="0">' + ui('pc') + '<span>' + rootName + '</span></button>';
        parts.forEach(function (p, i) {
            h += ui('chev', 'fx-csep') + '<button type="button" class="fx-crumb" data-up="' + (i + 1) + '"><span>' + esc(p) + '</span></button>';
        });
        crumbsEl.innerHTML = h;
        crumbsEl.scrollLeft = crumbsEl.scrollWidth;
        var folderName = parts.length ? parts[parts.length - 1] : rootName;
        searchInput.placeholder = 'Pesquisar em ' + folderName;
    }

    function userName() {
        var n = window.currentNode, u = n && n.users && n.users[0];
        if (!u) return null;
        u = String(u); var k = u.lastIndexOf('\\');
        return k >= 0 ? u.substring(k + 1) : u;
    }

    function renderSide() {
        var h = '', here = (connected() && tree()) ? pathKey().toLowerCase() : null;
        var link = function (path, icon, label, svg) {
            var active = (here !== null && path.replace(/^\/+/, '').toLowerCase() === here) ? ' active' : '';
            return '<button type="button" class="fx-link' + active + '" data-path="' + esc(path) + '" title="' + esc(path || label) + '">' + (svg || ui(icon)) + '<span>' + esc(label) + '</span></button>';
        };
        if (isWin()) {
            var u = userName();
            h += '<div class="fx-sidehead">Acesso rápido</div>';
            if (u) {
                var base = 'C:/Users/' + u;
                h += link(base + '/Desktop', 'desk', 'Área de Trabalho') + link(base + '/Documents', 'docs', 'Documentos') + link(base + '/Downloads', 'dl', 'Downloads');
            }
            h += link('C:/Users/Public/Desktop', 'desk', 'Área de Trabalho Pública') + link('C:/Users', 'users', 'Usuários');
            h += '<div class="fx-sidehead">Este Computador</div>';
            var drives = FX.drives && FX.drives.length ? FX.drives : [{ n: 'C:', t: 1 }];
            drives.forEach(function (d) { h += link(d.n, null, (String(d.dt || '').toUpperCase() === 'REMOVABLE' ? 'Removível' : 'Disco Local') + ' (' + d.n + ')', driveSvg(18, String(d.dt || '').toUpperCase() === 'REMOVABLE')); });
        } else {
            h += '<div class="fx-sidehead">Locais</div>' + link('', 'pc', 'Raiz (/)') + link('/home', 'users', 'home') + link('/root', 'desk', 'root') + link('/tmp', 'docs', 'tmp') + link('/etc', 'docs', 'etc');
        }
        sideEl.innerHTML = h;
    }

    function rowHtml(it) {
        var inf = info(it), sel = FX.sel[it.n] ? ' sel' : '', foc = FX.focus === it.n ? ' focus' : '';
        var label = it.n;
        if ((it.t === 1 || it.dt) && isWin()) label = (String(it.dt || '').toUpperCase() === 'REMOVABLE' ? 'Unidade removível' : 'Disco Local') + ' (' + it.n + ')';
        var big = FX.viewMode === 'icons';
        return '<div class="fx-row' + sel + foc + (it.t < 3 ? ' dir' : '') + '" data-n="' + esc(it.n) + '" draggable="true" role="row">' +
            '<span class="fx-c fx-name">' + iconFor(it, big ? 48 : 20) + '<span class="fx-label">' + esc(label) + '</span></span>' +
            '<span class="fx-c fx-date">' + esc(fmtDate(it.d)) + '</span>' +
            '<span class="fx-c fx-type">' + esc(inf[1]) + '</span>' +
            '<span class="fx-c fx-size">' + (it.t === 3 ? esc(fmtKB(it.s)) : '') + '</span>' +
            '</div>';
    }

    function render() {
        if (!fx) return;
        var t = tree(), on = connected();
        fx.classList.toggle('icons', FX.viewMode === 'icons');
        headEl.querySelectorAll('span').forEach(function (s) { s.classList.toggle('sorted', s.getAttribute('data-k') === FX.sortKey); s.classList.toggle('desc', s.getAttribute('data-k') === FX.sortKey && FX.sortDir < 0); });
        if (!t || !on) {
            listEl.innerHTML = '';
            var st = window.files ? window.files.State : 0;
            emptyEl.innerHTML = (st === 1 || st === 2) ? '<div class="fx-spin"></div><div>Conectando aos arquivos do dispositivo…</div>' :
                '<div class="fx-big">' + folderSvg(64) + '</div><div>Conecte para ver os arquivos deste dispositivo</div><button type="button" class="fx-connect" data-c="connect">Conectar</button>';
            emptyEl.style.display = 'flex';
            crumbsEl.innerHTML = ''; statusCount.textContent = ''; statusSel.textContent = '';
            renderSide(); updateCommands();
            return;
        }
        // Histórico de navegação (Voltar/Avançar)
        var key = pathKey();
        if (FX.fromHist) { FX.fromHist = false; }
        else if (FX.hist[FX.hpos] !== key) { FX.hist = FX.hist.slice(0, FX.hpos + 1); FX.hist.push(key); FX.hpos = FX.hist.length - 1; }
        if (!loc().length) { FX.drives = items().filter(function (x) { return x.t < 3; }); }

        var names = {}; items().forEach(function (x) { names[x.n] = 1; });
        Object.keys(FX.sel).forEach(function (n) { if (!names[n]) delete FX.sel[n]; });

        var list = visibleItems();
        listEl.innerHTML = list.map(rowHtml).join('');
        if (!list.length) {
            emptyEl.innerHTML = FX.filter ? '<div>Nenhum item corresponde à pesquisa.</div>' : '<div>Esta pasta está vazia.</div><div class="fx-sub">Arraste arquivos ou pastas do seu PC para cá.</div>';
            emptyEl.style.display = 'flex';
        } else emptyEl.style.display = 'none';
        renderCrumbs(); renderSide(); renderStatus(list);
        syncChecks();
        if (FX.focus) { var f = listEl.querySelector('.fx-row.focus'); if (f && f.scrollIntoView) f.scrollIntoView({ block: 'nearest' }); }
    }

    function renderStatus(list) {
        list = list || visibleItems();
        statusCount.textContent = list.length + (list.length === 1 ? ' item' : ' itens');
        var sel = selected();
        if (!sel.length) { statusSel.textContent = ''; return; }
        var sz = 0, onlyFiles = true; sel.forEach(function (x) { if (x.t === 3) sz += x.s || 0; else onlyFiles = false; });
        statusSel.textContent = sel.length + (sel.length === 1 ? ' item selecionado' : ' itens selecionados') + (onlyFiles ? '  ' + fmtHuman(sz) : '');
    }

    function refreshSelection() {
        listEl.querySelectorAll('.fx-row').forEach(function (r) {
            var n = r.getAttribute('data-n');
            r.classList.toggle('sel', !!FX.sel[n]);
            r.classList.toggle('focus', FX.focus === n);
        });
        renderStatus(); syncChecks();
    }

    // ---------- Menus ----------
    function showMenu(items, x, y) {
        var h = '';
        items.forEach(function (m) {
            if (m === '-') { h += '<div class="fx-msep"></div>'; return; }
            h += '<button type="button" class="fx-mi"' + (m.disabled ? ' disabled' : '') + ' data-c="' + m.c + '">' + (m.icon ? ui(m.icon) : '<span class="fx-i"></span>') + '<span>' + esc(m.label) + '</span>' + (m.key ? '<kbd>' + esc(m.key) + '</kbd>' : '') + (m.check ? '<span class="fx-check">✓</span>' : '') + '</button>';
        });
        popEl.innerHTML = h;
        popEl.hidden = false;
        var r = popEl.getBoundingClientRect();
        popEl.style.left = Math.max(8, Math.min(x, window.innerWidth - r.width - 8)) + 'px';
        popEl.style.top = Math.max(8, Math.min(y, window.innerHeight - r.height - 8)) + 'px';
    }
    function hideMenu() { if (popEl) popEl.hidden = true; }
    function menuBelow(btn, items) { var r = btn.getBoundingClientRect(); showMenu(items, r.left, r.bottom + 4); }

    function selectionMenu() {
        var sel = selected(), one = sel.length === 1 ? sel[0] : null, anyFile = sel.some(function (x) { return x.t === 3; });
        var isZip = one && one.t === 3 && /\.zip$/i.test(one.n);
        return [
            one && one.t < 3 ? { c: 'open', icon: 'open', label: 'Abrir', key: 'Enter' } : { c: 'download', icon: 'download', label: sel.length > 1 ? 'Baixar arquivos' : 'Baixar', key: 'Enter', disabled: !anyFile },
            '-',
            { c: 'cut', icon: 'cut', label: 'Recortar', key: 'Ctrl+X', disabled: !mcEnabled('p13CutButton') },
            { c: 'copy', icon: 'copy', label: 'Copiar', key: 'Ctrl+C', disabled: !mcEnabled('p13CopyButton') },
            { c: 'rename', icon: 'rename', label: 'Renomear', key: 'F2', disabled: !one || !mcEnabled('p13RenameFileButton') },
            { c: 'delete', icon: 'trash', label: 'Excluir', key: 'Delete', disabled: !mcEnabled('p13DeleteFileButton') },
            '-',
            { c: 'zip', icon: 'zip', label: 'Compactar em arquivo ZIP', disabled: !mcEnabled('p13ZipButton') },
            isZip ? { c: 'unzip', icon: 'zip', label: 'Extrair tudo', disabled: !mcEnabled('p13UnzipButton') } : null,
            one && one.t === 3 && one.s <= 204800 ? { c: 'edit', icon: 'edit', label: 'Editar', disabled: !mcEnabled('p13ViewFileButton') } : null
        ].filter(Boolean);
    }
    function backgroundMenu() {
        return [
            { c: 'newFolder', icon: 'plus', label: 'Nova pasta', key: 'Ctrl+Shift+N', disabled: !mcEnabled('p13NewFolderButton') },
            { c: 'newFile', icon: 'docs', label: 'Novo documento de texto', disabled: !mcEnabled('p13NewFileButton') },
            '-',
            { c: 'paste', icon: 'paste', label: 'Colar', key: 'Ctrl+V', disabled: !(window.p13clipboard && window.p13clipboard.length) },
            { c: 'upload', icon: 'upload', label: 'Carregar arquivos do PC…', disabled: !mcEnabled('p13UploadButton') },
            { c: 'uploadDir', icon: 'folderUp', label: 'Carregar pasta do PC…', disabled: !mcEnabled('p13UploadButton') },
            '-',
            { c: 'selectAll', icon: 'selall', label: 'Selecionar tudo', key: 'Ctrl+A' },
            { c: 'refresh', icon: 'refresh', label: 'Atualizar', key: 'F5' }
        ];
    }
    function sortMenu() {
        var m = function (k, l) { return { c: 'sort:' + k, label: l, check: FX.sortKey === k }; };
        return [m('name', 'Nome'), m('date', 'Data de modificação'), m('type', 'Tipo'), m('size', 'Tamanho'), '-',
            { c: 'sortdir:1', label: 'Crescente', check: FX.sortDir > 0 }, { c: 'sortdir:-1', label: 'Decrescente', check: FX.sortDir < 0 }];
    }
    function viewMenu() {
        return [{ c: 'view:details', label: 'Detalhes', check: FX.viewMode === 'details' }, { c: 'view:icons', label: 'Ícones grandes', check: FX.viewMode === 'icons' }];
    }
    function moreMenu() {
        return [
            { c: 'selectAll', icon: 'selall', label: 'Selecionar tudo', key: 'Ctrl+A' },
            { c: 'find', icon: 'find', label: 'Pesquisar em subpastas…', disabled: !mcEnabled('p13FindButton') },
            { c: 'zip', icon: 'zip', label: 'Compactar seleção em ZIP', disabled: !selected().length || !mcEnabled('p13ZipButton') },
            { c: 'uploadDir', icon: 'folderUp', label: 'Carregar pasta do PC…', disabled: !mcEnabled('p13UploadButton') }
        ];
    }
    function handleCmd(c, btn) {
        if (!c) return;
        if (c === 'connect') { var b = $('p13Connect'); if (b && !b.disabled) b.click(); return; }
        if (c === 'menuNew') { menuBelow(btn, [{ c: 'newFolder', icon: 'plus', label: 'Pasta', key: 'Ctrl+Shift+N', disabled: !mcEnabled('p13NewFolderButton') }, { c: 'newFile', icon: 'docs', label: 'Documento de texto', disabled: !mcEnabled('p13NewFileButton') }]); return; }
        if (c === 'menuUpload') { menuBelow(btn, [{ c: 'upload', icon: 'upload', label: 'Arquivos…' }, { c: 'uploadDir', icon: 'folderUp', label: 'Pasta…' }]); return; }
        if (c === 'menuSort') { menuBelow(btn, sortMenu()); return; }
        if (c === 'menuView') { menuBelow(btn, viewMenu()); return; }
        if (c === 'menuMore') { menuBelow(btn, moreMenu()); return; }
        hideMenu();
        if (c.indexOf('sort:') === 0) { FX.sortKey = c.slice(5); render(); return; }
        if (c.indexOf('sortdir:') === 0) { FX.sortDir = parseInt(c.slice(8)); render(); return; }
        if (c.indexOf('view:') === 0) { FX.viewMode = c.slice(5); try { localStorage.setItem('orbFxView', FX.viewMode); } catch (ex) { } render(); return; }
        run(c);
    }

    // ---------- Eventos ----------
    function rowOf(t) { return t && t.closest ? t.closest('.fx-row') : null; }
    function orderNames() { return Array.prototype.map.call(listEl.querySelectorAll('.fx-row'), function (r) { return r.getAttribute('data-n'); }); }

    function clickSelect(e, n) {
        if (e.shiftKey && FX.anchor) {
            var ord = orderNames(), a = ord.indexOf(FX.anchor), b = ord.indexOf(n);
            if (!(e.ctrlKey || e.metaKey)) FX.sel = {};
            for (var i = Math.min(a, b); i <= Math.max(a, b); i++) if (i >= 0) FX.sel[ord[i]] = true;
        } else if (e.ctrlKey || e.metaKey) {
            if (FX.sel[n]) delete FX.sel[n]; else FX.sel[n] = true;
            FX.anchor = n;
        } else {
            FX.sel = {}; FX.sel[n] = true; FX.anchor = n;
        }
        FX.focus = n;
        refreshSelection();
    }

    function bind() {
        fx.addEventListener('click', function (e) {
            var b = e.target.closest('button[data-c]');
            if (b && fx.contains(b) && !b.disabled) { e.preventDefault(); handleCmd(b.getAttribute('data-c'), b); return; }
            var cr = e.target.closest('.fx-crumb');
            if (cr) { e.preventDefault(); FX.sel = {}; if (has('p13folderup')) window.p13folderup(parseInt(cr.getAttribute('data-up'))); return; }
            var lk = e.target.closest('.fx-link');
            if (lk) { e.preventDefault(); FX.sel = {}; gotoPath(lk.getAttribute('data-path')); return; }
            var hd = e.target.closest('.fx-head span');
            if (hd) { var k = hd.getAttribute('data-k'); if (FX.sortKey === k) FX.sortDir = -FX.sortDir; else { FX.sortKey = k; FX.sortDir = 1; } render(); return; }
            var addr = e.target.closest('.fx-address');
            if (addr && !e.target.closest('.fx-crumb')) { startPathEdit(); return; }
        });
        popEl.addEventListener('click', function (e) { var b = e.target.closest('button[data-c]'); if (b && !b.disabled) handleCmd(b.getAttribute('data-c'), b); });
        document.addEventListener('mousedown', function (e) { if (!popEl.hidden && !popEl.contains(e.target) && !e.target.closest('.fx-cmd button')) hideMenu(); }, true);

        listEl.addEventListener('mousedown', function (e) {
            if (e.button !== 0) return;
            var r = rowOf(e.target);
            if (!r) return;
            var n = r.getAttribute('data-n');
            // Clique simples num item já selecionado (sem modificador) mantém a seleção para permitir arrastar vários.
            if (FX.sel[n] && !e.shiftKey && !e.ctrlKey && !e.metaKey) { FX.pendingSingle = n; return; }
            clickSelect(e, n);
        });
        listEl.addEventListener('click', function (e) {
            var r = rowOf(e.target);
            if (r && FX.pendingSingle === r.getAttribute('data-n')) { FX.sel = {}; FX.sel[FX.pendingSingle] = true; FX.anchor = FX.focus = FX.pendingSingle; refreshSelection(); }
            FX.pendingSingle = null;
        });
        fx.querySelector('.fx-main').addEventListener('mousedown', function (e) {
            if (e.button === 0 && !rowOf(e.target) && !e.target.closest('.fx-head') && !e.target.closest('button')) { FX.sel = {}; FX.focus = null; refreshSelection(); }
        });
        listEl.addEventListener('dblclick', function (e) { var r = rowOf(e.target); if (r) openItem(byName(r.getAttribute('data-n'))); });
        fx.querySelector('.fx-main').addEventListener('contextmenu', function (e) {
            e.preventDefault(); e.stopPropagation();
            var r = rowOf(e.target);
            if (r) { var n = r.getAttribute('data-n'); if (!FX.sel[n]) { FX.sel = {}; FX.sel[n] = true; FX.anchor = FX.focus = n; refreshSelection(); } syncChecks(); showMenu(selectionMenu(), e.clientX, e.clientY); }
            else { FX.sel = {}; refreshSelection(); showMenu(backgroundMenu(), e.clientX, e.clientY); }
        }, true);

        // Arrastar daqui para o Windows (baixa) e para uma pasta daqui (move)
        listEl.addEventListener('dragstart', function (e) {
            var r = rowOf(e.target);
            if (!r) return;
            var n = r.getAttribute('data-n');
            if (!FX.sel[n]) { FX.sel = {}; FX.sel[n] = true; FX.anchor = FX.focus = n; refreshSelection(); }
            var sel = selected();
            e.dataTransfer.effectAllowed = 'copyMove';
            e.dataTransfer.setData('application/x-orb-files', JSON.stringify(sel.map(function (x) { return x.n; })));
            var file = sel.filter(function (x) { return x.t === 3; })[0];
            if (file) {
                var url = new URL(fileUrl(file), document.baseURI).href;
                e.dataTransfer.setData('DownloadURL', 'application/octet-stream:' + file.n.replace(/:/g, '_') + ':' + url);
                e.dataTransfer.setData('text/plain', file.n);
            }
            FX.dragging = sel.map(function (x) { return x.n; });
            if (sel.filter(function (x) { return x.t === 3; }).length > 1) toast('Para o PC vai um arquivo por arrasto — para vários, use Baixar');
        });
        listEl.addEventListener('dragend', function () { FX.dragging = null; clearDrop(); });

        var main = fx.querySelector('.fx-main');
        var external = function (e) { var t = e.dataTransfer && e.dataTransfer.types; return !!t && Array.prototype.indexOf.call(t, 'Files') >= 0 && !FX.dragging; };
        main.addEventListener('dragover', function (e) {
            var r = rowOf(e.target), folder = r && r.classList.contains('dir') && !(FX.dragging && FX.dragging.indexOf(r.getAttribute('data-n')) >= 0) ? r : null;
            if (external(e)) {
                e.preventDefault(); e.dataTransfer.dropEffect = 'copy';
                markTarget(folder);
                dropEl.querySelector('.fx-drop-t').innerHTML = 'Soltar para enviar para <b>' + esc(folder ? folder.getAttribute('data-n') : (loc().slice(-1)[0] || (isWin() ? 'Este Computador' : '/'))) + '</b>';
                dropEl.classList.add('on');
            } else if (FX.dragging && folder) {
                e.preventDefault(); e.dataTransfer.dropEffect = 'move'; markTarget(folder);
            } else { markTarget(null); }
        });
        main.addEventListener('dragleave', function (e) { if (!main.contains(e.relatedTarget)) clearDrop(); });
        main.addEventListener('drop', function (e) {
            var r = rowOf(e.target), folder = r && r.classList.contains('dir') ? r.getAttribute('data-n') : null;
            if (external(e)) {
                e.preventDefault(); e.stopPropagation();
                var list = collect(e.dataTransfer);
                clearDrop();
                if (!loc().length && !folder) { toast('Abra uma unidade ou pasta antes de enviar'); return; }
                upload(list, folder ? loc().concat([folder]) : loc());
            } else if (FX.dragging && folder && FX.dragging.indexOf(folder) < 0) {
                e.preventDefault();
                var names = FX.dragging.slice(); clearDrop();
                moveInto(names, folder);
            } else clearDrop();
        });

        // Endereço digitável e pesquisa
        pathInput.addEventListener('keydown', function (e) {
            e.stopPropagation();
            if (e.key === 'Enter') { e.preventDefault(); var v = pathInput.value.trim(); stopPathEdit(); if (/^este computador$/i.test(v)) v = ''; gotoPath(v); }
            else if (e.key === 'Escape') { e.preventDefault(); stopPathEdit(); }
        });
        pathInput.addEventListener('blur', stopPathEdit);
        searchInput.addEventListener('input', function () { FX.filter = searchInput.value; render(); });
        searchInput.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Escape') { searchInput.value = ''; FX.filter = ''; render(); } });

        window.addEventListener('keydown', onKey, true);
        document.addEventListener('paste', onPaste, true);
        window.addEventListener('blur', function () { FX.lastBlurAt = Date.now(); });
        window.addEventListener('resize', fit);
    }
    function markTarget(r) { listEl.querySelectorAll('.fx-row.drop').forEach(function (x) { if (x !== r) x.classList.remove('drop'); }); if (r) r.classList.add('drop'); }
    function clearDrop() { dropEl.classList.remove('on'); markTarget(null); }
    function startPathEdit() {
        if (!connected()) return;
        var p = loc().join(isWin() ? '\\' : '/');
        pathInput.value = isWin() ? (p || 'Este Computador') : '/' + p;
        fx.querySelector('.fx-address').classList.add('editing');
        pathInput.focus(); pathInput.select();
    }
    function stopPathEdit() { fx.querySelector('.fx-address').classList.remove('editing'); }

    function onKey(e) {
        if (view() !== 13 || window.xxdialogMode || !fx || typing(e.target)) return;
        if (!popEl.hidden && e.key === 'Escape') { hideMenu(); return; }
        if (!connected() || !tree()) return;
        var k = e.key, ctrl = e.ctrlKey || e.metaKey, done = true;
        if (ctrl && !e.shiftKey && (k === 'a' || k === 'A')) run('selectAll');
        else if (ctrl && !e.shiftKey && (k === 'c' || k === 'C')) run('copy');
        else if (ctrl && !e.shiftKey && (k === 'x' || k === 'X')) run('cut');
        else if (ctrl && !e.shiftKey && (k === 'v' || k === 'V')) {
            // Deixa o navegador disparar "colar": se vierem arquivos do PC, eles são enviados.
            clearTimeout(FX.pasteTimer);
            FX.pasteTimer = setTimeout(function () { FX.pasteTimer = null; remotePaste(); }, 150);
            e.stopPropagation(); return;
        }
        else if (ctrl && e.shiftKey && (k === 'n' || k === 'N')) newFolder();
        else if (k === 'Delete') run('delete');
        else if (k === 'F2') run('rename');
        else if (k === 'F5') refresh();
        else if (k === 'Enter') run('open');
        else if (k === 'Backspace' || (e.altKey && k === 'ArrowLeft')) goHist(-1);
        else if (e.altKey && k === 'ArrowRight') goHist(1);
        else if (e.altKey && k === 'ArrowUp') goUp();
        else if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Home' || k === 'End') {
            var ord = orderNames(); if (!ord.length) return;
            var i = ord.indexOf(FX.focus);
            i = k === 'Home' ? 0 : k === 'End' ? ord.length - 1 : (i < 0 ? 0 : i + (k === 'ArrowDown' ? 1 : -1));
            i = Math.max(0, Math.min(ord.length - 1, i));
            clickSelect({ shiftKey: e.shiftKey, ctrlKey: false }, ord[i]);
            var r = listEl.querySelector('.fx-row.focus'); if (r) r.scrollIntoView({ block: 'nearest' });
        }
        else done = false;
        if (done) { e.preventDefault(); e.stopPropagation(); }
    }

    function onPaste(e) {
        if (view() !== 13 || !fx || typing(e.target) || window.xxdialogMode) return;
        clearTimeout(FX.pasteTimer); FX.pasteTimer = null;
        var list = collect(e.clipboardData);
        var remoteFresh = !!(window.p13clipboard && window.p13clipboard.length) && FX.remoteCopyAt > FX.lastBlurAt;
        e.preventDefault();
        if (list.length && !remoteFresh) {
            if (!loc().length) { toast('Abra uma unidade ou pasta antes de colar'); return; }
            upload(list, loc());
        } else remotePaste();
    }

    // Altura: a tela ocupa o espaço até o fim da área de conteúdo.
    function fit() {
        if (!fx || view() !== 13 || document.body.classList.contains('fulldesk')) return;
        var col = $('column_l');
        if (!col || !fx.offsetParent) return;
        var h = col.getBoundingClientRect().bottom - fx.getBoundingClientRect().top - 8;
        fx.style.height = Math.max(320, Math.round(h)) + 'px';
    }

    // ---------- Integração ----------
    function wrap(name, after, before) {
        var orig = window[name];
        if (typeof orig !== 'function' || orig.__orbfx) return;
        var w = function () {
            if (before) { var stop = safe(function () { return before.apply(null, arguments); }.bind(null, arguments)); if (stop === false) return; }
            var r = orig.apply(this, arguments);
            safe(after);
            return r;
        };
        w.__orbfx = true;
        window[name] = w;
    }

    function init() {
        if (!build()) return;
        wrap('p13updateFiles', render);
        wrap('onFilesStateChange', function () { setTimeout(function () { render(); fetchDrives(); }, 0); });
        wrap('p13uploadFileTransferDone', function () { if (FX.uploading) setTimeout(nextBatch, 60); });
        wrap('p13uploadFileCancel', function () { }, function () { FX.queue = []; FX.uploading = false; });
        // Unidades (C:, D:...) para o painel lateral, sem mudar a pasta aberta.
        wrap('p13gotFiles', function () { }, function (args) {
            var d = args[0];
            if (typeof d === 'string' && d.charCodeAt(0) === 123) {
                try {
                    var j = JSON.parse(d);
                    if (j && j.dir && (j.path === '\\' || j.path === '/' || j.path === '')) {
                        FX.drives = []; for (var i in j.dir) { var x = j.dir[i]; if (x && parseInt(x.t) < 3) FX.drives.push({ n: x.n, t: 1, dt: x.dt }); }
                        if (fx) renderSide();
                        if (j.reqid === 7331) return false; // pedido nosso: não mexe na lista atual
                    }
                } catch (ex) { }
            }
        });
        document.addEventListener('orb:view', function (e) { if (e.detail === 13) { render(); setTimeout(fit, 0); } });
        render();
    }
    var drivesAsked = null;
    function fetchDrives() {
        var f = window.files;
        if (!f || f.State !== 3 || !isWin()) return;
        if (drivesAsked === f) return;
        drivesAsked = f;
        safe(function () { f.sendText({ action: 'ls', reqid: 7331, path: '' }); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
