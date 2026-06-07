"""
Annuaire Brutaliste — LinkedIn 1080×1080 square
v2: the artifact (GSheet) dominates. Text recedes to whispers.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path

# ─── Tokens ────────────────────────────────────────────────
CANVAS = 1080
PAPER  = (237, 235, 228)
INK    = (10, 10, 11)
STEEL  = (107, 111, 122)
SIGNAL = (0, 214, 143)
SIGNAL_DEEP = (0, 158, 104)

FONTS = Path("/Users/pom1986/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/ca531e7f-5547-4ae5-ae76-52ff3649c89f/04a208ed-8fb3-4267-b82c-4f66957e6e90/skills/canvas-design/canvas-fonts")
F_SANS      = str(FONTS / "InstrumentSans-Regular.ttf")
F_SANS_BOLD = str(FONTS / "InstrumentSans-Bold.ttf")
F_MONO      = str(FONTS / "JetBrainsMono-Regular.ttf")
F_MONO_BOLD = str(FONTS / "JetBrainsMono-Bold.ttf")


def font(path, size):
    return ImageFont.truetype(path, size)


def text_width(draw, text, ft, letter_spacing=0):
    if not letter_spacing:
        return draw.textlength(text, font=ft)
    return sum(draw.textlength(ch, font=ft) for ch in text) + letter_spacing * max(0, len(text) - 1)


def draw_tracked(draw, xy, text, ft, fill, letter_spacing=0):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=ft, fill=fill)
        x += draw.textlength(ch, font=ft) + letter_spacing


# ─── GSheet mockup ─────────────────────────────────────────
def render_sheet_mockup(width, rows_count=16):
    pad = 36

    toolbar_h = 50
    header_h  = 40
    row_h     = 38
    footer_h  = 38

    sheet_w = width
    sheet_h = toolbar_h + header_h + row_h * rows_count + footer_h

    img = Image.new("RGBA", (sheet_w + pad * 2, sheet_h + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    x0, y0 = pad, pad
    x1, y1 = x0 + sheet_w, y0 + sheet_h
    radius = 12

    # Sheet body
    d.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=(255, 255, 255, 255),
                        outline=(0, 0, 0, 32), width=1)

    # ── Toolbar ─────────────────────────────────────
    d.rounded_rectangle([x0, y0, x1, y0 + toolbar_h], radius=radius, fill=(248, 249, 250, 255))
    d.rectangle([x0, y0 + radius, x1, y0 + toolbar_h], fill=(248, 249, 250, 255))
    d.line([x0, y0 + toolbar_h, x1, y0 + toolbar_h], fill=(224, 224, 224, 255), width=1)

    icon_size = 26
    icon_x = x0 + 20
    icon_y = y0 + (toolbar_h - icon_size) // 2
    d.rounded_rectangle([icon_x, icon_y, icon_x + icon_size, icon_y + icon_size],
                        radius=4, fill=(15, 157, 88, 255))
    ic_font = font(F_SANS_BOLD, 16)
    ic_w = d.textlength("▦", font=ic_font)
    d.text((icon_x + (icon_size - ic_w) / 2, icon_y + 2), "▦",
           font=ic_font, fill=(255, 255, 255, 255))

    fn_font = font(F_SANS, 18)
    sub_font = font(F_MONO, 12)
    d.text((icon_x + icon_size + 12, y0 + 7),
           "8 836 décideurs hospitaliers · France",
           font=fn_font, fill=(32, 33, 36, 255))
    d.text((icon_x + icon_size + 12, y0 + 30),
           "Google Sheets · partagé",
           font=sub_font, fill=(95, 99, 104, 255))

    dot_y = y0 + toolbar_h // 2
    for i, dot_color in enumerate([(255, 95, 87), (255, 189, 46), (40, 202, 66)]):
        dx = x1 - 22 - (2 - i) * 22
        d.ellipse([dx - 7, dot_y - 7, dx + 7, dot_y + 7], fill=dot_color + (255,))

    # ── Columns ─────────────────────────────────────
    col_widths_pct = [0.05, 0.16, 0.22, 0.39, 0.18]
    col_lefts = [x0]
    for w_pct in col_widths_pct:
        col_lefts.append(col_lefts[-1] + sheet_w * w_pct)
    col_lefts[-1] = x1

    # Header row
    header_y = y0 + toolbar_h
    d.rectangle([x0, header_y, x1, header_y + header_h], fill=(241, 243, 244, 255))
    d.line([x0, header_y + header_h, x1, header_y + header_h], fill=(221, 221, 221, 255), width=1)
    for left in col_lefts[1:-1]:
        d.line([left, header_y, left, header_y + header_h], fill=(221, 221, 221, 255), width=1)
    h_font = font(F_MONO_BOLD, 13)
    headers = ["", "NOM", "POSTE", "ÉTABLISSEMENT", "CATÉGORIE"]
    for i, label in enumerate(headers):
        if not label:
            continue
        d.text((col_lefts[i] + 14, header_y + (header_h - 13) // 2 - 1),
               label, font=h_font, fill=(95, 99, 104, 255))

    # ── Rows ────────────────────────────────────────
    rows = [
        ("M. Renard",      "Directeur Général",       "CHU Bordeaux",                "CHU",      (26, 115, 232)),
        ("A. Lemoine",     "DAF",                     "CH Avignon",                  "CH",       (26, 115, 232)),
        ("C. Garnier",     "DRH",                     "CHU Nantes",                  "CHU",      (26, 115, 232)),
        ("P. Boucher",     "Directeur",               "EHPAD Les Tilleuls",          "EHPAD",    (24, 128, 56)),
        ("S. Caron",       "Directrice Adjointe",     "CH Compiègne-Noyon",          "CH",       (26, 115, 232)),
        ("J. Vidal",       "Directeur Stratégie",     "CHS Esquirol Limoges",        "CHS",      (147, 52, 230)),
        ("L. Marchand",    "Directeur d'étab.",       "Clinique du Parc Castelnau",  "Clinique", (217, 48, 37)),
        ("F. Bertrand",    "DSI",                     "CH Roubaix",                  "CH",       (26, 115, 232)),
        ("V. Aubert",      "Directrice Soins",        "CHU Rennes",                  "CHU",      (26, 115, 232)),
        ("O. Pelletier",   "Directeur",               "EHPAD Saint-Joseph",          "EHPAD",    (24, 128, 56)),
        ("N. Faure",       "Directrice Générale",     "CHRU Strasbourg",             "CHRU",     (26, 115, 232)),
        ("R. Charpentier", "DAF",                     "CHU Toulouse",                "CHU",      (26, 115, 232)),
        ("E. Moreau",      "Directrice Communication","CH Valenciennes",             "CH",       (26, 115, 232)),
        ("H. Lacombe",     "Directeur Médical",       "CLCC Gustave Roussy",         "CLCC",     (217, 48, 37)),
        ("M. Dauphin",     "Directrice",              "EHPAD Bellevue",              "EHPAD",    (24, 128, 56)),
        ("T. Allard",      "Directeur",               "CHS Le Vinatier",             "CHS",      (147, 52, 230)),
    ][:rows_count]

    rows_top = header_y + header_h
    cell_font = font(F_SANS, 14)
    rn_font   = font(F_MONO, 12)
    cat_font  = font(F_SANS_BOLD, 13)

    y = rows_top
    for i, (nom, poste, etab, cat, cat_color) in enumerate(rows):
        d.rectangle([x0, y, col_lefts[1], y + row_h], fill=(248, 249, 250, 255))
        d.line([col_lefts[1], y + row_h, x1, y + row_h], fill=(238, 238, 238, 255), width=1)
        d.text((col_lefts[0] + 12, y + (row_h - 12) // 2 - 1), str(i + 2),
               font=rn_font, fill=(95, 99, 104, 255))
        d.text((col_lefts[1] + 14, y + (row_h - 14) // 2 - 1), nom,
               font=cell_font, fill=(32, 33, 36, 255))
        d.text((col_lefts[2] + 14, y + (row_h - 14) // 2 - 1), poste,
               font=cell_font, fill=(95, 99, 104, 255))
        d.text((col_lefts[3] + 14, y + (row_h - 14) // 2 - 1), etab,
               font=cell_font, fill=(26, 115, 232, 255))
        d.text((col_lefts[4] + 14, y + (row_h - 13) // 2 - 1), cat,
               font=cat_font, fill=cat_color + (255,))
        for left in col_lefts[1:-1]:
            d.line([left, y, left, y + row_h], fill=(238, 238, 238, 255), width=1)
        y += row_h

    # ── Footer tab strip ────────────────────────────
    d.rectangle([x0, y1 - footer_h, x1, y1], fill=(248, 249, 250, 255))
    d.rounded_rectangle([x0, y1 - footer_h, x1, y1], radius=radius, fill=(248, 249, 250, 255))
    d.rectangle([x0, y1 - footer_h, x1, y1 - radius], fill=(248, 249, 250, 255))
    d.line([x0, y1 - footer_h, x1, y1 - footer_h], fill=(224, 224, 224, 255), width=1)
    tab_font = font(F_SANS, 14)
    tab_label = "Décideurs"
    tw = d.textlength(tab_label, font=tab_font) + 32
    tab_x = x0 + 14
    tab_y = y1 - footer_h + 5
    d.rounded_rectangle([tab_x, tab_y, tab_x + tw, y1],
                        radius=5, fill=(255, 255, 255, 255),
                        outline=(221, 221, 221, 255), width=1)
    d.text((tab_x + 16, tab_y + 6), tab_label, font=tab_font, fill=(32, 33, 36, 255))
    note_font = font(F_MONO, 12)
    d.text((tab_x + tw + 18, tab_y + 9),
           "+ Email · + Tél · + LinkedIn · + FINESS",
           font=note_font, fill=(95, 99, 104, 255))

    # Restate outer border
    d.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=None,
                        outline=(0, 0, 0, 36), width=1)

    # Shadow + tilt
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([x0 + 4, y0 + 22, x1 + 4, y1 + 22], radius=radius, fill=(0, 0, 0, 75))
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    composed = Image.alpha_composite(shadow, img)
    return composed.rotate(-2.0, resample=Image.BICUBIC, expand=True)


# ─── Canvas ────────────────────────────────────────────────
def main():
    canvas = Image.new("RGB", (CANVAS, CANVAS), PAPER)
    d = ImageDraw.Draw(canvas)

    # ── Whisper marginalia: clempo. wordmark, top-left ──
    wm_font = font(F_SANS_BOLD, 26)
    d.text((46, 42), "clempo.", font=wm_font, fill=INK)

    # Top-right tiny reference
    mono_xs = font(F_MONO, 10)
    meta = "// HOSPITAL DATABASE · VOL. 02"
    mw = text_width(d, meta, mono_xs, letter_spacing=0.5)
    draw_tracked(d, (CANVAS - 46 - mw, 52), meta, mono_xs, STEEL, letter_spacing=0.5)

    # ── Hero: the artifact ─────────────────────────────────
    # Mockup sized to fill ~90% of the canvas.
    mockup_w = 960
    mockup = render_sheet_mockup(mockup_w, rows_count=16)
    mx = (CANVAS - mockup.width) // 2
    my = (CANVAS - mockup.height) // 2 + 8
    canvas.paste(mockup, (mx, my), mockup)

    # ── Bottom marginalia ──────────────────────────────────
    # Single URL line, centered, with signal-green tick under
    cta_font = font(F_MONO_BOLD, 14)
    cta_text = "→ CLEMPO.FR/DECIDEURS-HOSPITALIERS"
    cw = text_width(d, cta_text, cta_font, letter_spacing=2.0)
    cta_y = CANVAS - 50
    draw_tracked(d, ((CANVAS - cw) // 2, cta_y), cta_text, cta_font, INK, letter_spacing=2.0)
    uw = 58
    d.rectangle([(CANVAS - uw) // 2, cta_y + 24,
                 (CANVAS + uw) // 2, cta_y + 26], fill=SIGNAL)

    # Save
    out = Path("/tmp/clempo-linkedin/clempo-linkedin-decideurs.png")
    canvas.save(out, "PNG", optimize=True)
    print(f"✓ Wrote {out}  ({canvas.size})")


if __name__ == "__main__":
    main()
