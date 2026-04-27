#!/usr/bin/env python3
# -*- coding: utf-8 -*-
#
# Generator — Deck "CPO-Services-2026.pdf"
# Design system: Clempo Brand Book V1 · 2026
#   Ink Black #0A0A0B (60%) · Signal Green #00D68F (10%) · Warm Paper #EDEBE4 (30%)
#   Typo: Inter (UI/titres/corps) · Instrument Serif (italique édito) · JetBrains Mono (meta)
#   Wordmark "clempo." lowercase, point Signal Green.
#   Eyebrow mono en haut à gauche "// 01 — SECTION". Pagination "— 03" en bas à droite.
#   Un seul mot en Signal par titre, un seul mot en italique serif. 70% de vide minimum.
#
# Tous les textes, liens, blocs et images sont conservés à l'identique.

from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, Color

# ─── Configuration ────────────────────────────────────────────────────────────
FONTS_DIR = "/Users/pom1986/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/ca531e7f-5547-4ae5-ae76-52ff3649c89f/04a208ed-8fb3-4267-b82c-4f66957e6e90/skills/canvas-design/canvas-fonts"
OUTPUT_PATH = "/Users/pom1986/Downloads/clempo-fr/public/CPO-Services-2026.pdf"

W, H = 1200, 800  # Landscape deck (16:9-ish)

# ── Brandbook palette ────────────────────────────────────────────────────────
INK       = HexColor("#0A0A0B")   # Primaire — encre
INK_SOFT  = HexColor("#16181D")   # Ink Soft (cartes sur fond ink)
GRAPHITE  = HexColor("#2A2D35")   # Graphite
STEEL     = HexColor("#6B6F7A")   # Steel (texte muted sur fond clair)
MIST      = HexColor("#B8BCC4")   # Mist (muted sur fond dark)
PAPER     = HexColor("#EDEBE4")   # Warm paper
PAPER_ALT = HexColor("#F4F4F2")   # Paper alt
WHITE     = HexColor("#FFFFFF")
SIGNAL    = HexColor("#00D68F")   # Signature — vert chirurgical
SIGNAL_DP = HexColor("#009E68")   # Signal deep

# Opacités utilitaires (pour motifs fins)
SIGNAL_08 = Color(0, 0.839, 0.561, 0.08)
SIGNAL_15 = Color(0, 0.839, 0.561, 0.15)
WHITE_06  = Color(1, 1, 1, 0.06)
INK_04    = Color(0.04, 0.04, 0.04, 0.04)

# ── Fonts (Brandbook) ────────────────────────────────────────────────────────
def reg(name, file):
    pdfmetrics.registerFont(TTFont(name, f"{FONTS_DIR}/{file}"))

# Inter — UI/titres/corps
reg("Inter",        "Inter-Regular.ttf")
reg("Inter-Med",    "Inter-Medium.ttf")
reg("Inter-SB",     "Inter-SemiBold.ttf")
reg("Inter-Bold",   "Inter-Bold.ttf")
# Instrument Serif — titres édito & citations (italique)
reg("Serif",        "InstrumentSerif-Regular.ttf")
reg("Serif-It",     "InstrumentSerif-Italic.ttf")
# JetBrains Mono — meta, code, labels, eyebrows
reg("Mono",         "JetBrainsMono-Regular.ttf")
reg("Mono-Bold",    "JetBrainsMono-Bold.ttf")

# ── Helpers ──────────────────────────────────────────────────────────────────
def fill_bg(c, color):
    c.setFillColor(color)
    c.rect(0, 0, W, H, stroke=0, fill=1)

def hline(c, x, y, w, color, t=0.5):
    c.setStrokeColor(color)
    c.setLineWidth(t)
    c.line(x, y, x + w, y)

def eyebrow(c, text, x, y, color=SIGNAL):
    """Eyebrow mono: // NN — LABEL, couleur Signal par défaut."""
    c.setFont("Mono", 10)
    c.setFillColor(color)
    c.drawString(x, y, text)

def wordmark(c, x, y, size=10, on_dark=False):
    """Wordmark "clempo." lowercase, point Signal Green collé au "o"."""
    font = "Inter-Bold"
    c.setFont(font, size)
    c.setFillColor(WHITE if on_dark else INK)
    c.drawString(x, y, "clempo")
    w = c.stringWidth("clempo", font, size)
    # Point Signal Green collé au "o"
    dot_r = size * 0.16
    c.setFillColor(SIGNAL)
    c.circle(x + w + dot_r + size * 0.05, y + dot_r, dot_r, stroke=0, fill=1)

def page_number(c, n, total, on_dark=False):
    """— NN / TT en bas à droite, format brandbook."""
    c.setFont("Mono", 9)
    c.setFillColor(MIST if on_dark else STEEL)
    txt = f"— {n:02d} / {total:02d}"
    c.drawRightString(W - 60, 32, txt)

def url_label(c, x, y, on_dark=False):
    c.setFont("Mono", 9)
    c.setFillColor(STEEL if not on_dark else MIST)
    c.drawString(60, 32, "// clempo.fr")

def footer(c, n, total, on_dark=False):
    wordmark(c, 60, H - 44, size=11, on_dark=on_dark)
    # Signal dot aligné sur la baseline déjà posé par wordmark().
    # Petit mention à droite en haut (section)
    page_number(c, n, total, on_dark=on_dark)
    url_label(c, 60, 32, on_dark=on_dark)

def top_right_meta(c, text, on_dark=False):
    c.setFont("Mono", 9)
    c.setFillColor(MIST if on_dark else STEEL)
    c.drawRightString(W - 60, H - 40, text)

def wrap(c, text, x, y, width, font, size, color, lh=None):
    if lh is None:
        lh = size * 1.5
    c.setFont(font, size)
    c.setFillColor(color)
    words = text.split()
    line = ""
    cy = y
    for word in words:
        test = (line + " " + word).strip()
        if c.stringWidth(test, font, size) <= width:
            line = test
        else:
            if line:
                c.drawString(x, cy, line)
                cy -= lh
            line = word
    if line:
        c.drawString(x, cy, line)
        cy -= lh
    return cy

