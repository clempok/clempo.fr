"""
Visuels du lead magnet « médecins KOL ».

Deux formats, même parti pris que render_linkedin_decideurs.py : l'artefact
(le Google Sheet) occupe le cadre, le texte se réduit à des notes de marge.

  post  1080×1080 — l'image à poster sur LinkedIn
  og    1200×630  — l'aperçu de lien (public/og-medecins-kols.png)

Usage :
  python3 scripts/render_linkedin_medecins_kols.py [post|og] [chemin/sortie.png]
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ─── Tokens (brand book ClearSharpHealthcare) ──────────────
CANVAS = 1080
PAPER  = (237, 235, 228)
INK    = (10, 10, 11)
STEEL  = (107, 111, 122)
SIGNAL = (0, 214, 143)

# Les .ttf du skill canvas-design. Le dossier peut bouger d'une session à
# l'autre : on tente plusieurs emplacements avant d'abandonner.
FONT_DIRS = [
    Path("/Users/pom1986/Library/Application Support/Claude/local-agent-mode-sessions/"
         "skills-plugin/ca531e7f-5547-4ae5-ae76-52ff3649c89f/"
         "04a208ed-8fb3-4267-b82c-4f66957e6e90/skills/canvas-design/canvas-fonts"),
    Path.home() / "Library/Fonts",
    Path("/Library/Fonts"),
]


def find_font(name: str) -> str:
    for d in FONT_DIRS:
        p = d / name
        if p.exists():
            return str(p)
    raise SystemExit(
        f"Police introuvable : {name}\n"
        "Ajoutez le dossier canvas-fonts du skill canvas-design à FONT_DIRS."
    )


F_SANS      = find_font("InstrumentSans-Regular.ttf")
F_SANS_BOLD = find_font("InstrumentSans-Bold.ttf")
F_MONO      = find_font("JetBrainsMono-Regular.ttf")
F_MONO_BOLD = find_font("JetBrainsMono-Bold.ttf")


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


# Données factices mais plausibles — le vrai fichier est derrière le formulaire.
# Mêmes lignes que le mockup React (MedecinsKolsSheetPreview.tsx).
BLUE   = (26, 115, 232)
PURPLE = (147, 52, 230)
GREEN  = (24, 128, 56)

ROWS = [
    ("Pr V. Alliot",    "Cardiologie",        "CHU Bordeaux",                 "PU-PH · Chef de service", BLUE),
    ("Pr M. Rondeau",   "Oncologie",          "Société Française du Cancer",  "Président",               PURPLE),
    ("Pr C. Delaunay",  "Hématologie",        "AP-HP Saint-Louis",            "PU-PH",                   BLUE),
    ("Dr A. Fournier",  "Biologie médicale",  "CHU Nantes",                   "MCU-PH",                  BLUE),
    ("Pr S. Marchetti", "Anesthésie-réa",     "HCL Édouard Herriot",          "Chef de service (Pr)",    GREEN),
    ("Pr J. Bricourt",  "Gynéco-obstétrique", "CNGOF",                        "Secrétaire Général",      PURPLE),
    ("Pr N. Estève",    "Neurologie",         "CHU Montpellier",              "PU-PH · Chef de pôle",    BLUE),
    ("Dr L. Vasseur",   "Orthodontie (ODF)",  "SFODF",                        "Trésorière",              PURPLE),
    ("Pr P. Kerbrat",   "Pédiatrie",          "CHU Toulouse",                 "PU-PH",                   BLUE),
    ("Pr H. Zaoui",     "Radiologie",         "Société Française de Radiologie", "Membre CA",            GREEN),
    ("Pr T. Nguyen",    "Néphrologie",        "CHU Lille",                    "Chef de service",         BLUE),
    ("Pr I. Roussel",   "Rhumatologie",       "Société Française de Rhumatologie", "Vice-Présidente",    PURPLE),
    ("Dr B. Amselem",   "Endocrinologie",     "CHU Strasbourg",               "MCU-PH",                  BLUE),
    ("Pr F. Guichard",  "Pneumologie",        "AP-HP Bichat",                 "PU-PH",                   BLUE),
    ("Pr É. Lambert",   "Chirurgie digestive", "CHU Rennes",                  "Chef de service (Pr)",    BLUE),
    ("Pr D. Ouazana",   "Infectiologie",      "SPILF",                        "Membre du CA",            PURPLE),
]


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

    d.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=(255, 255, 255, 255),
                        outline=(0, 0, 0, 32), width=1)

    # ── Barre d'outils ──────────────────────────────
    d.rounded_rectangle([x0, y0, x1, y0 + toolbar_h], radius=radius, fill=(248, 249, 250, 255))
    d.rectangle([x0, y0 + radius, x1, y0 + toolbar_h], fill=(248, 249, 250, 255))
    d.line([x0, y0 + toolbar_h, x1, y0 + toolbar_h], fill=(224, 224, 224, 255), width=1)

    icon_size = 26
    icon_x = x0 + 20
    icon_y = y0 + (toolbar_h - icon_size) // 2
    d.rounded_rectangle([icon_x, icon_y, icon_x + icon_size, icon_y + icon_size],
                        radius=4, fill=(15, 157, 88, 255))
    # Petite grille blanche dans le carré vert — le glyphe "▦" manque dans
    # Instrument Sans et sortait en carré vide (tofu).
    gx, gy, cell, gap = icon_x + 6, icon_y + 7, 5, 2
    for r in range(2):
        for c in range(2):
            cx = gx + c * (cell + gap)
            cy = gy + r * (cell + gap)
            d.rectangle([cx, cy, cx + cell, cy + cell], fill=(255, 255, 255, 255))

    fn_font = font(F_SANS, 18)
    sub_font = font(F_MONO, 12)
    d.text((icon_x + icon_size + 12, y0 + 7),
           "4 035 médecins KOL · France",
           font=fn_font, fill=(32, 33, 36, 255))
    d.text((icon_x + icon_size + 12, y0 + 30),
           "Google Sheets · partagé",
           font=sub_font, fill=(95, 99, 104, 255))

    dot_y = y0 + toolbar_h // 2
    for i, dot_color in enumerate([(255, 95, 87), (255, 189, 46), (40, 202, 66)]):
        dx = x1 - 22 - (2 - i) * 22
        d.ellipse([dx - 7, dot_y - 7, dx + 7, dot_y + 7], fill=dot_color + (255,))

    # ── Colonnes ────────────────────────────────────
    col_widths_pct = [0.05, 0.20, 0.20, 0.30, 0.25]
    col_lefts = [x0]
    for w_pct in col_widths_pct:
        col_lefts.append(col_lefts[-1] + sheet_w * w_pct)
    col_lefts[-1] = x1

    header_y = y0 + toolbar_h
    d.rectangle([x0, header_y, x1, header_y + header_h], fill=(241, 243, 244, 255))
    d.line([x0, header_y + header_h, x1, header_y + header_h], fill=(221, 221, 221, 255), width=1)
    for left in col_lefts[1:-1]:
        d.line([left, header_y, left, header_y + header_h], fill=(221, 221, 221, 255), width=1)
    h_font = font(F_MONO_BOLD, 13)
    headers = ["", "NOM", "SPÉCIALITÉ", "ÉTAB. / SOCIÉTÉ", "FONCTION"]
    for i, label in enumerate(headers):
        if not label:
            continue
        d.text((col_lefts[i] + 14, header_y + (header_h - 13) // 2 - 1),
               label, font=h_font, fill=(95, 99, 104, 255))

    # ── Lignes ──────────────────────────────────────
    rows_top = header_y + header_h
    cell_font = font(F_SANS, 14)
    rn_font   = font(F_MONO, 12)

    y = rows_top
    for i, (nom, spec, org, fonction, org_color) in enumerate(ROWS[:rows_count]):
        d.rectangle([x0, y, col_lefts[1], y + row_h], fill=(248, 249, 250, 255))
        d.line([col_lefts[1], y + row_h, x1, y + row_h], fill=(238, 238, 238, 255), width=1)
        d.text((col_lefts[0] + 12, y + (row_h - 12) // 2 - 1), str(i + 2),
               font=rn_font, fill=(95, 99, 104, 255))
        d.text((col_lefts[1] + 14, y + (row_h - 14) // 2 - 1), nom,
               font=cell_font, fill=(32, 33, 36, 255))
        d.text((col_lefts[2] + 14, y + (row_h - 14) // 2 - 1), spec,
               font=cell_font, fill=(95, 99, 104, 255))
        d.text((col_lefts[3] + 14, y + (row_h - 14) // 2 - 1), org,
               font=cell_font, fill=org_color + (255,))
        d.text((col_lefts[4] + 14, y + (row_h - 14) // 2 - 1), fonction,
               font=cell_font, fill=(32, 33, 36, 255))
        for left in col_lefts[1:-1]:
            d.line([left, y, left, y + row_h], fill=(238, 238, 238, 255), width=1)
        y += row_h

    # ── Onglet du bas ───────────────────────────────
    d.rectangle([x0, y1 - footer_h, x1, y1], fill=(248, 249, 250, 255))
    d.rounded_rectangle([x0, y1 - footer_h, x1, y1], radius=radius, fill=(248, 249, 250, 255))
    d.rectangle([x0, y1 - footer_h, x1, y1 - radius], fill=(248, 249, 250, 255))
    d.line([x0, y1 - footer_h, x1, y1 - footer_h], fill=(224, 224, 224, 255), width=1)
    tab_font = font(F_SANS, 14)
    tab_label = "Praticiens"
    tw = d.textlength(tab_label, font=tab_font) + 32
    tab_x = x0 + 14
    tab_y = y1 - footer_h + 5
    d.rounded_rectangle([tab_x, tab_y, tab_x + tw, y1],
                        radius=5, fill=(255, 255, 255, 255),
                        outline=(221, 221, 221, 255), width=1)
    d.text((tab_x + 16, tab_y + 6), tab_label, font=tab_font, fill=(32, 33, 36, 255))
    note_font = font(F_MONO, 12)
    d.text((tab_x + tw + 18, tab_y + 9),
           "+ Ville · + Département · + LinkedIn · + Source",
           font=note_font, fill=(95, 99, 104, 255))

    d.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=None,
                        outline=(0, 0, 0, 36), width=1)

    # Ombre portée + léger basculement
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([x0 + 4, y0 + 22, x1 + 4, y1 + 22], radius=radius, fill=(0, 0, 0, 75))
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    composed = Image.alpha_composite(shadow, img)
    return composed.rotate(-2.0, resample=Image.BICUBIC, expand=True)


def render_post() -> Image.Image:
    """1080×1080 — le visuel à poster. L'artefact occupe presque tout."""
    canvas = Image.new("RGB", (CANVAS, CANVAS), PAPER)
    d = ImageDraw.Draw(canvas)

    # Marginalia : le wordmark en haut à gauche
    wm_font = font(F_SANS_BOLD, 26)
    d.text((46, 42), "clempo.", font=wm_font, fill=INK)

    # Référence discrète en haut à droite
    mono_xs = font(F_MONO, 10)
    meta = "// KOL DATABASE · VOL. 02"
    mw = text_width(d, meta, mono_xs, letter_spacing=0.5)
    draw_tracked(d, (CANVAS - 46 - mw, 52), meta, mono_xs, STEEL, letter_spacing=0.5)

    # Héros : l'artefact
    mockup = render_sheet_mockup(960, rows_count=16)
    mx = (CANVAS - mockup.width) // 2
    my = (CANVAS - mockup.height) // 2 + 8
    canvas.paste(mockup, (mx, my), mockup)

    # Marginalia du bas : l'URL, soulignée en signal
    cta_font = font(F_MONO_BOLD, 14)
    cta_text = "→ CLEMPO.FR/MEDECINS-KOLS"
    cw = text_width(d, cta_text, cta_font, letter_spacing=2.0)
    cta_y = CANVAS - 50
    draw_tracked(d, ((CANVAS - cw) // 2, cta_y), cta_text, cta_font, INK, letter_spacing=2.0)
    uw = 58
    d.rectangle([(CANVAS - uw) // 2, cta_y + 24,
                 (CANVAS + uw) // 2, cta_y + 26], fill=SIGNAL)

    return canvas


def render_og() -> Image.Image:
    """1200×630 — l'aperçu de lien. Titre à gauche, artefact débordant à droite.

    Un carré recadré au ratio 1.91:1 perd le wordmark et l'URL : d'où un
    rendu dédié plutôt qu'un simple crop du visuel de post."""
    w, h = 1200, 630
    canvas = Image.new("RGB", (w, h), PAPER)
    d = ImageDraw.Draw(canvas)

    # Mockup à droite, volontairement rogné par le bord (il continue hors cadre)
    mockup = render_sheet_mockup(760, rows_count=13)
    canvas.paste(mockup, (w - mockup.width + 210, (h - mockup.height) // 2 + 10), mockup)

    # Colonne de gauche sur un aplat papier, pour rester lisible par-dessus
    d.rectangle([0, 0, 520, h], fill=PAPER)

    x = 60
    d.text((x, 52), "clempo.", font=font(F_SANS_BOLD, 26), fill=INK)

    eyebrow = font(F_MONO, 12)
    draw_tracked(d, (x, 150), "// RESSOURCE GRATUITE", eyebrow, STEEL, letter_spacing=1.2)

    # Titre : Instrument Serif n'est pas dans le pack, on reste sur le sans bold
    title_font = font(F_SANS_BOLD, 46)
    for i, line in enumerate(["4 035 médecins", "KOL en France"]):
        d.text((x, 188 + i * 56), line, font=title_font, fill=INK)

    sub_font = font(F_SANS, 19)
    for i, line in enumerate([
        "PU-PH, chefs de service et dirigeants",
        "de sociétés savantes. 324 établissements,",
        "71 sociétés savantes, 60 spécialités.",
    ]):
        d.text((x, 322 + i * 30), line, font=sub_font, fill=STEEL)

    cta_font = font(F_MONO_BOLD, 14)
    cta_text = "→ CLEMPO.FR/MEDECINS-KOLS"
    draw_tracked(d, (x, 462), cta_text, cta_font, INK, letter_spacing=1.4)
    d.rectangle([x, 490, x + 58, 492], fill=SIGNAL)

    return canvas


FORMATS = {
    "post": (render_post, Path("/tmp/clempo-linkedin/clempo-linkedin-medecins-kols.png")),
    "og":   (render_og,   Path("public/og-medecins-kols.png")),
}


def main():
    argv = sys.argv[1:]
    fmt = argv[0] if argv and argv[0] in FORMATS else "post"
    rest = argv[1:] if argv and argv[0] in FORMATS else argv

    render, default_out = FORMATS[fmt]
    out = Path(rest[0]) if rest else default_out
    out.parent.mkdir(parents=True, exist_ok=True)

    canvas = render()
    canvas.save(out, "PNG", optimize=True)
    print(f"✓ Wrote {out}  ({canvas.size})")


if __name__ == "__main__":
    main()
