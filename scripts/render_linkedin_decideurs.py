"""
Annuaire Brutaliste — LinkedIn 1080×1080 square
For the Clempo lead magnet: 8 836 décideurs hospitaliers · France
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path

# ─── Tokens ────────────────────────────────────────────────
CANVAS = 1080
PAPER  = (237, 235, 228)
INK    = (10, 10, 11)
STEEL  = (107, 111, 122)
GRAPHITE = (42, 45, 53)
SIGNAL = (0, 214, 143)
SIGNAL_DEEP = (0, 158, 104)

FONTS = Path("/Users/pom1986/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/ca531e7f-5547-4ae5-ae76-52ff3649c89f/04a208ed-8fb3-4267-b82c-4f66957e6e90/skills/canvas-design/canvas-fonts")
F_SERIF       = str(FONTS / "InstrumentSerif-Regular.ttf")
F_SERIF_IT    = str(FONTS / "InstrumentSerif-Italic.ttf")
F_SANS        = str(FONTS / "InstrumentSans-Regular.ttf")
F_SANS_BOLD   = str(FONTS / "InstrumentSans-Bold.ttf")
F_MONO        = str(FONTS / "JetBrainsMono-Regular.ttf")
F_MONO_BOLD   = str(FONTS / "JetBrainsMono-Bold.ttf")


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
def render_sheet_mockup(width, rows_count=7):
    """Tilted Google Sheets preview — width drives proportions; rows_count drives height."""
    pad = 28                 # rotation safety padding

    # Geometry — derived top-down from contents so the table fills cleanly
    toolbar_h = 36
    header_h = 30
    row_h = 28
    footer_h = 28
    body_rows = rows_count

    sheet_w = width
    sheet_h = toolbar_h + header_h + row_h * body_rows + footer_h

    img = Image.new("RGBA", (sheet_w + pad * 2, sheet_h + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    x0, y0 = pad, pad
    x1, y1 = x0 + sheet_w, y0 + sheet_h
    radius = 10

    # Sheet body
    d.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=(255, 255, 255, 255),
                        outline=(0, 0, 0, 28), width=1)

    # Toolbar
    d.rounded_rectangle([x0, y0, x1, y0 + toolbar_h], radius=radius, fill=(248, 249, 250, 255))
    d.rectangle([x0, y0 + radius, x1, y0 + toolbar_h], fill=(248, 249, 250, 255))
    d.line([x0, y0 + toolbar_h, x1, y0 + toolbar_h], fill=(224, 224, 224, 255), width=1)

    # Sheets icon
    icon_size = 18
    icon_x = x0 + 14
    icon_y = y0 + (toolbar_h - icon_size) // 2
    d.rounded_rectangle([icon_x, icon_y, icon_x + icon_size, icon_y + icon_size],
                        radius=3, fill=(15, 157, 88, 255))
    ic_font = font(F_SANS_BOLD, 11)
    ic_w = d.textlength("▦", font=ic_font)
    d.text((icon_x + (icon_size - ic_w) / 2, icon_y + 1), "▦", font=ic_font, fill=(255, 255, 255, 255))

    # Filename
    fn_font = font(F_SANS, 13)
    sub_font = font(F_MONO, 9)
    d.text((icon_x + icon_size + 10, y0 + 5), "8 836 décideurs hospitaliers · France",
           font=fn_font, fill=(32, 33, 36, 255))
    d.text((icon_x + icon_size + 10, y0 + 21), "Google Sheets · partagé",
           font=sub_font, fill=(95, 99, 104, 255))

    # Window dots
    dot_y = y0 + toolbar_h // 2
    for i, dot_color in enumerate([(255, 95, 87), (255, 189, 46), (40, 202, 66)]):
        dx = x1 - 16 - (2 - i) * 16
        d.ellipse([dx - 5, dot_y - 5, dx + 5, dot_y + 5], fill=dot_color + (255,))

    # Columns
    col_widths_pct = [0.06, 0.18, 0.22, 0.40, 0.14]
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
    h_font = font(F_MONO_BOLD, 10)
    headers = ["", "NOM", "POSTE", "ÉTABLISSEMENT", "CATÉGORIE"]
    for i, label in enumerate(headers):
        if not label:
            continue
        d.text((col_lefts[i] + 10, header_y + (header_h - 10) // 2 - 1),
               label, font=h_font, fill=(95, 99, 104, 255))

    # Data rows
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
    ][:body_rows]

    rows_top = header_y + header_h
    cell_font = font(F_SANS, 12)
    rn_font = font(F_MONO, 10)
    cat_font = font(F_SANS_BOLD, 11)

    y = rows_top
    for i, (nom, poste, etab, cat, cat_color) in enumerate(rows):
        # Row number gutter
        d.rectangle([x0, y, col_lefts[1], y + row_h], fill=(248, 249, 250, 255))
        d.line([col_lefts[1], y + row_h, x1, y + row_h], fill=(238, 238, 238, 255), width=1)
        d.text((col_lefts[0] + 8, y + (row_h - 10) // 2 - 1), str(i + 2),
               font=rn_font, fill=(95, 99, 104, 255))
        d.text((col_lefts[1] + 10, y + (row_h - 12) // 2 - 1), nom,
               font=cell_font, fill=(32, 33, 36, 255))
        d.text((col_lefts[2] + 10, y + (row_h - 12) // 2 - 1), poste,
               font=cell_font, fill=(95, 99, 104, 255))
        d.text((col_lefts[3] + 10, y + (row_h - 12) // 2 - 1), etab,
               font=cell_font, fill=(26, 115, 232, 255))
        d.text((col_lefts[4] + 10, y + (row_h - 11) // 2 - 1), cat,
               font=cat_font, fill=cat_color + (255,))
        for left in col_lefts[1:-1]:
            d.line([left, y, left, y + row_h], fill=(238, 238, 238, 255), width=1)
        y += row_h

    # Soft bottom fade over the last 1.5 rows so it teases more data
    fade_h = int(row_h * 1.5)
    fade = Image.new("RGBA", (sheet_w, fade_h), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fade)
    for fy in range(fade_h):
        alpha = int(255 * (fy / fade_h) ** 1.5)
        fd.line([0, fy, sheet_w, fy], fill=(255, 255, 255, alpha))
    img.alpha_composite(fade, dest=(x0, y - fade_h + footer_h))

    # Footer tab strip
    d.rectangle([x0, y1 - footer_h, x1, y1], fill=(248, 249, 250, 255))
    d.line([x0, y1 - footer_h, x1, y1 - footer_h], fill=(224, 224, 224, 255), width=1)
    tab_font = font(F_SANS, 11)
    tab_label = "Décideurs"
    tw = d.textlength(tab_label, font=tab_font) + 24
    tab_x = x0 + 10
    tab_y = y1 - footer_h + 4
    d.rounded_rectangle([tab_x, tab_y, tab_x + tw, y1],
                        radius=4, fill=(255, 255, 255, 255),
                        outline=(221, 221, 221, 255), width=1)
    d.text((tab_x + 12, tab_y + 4), tab_label, font=tab_font, fill=(32, 33, 36, 255))
    note_font = font(F_MONO, 9)
    d.text((tab_x + tw + 14, tab_y + 6), "+ Email · + Tél · + LinkedIn · + FINESS",
           font=note_font, fill=(95, 99, 104, 255))

    # Restate the outer rounded border
    d.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=None,
                        outline=(0, 0, 0, 32), width=1)

    # Soft drop shadow + tilt
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([x0 + 4, y0 + 14, x1 + 4, y1 + 14], radius=radius, fill=(0, 0, 0, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    composed = Image.alpha_composite(shadow, img)
    return composed.rotate(-2.2, resample=Image.BICUBIC, expand=True)


# ─── Canvas ────────────────────────────────────────────────
def main():
    canvas = Image.new("RGB", (CANVAS, CANVAS), PAPER)
    d = ImageDraw.Draw(canvas)

    # Subtle dot-matrix accent — bottom-left corner this time, so it doesn't
    # fight with the top-right meta block
    dot_layer = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    dd = ImageDraw.Draw(dot_layer)
    for gy in range(CANVAS - 260, CANVAS - 100, 14):
        for gx in range(40, 380, 14):
            dd.ellipse([gx, gy, gx + 1.6, gy + 1.6], fill=INK + (16,))
    canvas.paste(dot_layer, (0, 0), dot_layer)

    margin_x = 70

    # ── HEADER ─────────────────────────────────────────────
    wm_font = font(F_SANS_BOLD, 38)
    d.text((margin_x, 56), "clempo.", font=wm_font, fill=INK)

    mono_sm = font(F_MONO, 13)
    meta1 = "// HOSPITAL DATABASE · VOL. 02"
    meta2 = "TIRAGE Nº 1 · 2026"
    w1 = text_width(d, meta1, mono_sm, letter_spacing=0.5)
    w2 = text_width(d, meta2, mono_sm, letter_spacing=0.5)
    draw_tracked(d, (CANVAS - margin_x - w1, 64), meta1, mono_sm, STEEL, letter_spacing=0.5)
    draw_tracked(d, (CANVAS - margin_x - w2, 86), meta2, mono_sm, STEEL, letter_spacing=0.5)

    d.line([margin_x, 128, CANVAS - margin_x, 128], fill=INK, width=1)

    # ── EYEBROW ────────────────────────────────────────────
    eb_font = font(F_MONO_BOLD, 13)
    draw_tracked(d, (margin_x, 152),
                 "— ANNUAIRE · DÉCIDEURS HOSPITALIERS",
                 eb_font, SIGNAL_DEEP, letter_spacing=1.0)

    # ── HERO NUMBER ────────────────────────────────────────
    big_font = font(F_SERIF, 200)
    big_y = 178
    d.text((margin_x - 6, big_y), "8 836", font=big_font, fill=INK)

    # Single subtitle line — serif italic, large but contained
    sub_font = font(F_SERIF_IT, 36)
    d.text((margin_x, big_y + 198),
           "décideurs hospitaliers, prêts à filtrer.",
           font=sub_font, fill=GRAPHITE)

    # ── GSHEET MOCKUP ──────────────────────────────────────
    # Sized so it fits clean above the stats/CTA stack
    mockup_w = 680
    mockup = render_sheet_mockup(mockup_w, rows_count=6)
    mx = (CANVAS - mockup.width) // 2
    my = 535  # leaves ~150px below the subtitle, ~140px above the stats line
    canvas.paste(mockup, (mx, my), mockup)

    # ── STATS LINE ─────────────────────────────────────────
    stat_font = font(F_MONO, 12)
    stats_y = CANVAS - 118
    stats_text = "// 01  1 849 ÉTABLISSEMENTS    // 02  1 287 VILLES    // 03  100 % FRANCE"
    sw = text_width(d, stats_text, stat_font, letter_spacing=0.6)
    draw_tracked(d, ((CANVAS - sw) // 2, stats_y), stats_text, stat_font, STEEL, letter_spacing=0.6)

    # ── CTA ────────────────────────────────────────────────
    cta_font = font(F_MONO_BOLD, 17)
    cta_text = "→ CLEMPO.FR/DECIDEURS-HOSPITALIERS"
    cw = text_width(d, cta_text, cta_font, letter_spacing=2.0)
    cta_y = CANVAS - 80
    draw_tracked(d, ((CANVAS - cw) // 2, cta_y), cta_text, cta_font, INK, letter_spacing=2.0)
    # Signal-green tick under the CTA
    underline_w = 70
    d.rectangle([(CANVAS - underline_w) // 2, cta_y + 30,
                 (CANVAS + underline_w) // 2, cta_y + 32], fill=SIGNAL)

    # ── SIGNATURE ROW ──────────────────────────────────────
    sig_font = font(F_MONO, 10)
    d.text((margin_x, CANVAS - 34), "RESSOURCE GRATUITE",
           font=sig_font, fill=STEEL)
    idx_text = "FICHE Nº 01 / 01  ·  06.2026"
    iw = text_width(d, idx_text, sig_font)
    d.text((CANVAS - margin_x - iw, CANVAS - 34), idx_text, font=sig_font, fill=STEEL)

    # Save
    out = Path("/tmp/clempo-linkedin/clempo-linkedin-decideurs.png")
    canvas.save(out, "PNG", optimize=True)
    print(f"✓ Wrote {out}  ({canvas.size})")


if __name__ == "__main__":
    main()