def card(c, x, y, w, h, bg_color, border_color=None, signal_top=False):
    """Carte plate, radius 6px, option accent Signal top-left."""
    c.setFillColor(bg_color)
    c.setStrokeColor(border_color if border_color else bg_color)
    c.setLineWidth(0.6)
    c.roundRect(x, y, w, h, 6, stroke=1 if border_color else 0, fill=1)
    if signal_top:
        c.setStrokeColor(SIGNAL)
        c.setLineWidth(2)
        c.line(x + 1, y + h, x + 40, y + h)  # petit trait signal top-left

def dot_matrix(c, x, y, cols, rows, step=14, color=None):
    """Motif signature — dot matrix discret."""
    c.setFillColor(color if color else SIGNAL_15)
    for i in range(cols):
        for j in range(rows):
            c.circle(x + i * step, y + j * step, 1.2, stroke=0, fill=1)

def link_text(c, text, x, y, font, size, url, color=SIGNAL):
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawString(x, y, text)
    tw = c.stringWidth(text, font, size)
    c.setStrokeColor(color)
    c.setLineWidth(0.5)
    c.line(x, y - 1, x + tw, y - 1)
    c.linkURL(url, (x, y - 2, x + tw, y + size), relative=0)
    return tw

def section_header(c, section_num, section_label, on_dark=False):
    """Eyebrow haut gauche + meta haut droite."""
    eyebrow(c, f"// {section_num} — {section_label.upper()}", 60, H - 70,
            color=SIGNAL)
    top_right_meta(c, f"{section_num} · {section_label.upper()}", on_dark=on_dark)


TOTAL_PAGES = 12


# ─── PAGE 1: COVER (INK) ─────────────────────────────────────────────────────
def page1(c):
    fill_bg(c, INK)

    # Dot matrix décoratif (signature) — dense bottom-right
    dot_matrix(c, 780, 90, cols=24, rows=16, step=14, color=SIGNAL_15)

    # Wordmark top-left
    wordmark(c, 60, H - 44, size=13, on_dark=True)
    # Meta top-right
    top_right_meta(c, "SERVICES · ÉDITION 2026", on_dark=True)

    # Eyebrow
    eyebrow(c, "// 01 — COVER", 60, H - 210, color=SIGNAL)

    # Title big display — Inter Bold 80pt
    c.setFont("Inter-Bold", 78)
    c.setFillColor(WHITE)
    c.drawString(60, H - 300, "Clément")
    c.drawString(60, H - 390, "Pouget-Osmont.")
    # Point Signal Green collé au dernier "."  — déjà dans le texte,
    # on surpose un point vert propre à la place du point.
    # (ReportLab ne permet pas de colorer une seule glyph; on simule un "." Signal
    # en dessinant un rond à la position du "." — simplification: on laisse le point
    # blanc et on ajoute un dot Signal en accent juste après "Osmont")
    pw = c.stringWidth("Pouget-Osmont.", "Inter-Bold", 78)
    # Overlay Signal dot just after "Osmont" (remplace le point visuel)
    # Pas strictement nécessaire — on garde le "." blanc pour lisibilité.

    # Filet Signal sous le nom
    c.setStrokeColor(SIGNAL)
    c.setLineWidth(2)
    c.line(60, H - 420, 220, H - 420)

    # Subtitle + tagline (Instrument Serif italique — un seul mot accentué)
    # "Healthcare Marketing Director — Services presentation"
    c.setFont("Inter-SB", 22)
    c.setFillColor(WHITE)
    c.drawString(60, H - 468, "Healthcare Marketing Director")

    c.setFont("Serif-It", 22)
    c.setFillColor(MIST)
    c.drawString(60, H - 500, "— services presentation.")

    # Footer: wordmark déjà posé top, on pose pagination + url
    page_number(c, 1, TOTAL_PAGES, on_dark=True)
    url_label(c, 60, 32, on_dark=True)
    c.showPage()


# ─── PAGE 2: PHILOSOPHY — "Not an agency / An extra team member" (PAPER) ─────
def page2(c):
    fill_bg(c, PAPER)

    wordmark(c, 60, H - 44, size=11, on_dark=False)
    top_right_meta(c, "02 · PHILOSOPHIE", on_dark=False)

    eyebrow(c, "// 02 — APPROACH", 60, H - 110)

    # H1 display — Inter Bold + un mot en Instrument Serif italic (signature brandbook)
    cy = H - 200
    c.setFont("Inter-Bold", 64)
    c.setFillColor(INK)
    c.drawString(60, cy, "Not")
    not_w = c.stringWidth("Not ", "Inter-Bold", 64)
    c.setFont("Serif-It", 64)
    c.drawString(60 + not_w, cy, "an")
    an_w = c.stringWidth("an ", "Serif-It", 64)
    c.setFont("Inter-Bold", 64)
    c.drawString(60 + not_w + an_w, cy, "agency.")

    # Separator — filet Signal
    c.setStrokeColor(SIGNAL)
    c.setLineWidth(2)
    c.line(60, cy - 26, 140, cy - 26)

    c.setFont("Inter-Bold", 64)
    c.setFillColor(INK)
    c.drawString(60, cy - 110, "An extra team member.")

    hline(c, 60, cy - 150, W - 120, GRAPHITE, 0.4)

    # Baseline copy (Steel muted)
    wrap(c,
         "Embedded strategic leadership. No overhead. No onboarding lag. Just results.",
         60, cy - 190, W - 200, "Inter", 17, STEEL, lh=28)

    page_number(c, 2, TOTAL_PAGES, on_dark=False)
    url_label(c, 60, 32, on_dark=False)
    c.showPage()


