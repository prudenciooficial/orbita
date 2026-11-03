#!/usr/bin/env python3
# Gera public/styles/custom.css a partir de orbita.src.css trocando %%ICON:nome%% por data URIs.
import re, sys, os, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from icons import svg

here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, 'orbita.src.css'), encoding='utf-8').read()

def rep(m):
    data = urllib.parse.quote(svg(m.group(1)), safe=' =:/"-.,')
    return 'url("data:image/svg+xml,%s")' % data.replace('"', "'")

def repc(m):
    data = urllib.parse.quote(svg(m.group(1), stroke=m.group(2)), safe=' =:/"-.,')
    return 'url("data:image/svg+xml,%s")' % data.replace('"', "'")

out = re.sub(r'%%ICONC:([a-z0-9-]+):(#[0-9a-fA-F]{3,8})%%', repc, src)
out = re.sub(r'%%ICON:([a-z0-9-]+)%%', rep, out)
dest = sys.argv[1]
os.makedirs(os.path.dirname(dest), exist_ok=True)
open(dest, 'w', encoding='utf-8').write(out)
print('ok', dest, len(out), 'bytes')
