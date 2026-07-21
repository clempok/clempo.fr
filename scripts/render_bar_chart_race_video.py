#!/usr/bin/env python3
"""Rend une vidéo bar chart race (charte Clempo) pour une spécialité.

Lit public/data/specialites/<slug>.json, produit un MP4 carré 1080×1080
prêt pour LinkedIn (H.264, yuv420p, +faststart) via Pillow → ffmpeg.

  python3 scripts/render_bar_chart_race_video.py medecins-specialistes
  python3 scripts/render_bar_chart_race_video.py medecins-specialistes sortie.mp4

Dépendances : Pillow + ffmpeg (pas de matplotlib/numpy).
"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / 'public' / 'data' / 'specialites'
FONT_DIR = ROOT / 'reports-rebrand' / 'fonts' / 'inter_x' / 'extras' / 'ttf'
MENLO = '/System/Library/Fonts/Menlo.ttc'

# ── Charte Clempo « ClearSharpHealthcare » ────────────────────────────
INK = (10, 10, 11)
PAPER = (237, 235, 228)
PAPER_SOFT = (244, 244, 242)
SIGNAL = (0, 214, 143)
SIGNAL_DEEP = (0, 158, 104)
STEEL = (107, 111, 122)
TRACK = (223, 221, 214)     # border/track sur paper
WORD_DOT = SIGNAL

# ── Palette éditeur (identique à src/components/BarChartRace.tsx) ──────
COLOR_PALETTE = [
    '#1f3864', '#0a9396', '#ee9b00', '#bb3e03', '#9b2226', '#5f0f40',
    '#005f73', '#6a994e', '#7209b7', '#3a0ca3', '#b5179e', '#0f4c5c',
    '#94d2bd', '#a98467', '#bc6c25', '#4f6da6', '#dda15e', '#560bad',
    '#386641', '#d62828', '#588157', '#8338ec', '#3a86ff', '#fb5607',
    '#06a77d', '#5e503f', '#22577a', '#264653', '#e76f51', '#2a9d8f',
]
AUTRES_COLOR = (184, 188, 196)  # #B8BCC4


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


PALETTE_RGB = [hex_rgb(c) for c in COLOR_PALETTE]


def fnv1a(s):
    h = 0x811c9dc5
    for ch in s:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


def color_for(label):
    if 'Autres' in label:
        return AUTRES_COLOR
    editor = label.split(' — ')[1] if ' — ' in label else label
    return PALETTE_RGB[fnv1a(editor) % len(PALETTE_RGB)]


def parse_label(label):
    parts = label.split(' — ')
    return (parts[0], parts[1] if len(parts) > 1 else '')


def mix(c, other, t):
    """t=0 -> c, t=1 -> other."""
    return tuple(round(c[i] + (other[i] - c[i]) * t) for i in range(3))


MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
             'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

# ── Géométrie 1080×1080 ───────────────────────────────────────────────
W = H = 1080
MARGIN = 56
CHART_TOP = 320
ROW_STRIDE = 60
BAR_H = 46
LABEL_RIGHT = 372            # les labels finissent ici
BAR_LEFT = 392               # les barres commencent ici
BAR_MAX_W = 500              # largeur barre à valeur = maxv
TOP_N = 10


def load_font(path, size, index=0):
    try:
        return ImageFont.truetype(str(path), size, index=index)
    except Exception:
        return ImageFont.truetype(str(FONT_DIR / 'Inter-Regular.ttf'), size)


def fit(draw, text, font, max_w):
    if draw.textlength(text, font=font) <= max_w:
        return text
    ell = '…'
    while text and draw.textlength(text + ell, font=font) > max_w:
        text = text[:-1]
    return (text + ell) if text else ell


def main():
    slug = sys.argv[1] if len(sys.argv) > 1 else 'medecins-specialistes'
    data = json.load(open(DATA_DIR / f'{slug}.json', encoding='utf-8'))
    months = data['months']
    monthly = data['monthly_data']
    progs = data['all_progiciels']
    title = data.get('_title', slug).split('—')[-1].strip()
    N = len(months)
    BIG = len(progs) + 50

    out = Path(sys.argv[2]) if len(sys.argv) > 2 else \
        ROOT / 'Extract GIE' / f'{slug}_bar_chart_race_clempo.mp4'
    out.parent.mkdir(parents=True, exist_ok=True)

    # pré-calcul valeurs + rangs par mois
    vals, rankpos = [], []
    for k in months:
        md = monthly[k]
        vals.append(md)
        order = sorted(md.items(), key=lambda x: -x[1])
        rankpos.append({p: i for i, (p, _) in enumerate(order)})

    # polices
    f_eyebrow = load_font(MENLO, 20)
    f_title = load_font(FONT_DIR / 'Inter-ExtraBold.ttf', 54)
    f_sub = load_font(FONT_DIR / 'Inter-Regular.ttf', 23)
    f_year = load_font(FONT_DIR / 'Inter-Bold.ttf', 66)
    f_month = load_font(FONT_DIR / 'Inter-Medium.ttf', 30)
    f_counter = load_font(MENLO, 19)
    f_prog = load_font(FONT_DIR / 'Inter-SemiBold.ttf', 25)
    f_editor = load_font(FONT_DIR / 'Inter-Regular.ttf', 15)
    f_value = load_font(FONT_DIR / 'Inter-Bold.ttf', 26)
    f_word = load_font(FONT_DIR / 'Inter-ExtraBold.ttf', 30)
    f_foot = load_font(MENLO, 18)

    def render(m, t):
        k0, k1 = m, min(m + 1, N - 1)
        img = Image.new('RGB', (W, H), PAPER)
        d = ImageDraw.Draw(img)

        # ── header
        d.text((MARGIN, 60), '// PARTS DE TÉLÉTRANSMISSION · GIE SESAM-VITALE',
               font=f_eyebrow, fill=SIGNAL_DEEP)
        d.text((MARGIN, 96), title, font=f_title, fill=INK)
        d.text((MARGIN, 168),
               'Logiciels les plus utilisés · parts de feuilles de soins télétransmises',
               font=f_sub, fill=STEEL)

        # date (haut droite)
        yv, mv = months[k0].split('-')
        mname = MONTHS_FR[int(mv) - 1]
        yw = d.textlength(yv, font=f_year)
        d.text((W - MARGIN - yw, 92), yv, font=f_year, fill=INK)
        mw = d.textlength(mname, font=f_month)
        d.text((W - MARGIN - mw, 70), mname, font=f_month, fill=STEEL)
        counter = f'{k0 + 1:02d} / {N}'
        cw = d.textlength(counter, font=f_counter)
        d.text((W - MARGIN - cw, 168), counter, font=f_counter, fill=STEEL)

        # barre de progression timeline
        py = 250
        d.rounded_rectangle([MARGIN, py, W - MARGIN, py + 4], radius=2, fill=TRACK)
        prog_t = (m + t) / (N - 1)
        d.rounded_rectangle([MARGIN, py, MARGIN + int((W - 2 * MARGIN) * prog_t), py + 4],
                            radius=2, fill=SIGNAL)

        # ── barres (interpolation valeur + rang)
        draw_list = []
        maxv = 5.0
        for p in progs:
            v0 = vals[k0].get(p, 0.0)
            v1 = vals[k1].get(p, 0.0)
            r0 = rankpos[k0].get(p, BIG)
            r1 = rankpos[k1].get(p, BIG)
            v = v0 + (v1 - v0) * t
            r = r0 + (r1 - r0) * t
            if r < TOP_N + 0.6:
                draw_list.append((p, v, r))
                maxv = max(maxv, v)
        draw_list.sort(key=lambda x: x[2])

        for p, v, r in draw_list:
            alpha = 1.0
            if r > TOP_N - 1:                       # fondu entrée/sortie
                alpha = max(0.0, (TOP_N + 0.6 - r) / 1.6)
                alpha = min(1.0, alpha)
            y = CHART_TOP + r * ROW_STRIDE
            cy = y + BAR_H / 2
            base = color_for(p)
            col = mix(base, PAPER, 1 - alpha)
            ink_a = mix(INK, PAPER, 1 - alpha)
            steel_a = mix(STEEL, PAPER, 1 - alpha)
            bw = max(6, (v / maxv) * BAR_MAX_W)
            d.rounded_rectangle([BAR_LEFT, y, BAR_LEFT + bw, y + BAR_H],
                                radius=4, fill=col)
            # label (progiciel + éditeur) aligné à droite
            prog, editor = parse_label(p)
            prog_disp = 'Autres' if prog.startswith('Autres') else prog
            prog_disp = fit(d, prog_disp, f_prog, LABEL_RIGHT - MARGIN)
            pw = d.textlength(prog_disp, font=f_prog)
            if editor:
                d.text((LABEL_RIGHT - pw, cy - 24), prog_disp, font=f_prog, fill=ink_a)
                ed = fit(d, editor, f_editor, LABEL_RIGHT - MARGIN)
                ew = d.textlength(ed, font=f_editor)
                d.text((LABEL_RIGHT - ew, cy + 4), ed, font=f_editor, fill=steel_a)
            else:
                d.text((LABEL_RIGHT - pw, cy - 13), prog_disp, font=f_prog, fill=ink_a)
            # valeur à la pointe
            val_txt = f'{v:.1f}'.replace('.', ',') + ' %'
            d.text((BAR_LEFT + bw + 14, cy - 15), val_txt, font=f_value, fill=ink_a)

        # ── footer
        fy = 1006
        d.line([MARGIN, fy - 18, W - MARGIN, fy - 18], fill=TRACK, width=1)
        d.text((MARGIN, fy), 'clempo', font=f_word, fill=INK)
        ww = d.textlength('clempo', font=f_word)
        d.ellipse([MARGIN + ww + 6, fy + 22, MARGIN + ww + 15, fy + 31], fill=WORD_DOT)
        src = 'clempo.fr/parts-de-marche-logiciels-medicaux'
        sw = d.textlength(src, font=f_foot)
        d.text((W - MARGIN - sw, fy + 8), src, font=f_foot, fill=STEEL)

        return img

    # séquence de frames
    FPM = 9
    intro, outro = 18, 84
    frames = [(0, 0.0)] * intro
    for m in range(N - 1):
        for s in range(FPM):
            frames.append((m, s / FPM))
    frames += [(N - 1, 0.0)] * outro
    total = len(frames)
    print(f'{slug}: {total} frames ({total / 30:.1f}s @30fps) → {out.name}')

    ff = subprocess.Popen([
        'ffmpeg', '-y', '-loglevel', 'error',
        '-f', 'rawvideo', '-pixel_format', 'rgb24',
        '-video_size', f'{W}x{H}', '-framerate', '30', '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(out),
    ], stdin=subprocess.PIPE)

    for i, (m, t) in enumerate(frames):
        ff.stdin.write(render(m, t).tobytes())
        if i % 120 == 0:
            print(f'  {i}/{total}', flush=True)
    ff.stdin.close()
    ff.wait()
    if ff.returncode != 0:
        raise SystemExit('ffmpeg a échoué')
    print(f'OK → {out}')


if __name__ == '__main__':
    main()