# ─── PAGE 3: EXPERIENCE OVERVIEW (INK) ───────────────────────────────────────
def page3(c):
    fill_bg(c, INK)

    wordmark(c, 60, H - 44, size=11, on_dark=True)
    top_right_meta(c, "03 · MY EXPERIENCE", on_dark=True)

    eyebrow(c, "// 03 — MY EXPERIENCE", 60, H - 110)

    # Title — un mot italic serif signature
    c.setFont("Inter-Bold", 38)
    c.setFillColor(WHITE)
    c.drawString(60, H - 180, "My Experiences with")
    c.setFont("Serif-It", 38)
    c.drawString(60, H - 222, "diverse")
    div_w = c.stringWidth("diverse ", "Serif-It", 38)
    c.setFont("Inter-Bold", 38)
    c.drawString(60 + div_w, H - 222, "healthcare targets:")

    hline(c, 60, H - 250, W - 120, GRAPHITE, 0.4)

    targets = [
        "Healthcare Professionals",
        "Hospitals & Institutions",
        "Pharma & Biotech",
        "B2B Companies",
        "Patients",
    ]

    pw = 420
    ph = 46
    gap = 14
    sy = H - 310

    for i, text in enumerate(targets):
        py = sy - i * (ph + gap)
        highlight = (i == len(targets) - 1)
        if highlight:
            c.setFillColor(SIGNAL)
            c.setStrokeColor(SIGNAL)
        else:
            c.setFillColor(INK_SOFT)
            c.setStrokeColor(GRAPHITE)
        c.setLineWidth(0.8)
        c.roundRect(60, py, pw, ph, 4, stroke=1, fill=1)
        # Label left-aligned — brand rule "aligner à gauche"
        c.setFont("Inter-SB", 13)
        c.setFillColor(INK if highlight else WHITE)
        c.drawString(60 + 20, py + (ph - 13) / 2 + 2, text)
        # Index mono to the right
        c.setFont("Mono", 10)
        c.setFillColor(INK if highlight else STEEL)
        c.drawRightString(60 + pw - 20, py + (ph - 10) / 2 + 2, f"0{i+1}")

    # Dot matrix décoratif en colonne droite
    dot_matrix(c, 780, 130, cols=22, rows=22, step=18, color=SIGNAL_08)

    page_number(c, 3, TOTAL_PAGES, on_dark=True)
    url_label(c, 60, 32, on_dark=True)
    c.showPage()


# ─── PAGE 4: HEALTHCARE PROFESSIONALS (PAPER) ────────────────────────────────
def page4(c):
    fill_bg(c, PAPER)

    wordmark(c, 60, H - 44, size=11, on_dark=False)
    top_right_meta(c, "04 · HEALTHCARE PROFESSIONALS", on_dark=False)

    eyebrow(c, "// 04 — HEALTHCARE PROFESSIONALS", 60, H - 110)

    c.setFont("Inter-Bold", 40)
    c.setFillColor(INK)
    c.drawString(60, H - 180, "Healthcare")
    hp_w = c.stringWidth("Healthcare ", "Inter-Bold", 40)
    c.setFont("Serif-It", 40)
    c.drawString(60 + hp_w, H - 180, "Professionals.")

    hline(c, 60, H - 210, W - 120, GRAPHITE, 0.4)

    cases = [
        ("Doctolib",
         "Managed comprehensive product marketing to doctors and practitioners, driving feature adoption and increasing user satisfaction across the platform."),
        ("DocCity",
         "Led events, content strategy, and paid advertising for medical practice leasing."),
        ("Sofia D\u00e9veloppement",
         "Directed a 10-person marketing team with \u20ac1M budget across 4 SaaS products: Albus (20K nurses), Topaze (10K physiotherapists), Orthomax (5K speech therapists), ComptaSant\u00e9 (8K clients). Full-time interim for 8 months."),
        ("Andrew",
         "Built complete webinar acquisition engine from scratch, making it the #1 growth channel for reaching healthcare professionals."),
        ("Semble",
         "Designed and delivered 2-day go-to-market workshop specifically tailored for French practitioners market."),
    ]

    cw = (W - 120 - 4 * 16) / 5
    ch = 280
    cy = 110

    for i, (company, desc) in enumerate(cases):
        cx = 60 + i * (cw + 16)
        card(c, cx, cy, cw, ch, WHITE, border_color=HexColor("#E3E0D8"), signal_top=True)
        # Index mono
        c.setFont("Mono", 9)
        c.setFillColor(SIGNAL)
        c.drawString(cx + 14, cy + ch - 22, f"// 0{i+1}")
        # Company
        c.setFont("Inter-Bold", 14)
        c.setFillColor(INK)
        c.drawString(cx + 14, cy + ch - 48, company)
        hline(c, cx + 14, cy + ch - 58, cw - 28, HexColor("#E3E0D8"), 0.4)
        wrap(c, desc, cx + 14, cy + ch - 78, cw - 28, "Inter", 10.5, STEEL, lh=16)

    page_number(c, 4, TOTAL_PAGES, on_dark=False)
    url_label(c, 60, 32, on_dark=False)
    c.showPage()


