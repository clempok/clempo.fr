"""
Bannière LinkedIn Clempo — 1584×396 (+ export @2x).

Reprend la composition de la v2 (avril 2026) : wordmark à gauche, eyebrow mono
verte + titre sérif/sans au centre, colonne de références à droite, CTA en bas.
Rendu en 2× puis downscalé pour un antialiasing propre.

Usage: python3 scripts/render_linkedin_banner.py
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path

# ─── Tokens ────────────────────────────────────────────────
W, H = 1584, 396
S = 2  # supersampling

PAPER    = (244, 241, 236)
INK      = (11, 11, 12)
STEEL    = (107, 106, 102)
SIGNAL   = (34, 197, 94)
HAIRLINE = (231, 227, 220)
WHITE    = (255, 255, 255)

FONTS = Path(
    "/Users/pom1986/Library/Application Support/Claude/local-agent-mode-sessions"
    "/skills-plugin/ca531e7f-5547-4ae5-ae76-52ff3649c89f"
    "/04a208ed-8fb3-4267-b82c-4f66957e6e90/skills/canvas-design/canvas-fonts"
)
F_SANS       = str(FONTS / "InstrumentSans-Regular.ttf")
F_SANS_BOLD  = str(FONTS / "InstrumentSans-Bold.ttf")
F_SERIF_IT   = str(FONTS / "InstrumentSerif-Italic.ttf")
F_MONO       = str(FONTS / "JetBrainsMono-Regular.ttf")
F_MONO_BOLD  = str(FONTS / "JetBrainsMono-Bold.ttf")

# ─── Contenu ───────────────────────────────────────────────
EYEBROW    = "// PRODUCT MARKETING · GTM · PLG · GROWTH MARKETING"
HEAD_SANS  = "Healthcare Marketing"
HEAD_SERIF = "Director"
CREDS      = "— 12 YEARS · Trusted by 25+ clients"

# Ordre de public/content.json → clients[] (Patrimovie exclu : hors santé).
# Découpage en 5 lignes de largeur équilibrée (max ≈ 350 px pour un filet de 368).
CLIENT_ROWS = [
    ["doctolib", "kiro", "recept ai", "vera health"],
    ["axomove", "lucidia", "santé académie"],
    ["cherry biotech", "neok", "médéré"],
    ["sorcova", "doccity", "semble"],
    ["andrew", "sofia développement"],
]
DOT_GAP = 6.5  # air de part et d'autre du séparateur ·

CTA_TOP    = "BOOK A 30-MIN INTRO CALL"
CTA_BOTTOM = "CLEMPO.FR/BOOKING"

# ─── Grille (coordonnées 1×) ───────────────────────────────
WORDMARK_X, WORDMARK_TOP = 134, 36

CENTER_X    = 436
EYEBROW_TOP = 48
HEAD1_TOP   = 82
HEAD2_TOP   = 143

PILL = (442, 247, 704, 331)          # x0, y0, x1, y1
DOT_C, DOT_R = (649, 289), 20

RIGHT_EDGE  = 1495
RULE_X      = 1128
CREDS_TOP   = 40
ROW_PITCH   = 44
FIRST_RULE  = 70
BASE_OFFSET = 30                     # baseline sous le filet
CTA_TOP_Y, CTA_BOTTOM_Y = 316, 335


def font(path, size):
    return ImageFont.truetype(path, int(round(size * S)))


def adv(d, text, ft, ls=0.0):
    if not ls:
        return d.textlength(text, font=ft)
    return sum(d.textlength(c, font=ft) for c in text) + ls * S * (len(text) - 1)


def tracked(d, xy, text, ft, fill, ls=0.0):
    x, y = xy
    for c in text:
        d.text((x, y), c, font=ft, fill=fill)
        x += d.textlength(c, font=ft) + ls * S


def top_anchored(d, x, ink_top, text, ft, fill, ls=0.0, stroke=0):
    """Dessine `text` de sorte que le haut de son encre tombe sur ink_top (1×).

    `stroke` épaissit le trait d'un demi-pixel 1× par côté : le titre de la v2
    tenait un poids intermédiaire (jambages 5 px) entre Regular et Bold.
    """
    _, off_y = ft.getbbox(text)[:2]
    y = ink_top * S - off_y
    if ls:
        tracked(d, (x, y), text, ft, fill, ls)
    else:
        d.text((x, y), text, font=ft, fill=fill,
               stroke_width=stroke, stroke_fill=fill)
    return y


def right_top_anchored(d, right, ink_top, text, ft, fill, ls=0.0):
    x = right * S - adv(d, text, ft, ls)
    return top_anchored(d, x, ink_top, text, ft, fill, ls)


def main():
    canvas = Image.new("RGB", (W * S, H * S), PAPER)
    d = ImageDraw.Draw(canvas)

    # ── Wordmark ───────────────────────────────────────────
    wm = font(F_SANS_BOLD, 20)
    y = top_anchored(d, WORDMARK_X * S, WORDMARK_TOP, "clempo", wm, INK)
    d.text((WORDMARK_X * S + d.textlength("clempo", font=wm), y), ".", font=wm, fill=SIGNAL)

    # ── Eyebrow centre ─────────────────────────────────────
    top_anchored(d, CENTER_X * S, EYEBROW_TOP, EYEBROW, font(F_MONO, 16), SIGNAL, ls=0.6)

    # ── Titre ──────────────────────────────────────────────
    top_anchored(d, CENTER_X * S, HEAD1_TOP, HEAD_SANS, font(F_SANS, 56), INK, stroke=1)
    top_anchored(d, (CENTER_X - 3) * S, HEAD2_TOP, HEAD_SERIF, font(F_SERIF_IT, 68), INK, stroke=1)

    # ── Pill CTA ───────────────────────────────────────────
    x0, y0, x1, y1 = [v * S for v in PILL]
    radius = (y1 - y0) / 2
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [x0 + 2 * S, y0 + 7 * S, x1 + 2 * S, y1 + 7 * S], radius=radius, fill=(10, 10, 11, 60)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(9 * S))
    canvas.paste(Image.alpha_composite(canvas.convert("RGBA"), shadow).convert("RGB"), (0, 0))
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=INK)

    pill_font = font(F_SANS_BOLD, 28)
    pt = "clempo.fr"
    pb = pill_font.getbbox(pt)
    d.text((480 * S, (y0 + y1) / 2 - (pb[1] + pb[3]) / 2), pt, font=pill_font, fill=WHITE)

    cx, cy, r = DOT_C[0] * S, DOT_C[1] * S, DOT_R * S
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=SIGNAL)
    aw, ah = 6.5 * S, 5.0 * S
    d.line([cx - aw, cy, cx + aw - 0.5 * S, cy], fill=WHITE, width=int(1.7 * S))
    d.line([cx + aw - ah, cy - ah, cx + aw, cy], fill=WHITE, width=int(1.7 * S))
    d.line([cx + aw - ah, cy + ah, cx + aw, cy], fill=WHITE, width=int(1.7 * S))

    # ── Colonne références ─────────────────────────────────
    right_top_anchored(d, RIGHT_EDGE, CREDS_TOP, CREDS, font(F_MONO, 16), SIGNAL, ls=0.8)

    row_font = font(F_SANS, 21)
    asc = row_font.getmetrics()[0]
    dot_w = d.textlength("·", font=row_font)
    step = dot_w + 2 * DOT_GAP * S

    for i, names in enumerate(CLIENT_ROWS):
        rule_y = (FIRST_RULE + i * ROW_PITCH) * S
        d.rectangle([RULE_X * S, rule_y, RIGHT_EDGE * S, rule_y + 2 * S - 1], fill=HAIRLINE)

        width = sum(d.textlength(n, font=row_font) for n in names) + (len(names) - 1) * step
        x, top = RIGHT_EDGE * S - width, rule_y + BASE_OFFSET * S - asc
        print(f"  row {i+1}: {width/S:6.1f} px  ({' · '.join(names)})")
        for j, name in enumerate(names):
            d.text((x, top), name, font=row_font, fill=INK)
            x += d.textlength(name, font=row_font)
            if j < len(names) - 1:
                d.text((x + DOT_GAP * S, top), "·", font=row_font, fill=INK)
                x += step

    # ── CTA bas ────────────────────────────────────────────
    right_top_anchored(d, RIGHT_EDGE, CTA_TOP_Y, CTA_TOP, font(F_MONO, 15), STEEL, ls=1.6)
    right_top_anchored(d, RIGHT_EDGE, CTA_BOTTOM_Y, CTA_BOTTOM, font(F_MONO_BOLD, 15), INK, ls=1.6)

    # ── Export ─────────────────────────────────────────────
    out_dir = Path.home() / "Downloads"
    hi = out_dir / "clempo-linkedin-banner-2026@2x.png"
    lo = out_dir / "clempo-linkedin-banner-2026.png"
    canvas.save(hi, "PNG", optimize=True)
    canvas.resize((W, H), Image.LANCZOS).save(lo, "PNG", optimize=True)
    print(f"✓ {lo} ({W}×{H})")
    print(f"✓ {hi} ({W*S}×{H*S})")


if __name__ == "__main__":
    main()