# ─── PAGE 5: HOSPITALS (INK) ─────────────────────────────────────────────────
def page5(c):
    fill_bg(c, INK)

    wordmark(c, 60, H - 44, size=11, on_dark=True)
    top_right_meta(c, "05 · HOSPITALS & INSTITUTIONS", on_dark=True)

    eyebrow(c, "// 05 — HOSPITALS & INSTITUTIONS", 60, H - 110)

    c.setFont("Inter-Bold", 36)
    c.setFillColor(WHITE)
    c.drawString(60, H - 180, "Hospitals (Privates & Publics):")

    c.setFont("Serif-It", 30)
    c.setFillColor(SIGNAL)
    c.drawString(60, H - 224, "Navigating Complex B2B Healthcare Sales.")

    hline(c, 60, H - 252, W - 120, GRAPHITE, 0.4)

    lw = W * 0.60
    wrap(c,
         "Successfully reaching and closing deals with hospitals requires deep understanding of institutional decision-making, regulatory requirements, Interoperability and long sales cycles.",
         60, H - 290, lw - 80, "Inter", 14, MIST, lh=24)

    case_y = 110
    case_h = 200
    case_w = (lw - 80 - 20) / 2

    # Doctolib
    card(c, 60, case_y, case_w, case_h, INK_SOFT, border_color=GRAPHITE, signal_top=True)
    c.setFont("Mono", 9); c.setFillColor(SIGNAL)
    c.drawString(76, case_y + case_h - 22, "// 01")
    c.setFont("Inter-Bold", 15); c.setFillColor(WHITE)
    c.drawString(76, case_y + case_h - 48, "Doctolib")
    hline(c, 76, case_y + case_h - 60, case_w - 28, GRAPHITE, 0.4)
    wrap(c,
         "Key Account Manager for hospitals in Eastern France. Successfully closed major institutions including CHR Metz, CHRU Nancy, CH Colmar, and CH Mulhouse.",
         76, case_y + case_h - 82, case_w - 32, "Inter", 11, MIST, lh=17)

    # Kiro
    card(c, 80 + case_w, case_y, case_w, case_h, INK_SOFT, border_color=GRAPHITE, signal_top=True)
    c.setFont("Mono", 9); c.setFillColor(SIGNAL)
    c.drawString(96 + case_w, case_y + case_h - 22, "// 02")
    c.setFont("Inter-Bold", 15); c.setFillColor(WHITE)
    c.drawString(96 + case_w, case_y + case_h - 48, "Kiro")
    hline(c, 96 + case_w, case_y + case_h - 60, case_w - 28, GRAPHITE, 0.4)
    wrap(c,
         "Co-developed advanced diagnostic solution in strategic partnership with H\u00f4pital Am\u00e9ricain de Paris, demonstrating clinical validation and market fit.",
         96 + case_w, case_y + case_h - 82, case_w - 32, "Inter", 11, MIST, lh=17)

    # Dot matrix right
    dot_matrix(c, 860, 330, cols=16, rows=16, step=16, color=SIGNAL_08)

    page_number(c, 5, TOTAL_PAGES, on_dark=True)
    url_label(c, 60, 32, on_dark=True)
    c.showPage()


# ─── PAGE 6: PHARMA & BIOTECH (PAPER) ────────────────────────────────────────
def page6(c):
    fill_bg(c, PAPER)

    wordmark(c, 60, H - 44, size=11, on_dark=False)
    top_right_meta(c, "06 · PHARMA & BIOTECH", on_dark=False)

    eyebrow(c, "// 06 — PHARMA & BIOTECH", 60, H - 110)

    c.setFont("Inter-Bold", 38)
    c.setFillColor(INK)
    c.drawString(60, H - 180, "Pharma & Biotech:")
    c.setFont("Serif-It", 38)
    c.drawString(60, H - 222, "international scaling.")

    hline(c, 60, H - 252, W - 120, GRAPHITE, 0.4)

    cw = (W - 140) / 2
    ch = 440
    cy = 80

    # ── Card 1: Cherry Biotech ──
    card(c, 60, cy, cw, ch, WHITE, border_color=HexColor("#E3E0D8"), signal_top=True)

    c.setFont("Mono", 9); c.setFillColor(SIGNAL)
    c.drawString(78, cy + ch - 22, "// 01 — CHERRY BIOTECH")

    c.setFont("Inter-Bold", 18); c.setFillColor(INK)
    c.drawString(78, cy + ch - 50, "Cherry Biotech")
    c.setFont("Inter", 12); c.setFillColor(STEEL)
    c.drawString(78, cy + ch - 68, "VP Marketing")
    hline(c, 78, cy + ch - 80, cw - 36, HexColor("#E3E0D8"), 0.4)

    c.setFont("Inter", 12); c.setFillColor(INK)
    c.drawString(78, cy + ch - 100, "Leading marketing strategy for cutting-edge organoids technology company:")

    # Bullet 1: "example post" link
    b1y = cy + ch - 132
    c.setFillColor(SIGNAL); c.setFont("Mono", 12); c.drawString(78, b1y, "→")
    prefix1 = "Executive branding and thought leadership ("
    c.setFillColor(INK); c.setFont("Inter", 12); c.drawString(100, b1y, prefix1)
    lx1 = 100 + c.stringWidth(prefix1, "Inter", 12)
    link_text(c, "example post", lx1, b1y, "Inter-SB", 12,
              "https://www.linkedin.com/posts/pierre-gaudriault-34263041_bold-move-from-france-2030-investing-activity-7310685115263647746-zK_g")
    c.setFillColor(INK); c.setFont("Inter", 12)
    c.drawString(lx1 + c.stringWidth("example post", "Inter-SB", 12), b1y, ")")

    # Bullet 2: "see tool" link
    b2y = cy + ch - 164
    c.setFillColor(SIGNAL); c.setFont("Mono", 12); c.drawString(78, b2y, "→")
    prefix2 = "GPT Organoid lead magnet development ("
    c.setFillColor(INK); c.setFont("Inter", 12); c.drawString(100, b2y, prefix2)
    lx2 = 100 + c.stringWidth(prefix2, "Inter", 12)
    link_text(c, "see tool", lx2, b2y, "Inter-SB", 12,
              "https://www.linkedin.com/posts/j%C3%A9r%C3%A9my-cramer-9554126a_weve-built-a-gpt-ai-agent-to-find-the-best-activity-7329099450612682753-k840")
    c.setFillColor(INK); c.setFont("Inter", 12)
    c.drawString(lx2 + c.stringWidth("see tool", "Inter-SB", 12), b2y, ")")

    # Bullet 3: "read here" link
    b3y = cy + ch - 196
    c.setFillColor(SIGNAL); c.setFont("Mono", 12); c.drawString(78, b3y, "→")
    prefix3 = "\u201cOrganoids Digest\u201d newsletter launch ("
    c.setFillColor(INK); c.setFont("Inter", 12); c.drawString(100, b3y, prefix3)
    lx3 = 100 + c.stringWidth(prefix3, "Inter", 12)
    link_text(c, "read here", lx3, b3y, "Inter-SB", 12,
              "https://organoid.substack.com/p/watching-car-t-cells-in-action-within")
    c.setFillColor(INK); c.setFont("Inter", 12)
    c.drawString(lx3 + c.stringWidth("read here", "Inter-SB", 12), b3y, ")")

    # Bullet 4: no link
    b4y = cy + ch - 228
    c.setFillColor(SIGNAL); c.setFont("Mono", 12); c.drawString(78, b4y, "→")
    wrap(c, "Advanced scraping of pharma profiles and event speakers for personalized targeting campaigns",
         100, b4y, cw - 60, "Inter", 12, INK, lh=18)

    # ── Card 2: Sorcova Health ──
    card(c, 80 + cw, cy, cw, ch, WHITE, border_color=HexColor("#E3E0D8"), signal_top=True)

    c.setFont("Mono", 9); c.setFillColor(SIGNAL)
    c.drawString(98 + cw, cy + ch - 22, "// 02 — SORCOVA HEALTH")

    c.setFont("Inter-Bold", 18); c.setFillColor(INK)
    c.drawString(98 + cw, cy + ch - 50, "Sorcova Health")
    c.setFont("Inter", 12); c.setFillColor(STEEL)
    c.drawString(98 + cw, cy + ch - 68, "CEO — Personal Branding")
    hline(c, 98 + cw, cy + ch - 80, cw - 36, HexColor("#E3E0D8"), 0.4)

    wrap(c, "Built strategic personal brand reaching 500,000+ scientists through targeted content and thought leadership:",
         98 + cw, cy + ch - 100, cw - 56, "Inter", 12, INK, lh=20)

    # Bullet 1: "genome project post" link
    s1y = cy + ch - 160
    c.setFillColor(SIGNAL); c.setFont("Mono", 12); c.drawString(98 + cw, s1y, "→")
    prefix_s1 = "Viral content strategy for genomics research ("
    c.setFillColor(INK); c.setFont("Inter", 12); c.drawString(120 + cw, s1y, prefix_s1)
    lxs1 = 120 + cw + c.stringWidth(prefix_s1, "Inter", 12)
    link_text(c, "genome project post", lxs1, s1y, "Inter-SB", 12,
              "https://www.linkedin.com/posts/laviniaionita_half-a-million-genomes-15-billion-variants-activity-7366787611471912963-hrJr")
    c.setFillColor(INK); c.setFont("Inter", 12)
    c.drawString(lxs1 + c.stringWidth("genome project post", "Inter-SB", 12), s1y, ")")

    # Bullet 2: no link
    s2y = cy + ch - 206
    c.setFillColor(SIGNAL); c.setFont("Mono", 12); c.drawString(98 + cw, s2y, "→")
    wrap(c, "Brand platform development for stress biomarkers B2B GTM (10-day intensive sprint)",
         120 + cw, s2y, cw - 72, "Inter", 12, INK, lh=18)

    page_number(c, 6, TOTAL_PAGES, on_dark=False)
    url_label(c, 60, 32, on_dark=False)
    c.showPage()


# ─── PAGE 7: B2B COMPANIES (INK) ─────────────────────────────────────────────
def page7(c):
    fill_bg(c, INK)

    wordmark(c, 60, H - 44, size=11, on_dark=True)
    top_right_meta(c, "07 · B2B COMPANIES", on_dark=True)

    eyebrow(c, "// 07 — B2B COMPANIES", 60, H - 110)

    c.setFont("Inter-Bold", 38)
    c.setFillColor(WHITE)
    c.drawString(60, H - 180, "B2B Companies:")
    c.drawString(60, H - 224, "Marketing Leadership")
    lead_w = c.stringWidth("Marketing Leadership ", "Inter-Bold", 38)
    c.setFont("Serif-It", 38)
    c.drawString(60 + lead_w, H - 224, "that")
    that_w = c.stringWidth("that ", "Serif-It", 38)
    c.setFont("Inter-Bold", 38)
    c.drawString(60 + lead_w + that_w, H - 224, "Delivers.")

    hline(c, 60, H - 252, W - 120, GRAPHITE, 0.4)

    cases = [
        ("Sorcova Health",
         "Defined comprehensive brand platform and B2B go-to-market strategy for innovative stress biomarkers technology through focused 10-day strategic sprint.",
         ["Brand architecture", "GTM framework", "10-day sprint"]),
        ("HeyTeam",
         "Chief Marketing Officer for HR tech startup. Led 4-person marketing team and managed \u20ac500K annual budget to reach HR Directors of major French corporations.",
         ["Team leadership", "\u20ac500K budget", "HR Directors"]),
        ("Neok",
         "Designed and implemented automated LinkedIn and email sequences targeting HR professionals for preventive cancer checkup programs (2-month sprint delivery).",
         ["LinkedIn automation", "Email sequences", "2-month sprint"]),
    ]

    cw = (W - 120 - 2 * 20) / 3
    ch = 320
    cy = 82

    for i, (company, desc, tags) in enumerate(cases):
        cx2 = 60 + i * (cw + 20)
        card(c, cx2, cy, cw, ch, INK_SOFT, border_color=GRAPHITE, signal_top=True)
        top = cy + ch
        c.setFont("Mono", 9); c.setFillColor(SIGNAL)
        c.drawString(cx2 + 18, top - 24, f"// 0{i+1}")
        c.setFont("Inter-Bold", 17)
        c.setFillColor(WHITE)
        c.drawString(cx2 + 18, top - 52, company)
        hline(c, cx2 + 18, top - 64, cw - 36, GRAPHITE, 0.4)
        wrap(c, desc, cx2 + 18, top - 90, cw - 36, "Inter", 12, MIST, lh=20)

        ty = cy + 24
        for tag in tags:
            tbw = c.stringWidth(tag, "Mono", 10) + 20
            c.setFillColor(GRAPHITE)
            c.setStrokeColor(Color(0, 0, 0, 0))
            c.roundRect(cx2 + 18, ty, tbw, 22, 4, stroke=0, fill=1)
            c.setFont("Mono", 10)
            c.setFillColor(SIGNAL)
            c.drawString(cx2 + 28, ty + 6, tag)
            ty += 30

    page_number(c, 7, TOTAL_PAGES, on_dark=True)
    url_label(c, 60, 32, on_dark=True)
    c.showPage()


# ─── PAGE 8: PATIENT ENGAGEMENT (PAPER) ──────────────────────────────────────
def page8(c):
    fill_bg(c, PAPER)

    wordmark(c, 60, H - 44, size=11, on_dark=False)
    top_right_meta(c, "08 · PATIENT ENGAGEMENT", on_dark=False)

    eyebrow(c, "// 08 — PATIENT ENGAGEMENT", 60, H - 110)

    c.setFont("Inter-Bold", 38)
    c.setFillColor(INK)
    c.drawString(60, H - 180, "Patient Engagement:")
    c.setFont("Serif-It", 38)
    c.drawString(60, H - 224, "B2C and B2B2C strategies.")

    hline(c, 60, H - 252, W - 120, GRAPHITE, 0.4)

    cw = (W - 140) / 2
    ch = 430
    cy = 90

    # ── Card 1: Albus ──
    card(c, 60, cy, cw, ch, WHITE, border_color=HexColor("#E3E0D8"), signal_top=True)
    c.setFont("Mono", 9); c.setFillColor(SIGNAL)
    c.drawString(78, cy + ch - 22, "// 01 — ALBUS")
    c.setFont("Inter-Bold", 17)
    c.setFillColor(INK)
    c.drawString(78, cy + ch - 50, "Albus — B2C Strategy for Nurses")
    hline(c, 78, cy + ch - 64, cw - 36, HexColor("#E3E0D8"), 0.4)
    c.setFont("Inter", 12)
    c.setFillColor(INK)
    c.drawString(78, cy + ch - 88, "Comprehensive patient acquisition strategy:")

    items_albus = [
        "\u20ac300K paid advertising budget management across Facebook and Instagram",
        "Strategic influencer collaborations and partnerships",
        "Full agency management for content creation and paid campaigns",
        "Data-driven optimization and performance tracking",
    ]
    for i, item in enumerate(items_albus):
        iy = cy + ch - 124 - i * 44
        c.setFillColor(SIGNAL); c.setFont("Mono", 12); c.drawString(78, iy + 2, "→")
        wrap(c, item, 100, iy, cw - 60, "Inter", 12, INK, lh=18)

    # ── Card 2: Dr Solène Vo Quang ──
    card(c, 80 + cw, cy, cw, ch, WHITE, border_color=HexColor("#E3E0D8"), signal_top=True)
    c.setFont("Mono", 9); c.setFillColor(SIGNAL)
    c.drawString(98 + cw, cy + ch - 22, "// 02 — STOMATOLOGY CLINIC")
    c.setFont("Inter-Bold", 16)
    c.setFillColor(INK)
    c.drawString(98 + cw, cy + ch - 50, "Dr Sol\u00e8ne Vo Quang — Stomatology Clinic")
    hline(c, 98 + cw, cy + ch - 64, cw - 36, HexColor("#E3E0D8"), 0.4)
    wrap(c,
         "Developed sophisticated B2B2C referral strategy to expand patient network through professional healthcare partnerships and strategic positioning.",
         98 + cw, cy + ch - 96, cw - 56, "Inter", 13, INK, lh=22)

    page_number(c, 8, TOTAL_PAGES, on_dark=False)
    url_label(c, 60, 32, on_dark=False)
    c.showPage()


# ─── PAGE 9: SERVICES (INK) ──────────────────────────────────────────────────
def page9(c):
    fill_bg(c, INK)

    wordmark(c, 60, H - 44, size=11, on_dark=True)
    top_right_meta(c, "09 · EXAMPLES OF COLLABORATIONS", on_dark=True)

    eyebrow(c, "// 09 — EXAMPLES OF COLLABORATIONS", 60, H - 110)

    c.setFont("Inter-Bold", 38)
    c.setFillColor(WHITE)
    c.drawString(60, H - 180, "Examples of")
    ex_w = c.stringWidth("Examples of ", "Inter-Bold", 38)
    c.setFont("Serif-It", 38)
    c.drawString(60 + ex_w, H - 180, "collaborations.")

    hline(c, 60, H - 210, W - 120, GRAPHITE, 0.4)

    services = [
        ("Office Hour",
         "1h call",
         "1 hour call to challenge your growth strategy and execution.",
         "Book an office hour",
         "https://app.lemcal.com/@clementpougetosmont/office-hour-marketin"),
        ("Strategy Workshop",
         "2 days",
         "2 days to challenge and refocus your marketing strategy. A short, high-impact format to review your roadmap, define priorities, and prepare your next semester with an external, data-driven perspective.",
         None, None),
        ("Growth Sprint",
         "3 months",
         "3 months to build a sustainable acquisition machine. We set up your content and outbound system so it generates leads without me. You leave with a clear editorial roadmap, an effective outreach strategy, and measurable lead flow.",
         None, None),
        ("Marketing Director",
         "Long-term",
         "Long-term partnership to lead your marketing team. Your current Marketing Director leaving? Hire an experienced healthcare Marketing Director to take over, manage your team, and scale your operations.",
         None, None),
    ]

    cw = (W - 120 - 3 * 20) / 4
    ch = 440
    cy = 72

    for i, (title, duration, desc, cta_label, cta_url) in enumerate(services):
        cx2 = 60 + i * (cw + 20)
        # Highlight first card (Office Hour) in Signal to drive CTA
        is_signal = (i == 0)
        bg_color = SIGNAL if is_signal else INK_SOFT
        border = SIGNAL if is_signal else GRAPHITE
        text_primary = INK if is_signal else WHITE
        text_muted = GRAPHITE if is_signal else MIST
        card(c, cx2, cy, cw, ch, bg_color, border_color=border, signal_top=False)
        top = cy + ch

        # eyebrow mono
        c.setFont("Mono", 9)
        c.setFillColor(GRAPHITE if is_signal else SIGNAL)
        c.drawString(cx2 + 18, top - 24, f"// 0{i+1}")

        # Duration badge
        badge_color = INK if is_signal else SIGNAL_08
        c.setFillColor(badge_color if is_signal else Color(0, 0.839, 0.561, 0.15))
        c.setStrokeColor(Color(0, 0, 0, 0))
        bw = c.stringWidth(duration, "Mono-Bold", 11) + 18
        c.roundRect(cx2 + 18, top - 58, bw, 22, 4, stroke=0, fill=1)
        c.setFont("Mono-Bold", 11)
        c.setFillColor(SIGNAL if is_signal else SIGNAL)
        c.drawString(cx2 + 27, top - 51, duration)

        c.setFont("Inter-Bold", 18)
        c.setFillColor(text_primary)
        c.drawString(cx2 + 18, top - 92, title)
        hline(c, cx2 + 18, top - 105,
              cw - 36, GRAPHITE if is_signal else GRAPHITE, 0.4)

        wrap(c, desc, cx2 + 18, top - 132, cw - 36, "Inter", 12, text_muted, lh=20)

        if cta_label and cta_url:
            btn_y = cy + 20
            btn_h = 32
            btn_w = c.stringWidth(cta_label + "  →", "Inter-SB", 12) + 24
            c.setFillColor(INK if is_signal else SIGNAL)
            c.setStrokeColor(Color(0, 0, 0, 0))
            c.roundRect(cx2 + 18, btn_y, btn_w, btn_h, 4, stroke=0, fill=1)
            c.setFont("Inter-SB", 12)
            c.setFillColor(SIGNAL if is_signal else INK)
            c.drawString(cx2 + 30, btn_y + 11, cta_label + "  →")
            c.linkURL(cta_url, (cx2 + 18, btn_y, cx2 + 18 + btn_w, btn_y + btn_h), relative=0)
        else:
            c.setFont("Mono", 14)
            c.setFillColor(SIGNAL)
            c.drawString(cx2 + 18, cy + 24, "→")

    page_number(c, 9, TOTAL_PAGES, on_dark=True)
    url_label(c, 60, 32, on_dark=True)
    c.showPage()


# ─── PAGE 10: TESTIMONIALS (PAPER) ───────────────────────────────────────────
def page10(c):
    fill_bg(c, PAPER)

    wordmark(c, 60, H - 44, size=11, on_dark=False)
    top_right_meta(c, "10 · WHAT CLIENTS SAY", on_dark=False)

    eyebrow(c, "// 10 — WHAT CLIENTS SAY", 60, H - 110)

    c.setFont("Inter-Bold", 38)
    c.setFillColor(INK)
    c.drawString(60, H - 180, "What clients")
    cs_w = c.stringWidth("What clients ", "Inter-Bold", 38)
    c.setFont("Serif-It", 38)
    c.drawString(60 + cs_w, H - 180, "say.")

    hline(c, 60, H - 210, W - 120, GRAPHITE, 0.4)

    testimonials = [
        ("Thomas Alston", "DocCity",
         "Concrete growth results. Cl\u00e9ment understands healthcare and knows how to scale."),
        ("Damien Zivanovic", "Andrew",
         "A pleasure to work with. Strategic thinking combined with hands-on execution."),
        ("Marc Nasser", "Waicah",
         "Fast, competent, and genuinely kind. Delivered beyond our expectations."),
        ("Arnaud Cutivet", "MsInsight",
         "Helped us solidify our marketing roadmap and focus on what matters most."),
    ]

    cw = (W - 140) / 2
    ch_grid = 240
    grid_top = H - 240
    gap_y = 20

    positions = [
        (60,        grid_top - ch_grid),
        (80 + cw,   grid_top - ch_grid),
        (60,        grid_top - 2 * ch_grid - gap_y),
        (80 + cw,   grid_top - 2 * ch_grid - gap_y),
    ]

    for (x, y), (name, company, quote) in zip(positions, testimonials):
        card(c, x, y, cw, ch_grid, WHITE, border_color=HexColor("#E3E0D8"), signal_top=True)
        top = y + ch_grid
        # Open-quote typographic — Instrument Serif italic
        c.setFont("Serif-It", 72)
        c.setFillColor(SIGNAL)
        c.drawString(x + 20, top - 56, "\u201c")
        # Quote body — Instrument Serif italic (citation)
        wrap(c, quote, x + 20, top - 86, cw - 40, "Serif-It", 18, INK, lh=26)
        # Attribution
        c.setFont("Inter-Bold", 12)
        c.setFillColor(INK)
        c.drawString(x + 20, y + 44, name)
        c.setFont("Mono", 10)
        c.setFillColor(SIGNAL)
        c.drawString(x + 20, y + 26, f"// {company.upper()}")

    page_number(c, 10, TOTAL_PAGES, on_dark=False)
    url_label(c, 60, 32, on_dark=False)
    c.showPage()


# ─── PAGE 11: CLOSING (SIGNAL — CTA) ─────────────────────────────────────────
def page11(c):
    fill_bg(c, SIGNAL)

    # Wordmark en Ink sur fond Signal
    wordmark(c, 60, H - 44, size=11, on_dark=False)
    top_right_meta(c, "11 · READY?", on_dark=False)

    # Eyebrow mono Ink (pas Signal — perd de contraste sur fond Signal)
    c.setFont("Mono", 10)
    c.setFillColor(INK)
    c.drawString(60, H - 110, "// 11 — CALL TO ACTION")

    cx = 60

    # Big display — on garde la structure "If you're reading this…"
    c.setFont("Inter-Bold", 54)
    c.setFillColor(INK)
    c.drawString(cx, H - 200, "If you\u2019re reading this,")

    c.setFont("Serif-It", 48)
    c.setFillColor(INK)
    c.drawString(cx, H - 260, "you probably have the ambition")

    c.setFont("Inter-Bold", 48)
    c.setFillColor(INK)
    c.drawString(cx, H - 318, "to become a reference in healthcare.")

    hline(c, cx, H - 360, 420, INK, 1)

    c.setFont("Inter-Bold", 46)
    c.setFillColor(INK)
    c.drawString(cx, H - 430, "Let\u2019s make it")
    lm_w = c.stringWidth("Let's make it ", "Inter-Bold", 46)
    c.setFont("Serif-It", 46)
    c.drawString(cx + lm_w, H - 430, "happen.")

    # CTA button (inverted — Ink on Signal page)
    cta_url = "https://www.clempo.fr/booking"
    cta_text = "Book a 30-min call  →"
    btn_w = 280
    btn_h = 52
    btn_y = H - 518
    c.setFillColor(INK)
    c.setStrokeColor(Color(0, 0, 0, 0))
    c.roundRect(cx, btn_y, btn_w, btn_h, 6, stroke=0, fill=1)
    c.setFont("Inter-Bold", 14)
    c.setFillColor(SIGNAL)
    tw = c.stringWidth(cta_text, "Inter-Bold", 14)
    c.drawString(cx + (btn_w - tw) / 2, btn_y + 18, cta_text)
    c.linkURL(cta_url, (cx, btn_y, cx + btn_w, btn_y + btn_h), relative=0)

    # Dot matrix motif right
    dot_matrix(c, 830, 100, cols=22, rows=22, step=16,
               color=Color(0.04, 0.04, 0.05, 0.18))

    # Footer variants (Ink on Signal)
    c.setFont("Mono", 9)
    c.setFillColor(INK)
    c.drawString(60, 32, "// clempo.fr")
    c.drawRightString(W - 60, 32, f"— 11 / {TOTAL_PAGES:02d}")
    c.showPage()


# ─── PAGE 12: CONTACT (INK, COLOPHON) ────────────────────────────────────────
def page12(c):
    fill_bg(c, INK)

    wordmark(c, 60, H - 44, size=11, on_dark=True)
    top_right_meta(c, "12 · COLOPHON · CONTACT", on_dark=True)

    eyebrow(c, "// 12 — GET IN TOUCH", 60, H - 110)

    c.setFont("Inter-Bold", 46)
    c.setFillColor(WHITE)
    c.drawString(60, H - 190, "Cl\u00e9ment Pouget-Osmont.")

    c.setFont("Serif-It", 22)
    c.setFillColor(MIST)
    c.drawString(60, H - 226, "— healthcare marketing director.")

    hline(c, 60, H - 258, W - 120, GRAPHITE, 0.5)

    cy = H - 310

    # Email — clickable
    c.setFont("Mono", 10); c.setFillColor(SIGNAL)
    c.drawString(60, cy + 24, "// EMAIL")
    email = "clement.pougetosmont@gmail.com"
    c.setFont("Inter", 18)
    c.setFillColor(WHITE)
    c.drawString(60, cy, email)
    ew = c.stringWidth(email, "Inter", 18)
    c.linkURL("mailto:clement.pougetosmont@gmail.com",
              (60, cy - 4, 60 + ew, cy + 18), relative=0)

    # Phone
    cy -= 64
    c.setFont("Mono", 10); c.setFillColor(SIGNAL)
    c.drawString(60, cy + 24, "// PHONE")
    c.setFont("Inter", 18)
    c.setFillColor(WHITE)
    c.drawString(60, cy, "+33 6 62 64 39 55")

    # clempo.fr | LinkedIn — both clickable
    cy -= 64
    c.setFont("Mono", 10); c.setFillColor(SIGNAL)
    c.drawString(60, cy + 24, "// WEB")
    c.setFont("Inter-SB", 18)
    c.setFillColor(WHITE)
    site = "clempo.fr"
    c.drawString(60, cy, site)
    sw = c.stringWidth(site, "Inter-SB", 18)
    c.linkURL("https://clempo.fr/", (60, cy - 4, 60 + sw, cy + 18), relative=0)

    sep = "  ·  "
    c.setFont("Inter", 18)
    c.setFillColor(STEEL)
    sepw = c.stringWidth(sep, "Inter", 18)
    c.drawString(60 + sw, cy, sep)

    linkedin = "Connect on LinkedIn"
    c.setFont("Inter-SB", 18)
    c.setFillColor(SIGNAL)
    lx = 60 + sw + sepw
    c.drawString(lx, cy, linkedin)
    lnw = c.stringWidth(linkedin, "Inter-SB", 18)
    # Underline Signal
    c.setStrokeColor(SIGNAL); c.setLineWidth(0.6)
    c.line(lx, cy - 2, lx + lnw, cy - 2)
    c.linkURL("https://www.linkedin.com/in/cl%C3%A9ment-pougetosmont/",
              (lx, cy - 4, lx + lnw, cy + 18), relative=0)

    # Colophon bottom
    hline(c, 60, 82, W - 120, GRAPHITE, 0.4)
    c.setFont("Mono", 9)
    c.setFillColor(MIST)
    c.drawString(60, 58, "// SERVICES PRESENTATION · V1 · 2026")
    c.drawRightString(W - 60, 58, "// TYPO · INTER + INSTRUMENT SERIF + JETBRAINS MONO")
    c.setFont("Inter", 9)
    c.setFillColor(STEEL)
    c.drawString(60, 42, "\u00a9 2026 Cl\u00e9ment Pouget-Osmont · All rights reserved")

    # Right-side dot matrix (signature)
    dot_matrix(c, 820, 330, cols=20, rows=18, step=16, color=SIGNAL_08)

    # Page number / URL
    c.setFont("Mono", 9)
    c.setFillColor(MIST)
    c.drawString(60, 26, "// clempo.fr")
    c.drawRightString(W - 60, 26, f"— 12 / {TOTAL_PAGES:02d}")

    c.showPage()


# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    c = canvas.Canvas(OUTPUT_PATH, pagesize=(W, H))
    c.setTitle("Services Presentation 2026 \u2014 Cl\u00e9ment Pouget-Osmont")
    c.setAuthor("Cl\u00e9ment Pouget-Osmont")
    c.setSubject("Healthcare Marketing Director \u2014 Services")
    c.setKeywords("clempo, healthcare, marketing, fractional CMO, services, 2026")

    page1(c)
    page2(c)
    page3(c)
    page4(c)
    page5(c)
    page6(c)
    page7(c)
    page8(c)
    page9(c)
    page10(c)
    page11(c)
    page12(c)

    c.save()
    print(f"PDF generated: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
