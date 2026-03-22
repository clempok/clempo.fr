#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, Color

# ─── Configuration ────────────────────────────────────────────────────────────
FONTS_DIR = "/Users/clemos/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/ca531e7f-5547-4ae5-ae76-52ff3649c89f/04a208ed-8fb3-4267-b82c-4f66957e6e90/skills/canvas-design/canvas-fonts"
OUTPUT_PATH = "/Users/clemos/Desktop/clempo-fr/public/CPO-Services-2026-design.pdf"

W, H = 1200, 800

BG      = HexColor("#09090b")
YELLOW  = HexColor("#F9F9A8")
WHITE   = HexColor("#ffffff")
MUTED   = HexColor("#a1a1aa")
BORDER  = HexColor("#27272a")
CARD_BG = HexColor("#111113")
CARD_B2 = HexColor("#18181b")

def reg(name, file):
    pdfmetrics.registerFont(TTFont(name, f"{FONTS_DIR}/{file}"))

reg("Sans",       "InstrumentSans-Regular.ttf")
reg("SansBold",   "InstrumentSans-Bold.ttf")
reg("SansItalic", "InstrumentSans-Italic.ttf")
reg("Display",    "BricolageGrotesque-Bold.ttf")
reg("DisplayReg", "BricolageGrotesque-Regular.ttf")

# ─── Helpers ──────────────────────────────────────────────────────────────────
def bg(c):
    c.setFillColor(BG)
    c.rect(0, 0, W, H, stroke=0, fill=1)

def hline(c, x, y, w, color=None, t=0.5):
    c.setStrokeColor(color or BORDER)
    c.setLineWidth(t)
    c.line(x, y, x + w, y)

def label(c, text, x, y):
    c.setFont("Sans", 10)
    c.setFillColor(YELLOW)
    c.drawString(x, y, "● " + text.upper())

def card(c, x, y, w, h, bg_color=None, top_accent=None):
    c.setFillColor(bg_color or CARD_BG)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.roundRect(x, y, w, h, 6, stroke=1, fill=1)
    if top_accent:
        c.setStrokeColor(top_accent)
        c.setLineWidth(2)
        c.line(x + 6, y + h, x + w - 6, y + h)

def wrap(c, text, x, y, width, font, size, color, lh=None):
    """Word-wrap text; returns final y."""
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

def footer(c):
    c.setFont("Sans", 10)
    c.setFillColor(MUTED)
    c.drawString(60, 28, "clempo.fr")

def link_text(c, text, x, y, font, size, url):
    """Draw yellow underlined link and attach URL. Returns text width."""
    c.setFont(font, size)
    c.setFillColor(YELLOW)
    c.drawString(x, y, text)
    tw = c.stringWidth(text, font, size)
    c.setStrokeColor(YELLOW)
    c.setLineWidth(0.5)
    c.line(x, y - 1, x + tw, y - 1)
    c.linkURL(url, (x, y - 2, x + tw, y + size), relative=0)
    return tw

# ─── PAGE 1: COVER ────────────────────────────────────────────────────────────
def page1(c):
    bg(c)

    # Right decorative circles
    c.setStrokeColor(Color(0.976, 0.976, 0.659, 0.10))
    c.setLineWidth(60)
    c.circle(980, 400, 360, stroke=1, fill=0)
    c.setFillColor(Color(0.976, 0.976, 0.659, 0.05))
    c.setStrokeColor(Color(0.976, 0.976, 0.659, 0.15))
    c.setLineWidth(1.5)
    c.circle(840, 550, 140, stroke=1, fill=1)
    c.setFillColor(Color(0.976, 0.976, 0.659, 0.12))
    c.circle(1060, 270, 55, stroke=0, fill=1)

    # Year
    c.setFont("Sans", 12)
    c.setFillColor(YELLOW)
    c.drawString(60, H - 50, "2026")

    # Name
    ny = 490
    c.setFont("Display", 80)
    c.setFillColor(WHITE)
    c.drawString(60, ny, "Clément")
    c.drawString(60, ny - 92, "Pouget-Osmont")

    # Yellow accent line
    c.setStrokeColor(YELLOW)
    c.setLineWidth(2)
    c.line(60, ny - 112, 320, ny - 112)

    c.setFont("SansBold", 24)
    c.setFillColor(YELLOW)
    c.drawString(60, ny - 150, "Healthcare Marketing Director")

    c.setFont("Sans", 16)
    c.setFillColor(MUTED)
    c.drawString(60, ny - 185, "Services presentation")

    footer(c)
    c.showPage()

# ─── PAGE 2: PHILOSOPHY ───────────────────────────────────────────────────────
def page2(c):
    bg(c)

    # Faint "02"
    c.setFont("Display", 220)
    c.setFillColor(Color(0.976, 0.976, 0.659, 0.04))
    c.drawString(W - 380, H - 270, "02")

    cx = 80
    cy = 540

    c.setFont("Display", 68)
    c.setFillColor(WHITE)
    c.drawString(cx, cy, "Not an agency")

    c.setFont("Display", 52)
    c.setFillColor(YELLOW)
    c.drawString(cx, cy - 88, "\u2014")

    c.setFont("Display", 68)
    c.setFillColor(WHITE)
    c.drawString(cx, cy - 160, "An extra team member")

    hline(c, cx, cy - 200, W - cx - 80)

    wrap(c, "Embedded strategic leadership. No overhead. No onboarding lag. Just results.",
         cx, cy - 235, W - cx * 2 - 80, "Sans", 18, MUTED, lh=32)

    footer(c)
    c.showPage()

# ─── PAGE 3: EXPERIENCE OVERVIEW ──────────────────────────────────────────────
def page3(c):
    bg(c)

    label(c, "My Experience", 60, H - 68)
    hline(c, 182, H - 61, W - 242)

    c.setFont("Display", 40)
    c.setFillColor(WHITE)
    c.drawString(60, H - 138, "My Experiences with diverse healthcare targets:")

    targets = [
        "Healthcare Professionals",
        "Hospitals & Institutions",
        "Pharma & Biotech",
        "B2B Companies",
        "Patients",
    ]

    pw = 420
    ph = 52
    gap = 16
    sy = H - 218

    for i, text in enumerate(targets):
        py = sy - i * (ph + gap)
        highlight = (i == len(targets) - 1)
        if highlight:
            c.setFillColor(YELLOW)
            c.setStrokeColor(YELLOW)
        else:
            c.setFillColor(BG)
            c.setStrokeColor(BORDER)
        c.setLineWidth(0.8)
        c.roundRect(60, py, pw, ph, ph / 2, stroke=1, fill=1)
        c.setFont("Sans", 14)
        c.setFillColor(BG if highlight else WHITE)
        tw = c.stringWidth(text, "Sans", 14)
        c.drawString(60 + (pw - tw) / 2, py + (ph - 14) / 2 + 2, text)

    # Decorative right circles
    c.setFillColor(Color(0.976, 0.976, 0.659, 0.04))
    c.setStrokeColor(Color(0.976, 0.976, 0.659, 0.08))
    c.setLineWidth(1)
    c.circle(950, 380, 260, stroke=1, fill=1)
    c.circle(950, 380, 160, stroke=1, fill=0)
    c.setFillColor(Color(0.976, 0.976, 0.659, 0.10))
    c.circle(950, 380, 60, stroke=0, fill=1)

    footer(c)
    c.showPage()

# ─── PAGE 4: HEALTHCARE PROFESSIONALS ────────────────────────────────────────
def page4(c):
    bg(c)

    label(c, "Healthcare Professionals", 60, H - 68)
    hline(c, 272, H - 61, W - 332)

    c.setFont("Display", 40)
    c.setFillColor(WHITE)
    c.drawString(60, H - 138, "Healthcare Professionals")

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
    ch = 220
    cy = 80

    for i, (company, desc) in enumerate(cases):
        cx = 60 + i * (cw + 16)
        card(c, cx, cy, cw, ch, CARD_BG, YELLOW)
        c.setFont("SansBold", 13)
        c.setFillColor(WHITE)
        c.drawString(cx + 14, cy + ch - 28, company)
        hline(c, cx + 14, cy + ch - 38, cw - 28, BORDER, 0.4)
        wrap(c, desc, cx + 14, cy + ch - 58, cw - 28, "Sans", 11, MUTED, lh=17)

    footer(c)
    c.showPage()

# ─── PAGE 5: HOSPITALS ────────────────────────────────────────────────────────
def page5(c):
    bg(c)

    label(c, "Hospitals & Institutions", 60, H - 68)
    hline(c, 260, H - 61, W - 320)

    lw = W * 0.58

    c.setFont("Display", 36)
    c.setFillColor(WHITE)
    c.drawString(60, H - 138, "Hospitals (Privates & Publics) :")

    c.setFont("Display", 30)
    c.setFillColor(YELLOW)
    c.drawString(60, H - 184, "Navigating Complex B2B Healthcare Sales")

    wrap(c,
         "Successfully reaching and closing deals with hospitals requires deep understanding of institutional decision-making, regulatory requirements, Interoperability and long sales cycles.",
         60, H - 234, lw - 80, "Sans", 14, MUTED, lh=24)

    case_y = 110
    case_h = 200
    case_w = (lw - 80 - 20) / 2

    # Doctolib
    card(c, 60, case_y, case_w, case_h, CARD_BG, YELLOW)
    c.setFont("SansBold", 14)
    c.setFillColor(WHITE)
    c.drawString(76, case_y + case_h - 28, "Doctolib")
    hline(c, 76, case_y + case_h - 40, case_w - 28, BORDER, 0.4)
    wrap(c,
         "Key Account Manager for hospitals in Eastern France. Successfully closed major institutions including CHR Metz, CHRU Nancy, CH Colmar, and CH Mulhouse.",
         76, case_y + case_h - 60, case_w - 32, "Sans", 11, MUTED, lh=17)

    # Kiro
    card(c, 80 + case_w, case_y, case_w, case_h, CARD_BG, YELLOW)
    c.setFont("SansBold", 14)
    c.setFillColor(WHITE)
    c.drawString(96 + case_w, case_y + case_h - 28, "Kiro")
    hline(c, 96 + case_w, case_y + case_h - 40, case_w - 28, BORDER, 0.4)
    wrap(c,
         "Co-developed advanced diagnostic solution in strategic partnership with H\u00f4pital Am\u00e9ricain de Paris, demonstrating clinical validation and market fit.",
         96 + case_w, case_y + case_h - 60, case_w - 32, "Sans", 11, MUTED, lh=17)

    # Deco right
    c.setFont("Display", 260)
    c.setFillColor(Color(0.976, 0.976, 0.659, 0.04))
    c.drawString(lw + 20, 60, "05")

    footer(c)
    c.showPage()

# ─── PAGE 6: PHARMA & BIOTECH ─────────────────────────────────────────────────
def page6(c):
    bg(c)

    label(c, "Pharma & Biotech", 60, H - 68)
    hline(c, 206, H - 61, W - 266)

    c.setFont("Display", 40)
    c.setFillColor(WHITE)
    c.drawString(60, H - 138, "Pharma & Biotech: International scaling")

    cw = (W - 140) / 2
    ch = 480
    cy = 60

    # ── Card 1: Cherry Biotech ──
    card(c, 60, cy, cw, ch, CARD_B2, YELLOW)

    c.setFont("SansBold", 17)
    c.setFillColor(YELLOW)
    c.drawString(78, cy + ch - 36, "Cherry Biotech")
    c.setFont("Sans", 12)
    c.setFillColor(MUTED)
    c.drawString(78, cy + ch - 56, "VP Marketing")
    hline(c, 78, cy + ch - 68, cw - 36, BORDER, 0.4)

    c.setFont("Sans", 12)
    c.setFillColor(WHITE)
    c.drawString(78, cy + ch - 90, "Leading marketing strategy for cutting-edge organoids technology company:")

    # Bullet 1: "example post" link
    b1y = cy + ch - 120
    c.setFillColor(YELLOW); c.setFont("Sans", 12); c.drawString(78, b1y, "\u2192")
    prefix1 = "Executive branding and thought leadership ("
    c.setFillColor(WHITE); c.setFont("Sans", 12); c.drawString(96, b1y, prefix1)
    lx1 = 96 + c.stringWidth(prefix1, "Sans", 12)
    link_text(c, "example post", lx1, b1y, "Sans", 12,
              "https://www.linkedin.com/posts/pierre-gaudriault-34263041_bold-move-from-france-2030-investing-activity-7310685115263647746-zK_g")
    c.setFillColor(WHITE); c.setFont("Sans", 12)
    c.drawString(lx1 + c.stringWidth("example post", "Sans", 12), b1y, ")")

    # Bullet 2: "see tool" link
    b2y = cy + ch - 152
    c.setFillColor(YELLOW); c.setFont("Sans", 12); c.drawString(78, b2y, "\u2192")
    prefix2 = "GPT Organoid lead magnet development ("
    c.setFillColor(WHITE); c.setFont("Sans", 12); c.drawString(96, b2y, prefix2)
    lx2 = 96 + c.stringWidth(prefix2, "Sans", 12)
    link_text(c, "see tool", lx2, b2y, "Sans", 12,
              "https://www.linkedin.com/posts/j%C3%A9r%C3%A9my-cramer-9554126a_weve-built-a-gpt-ai-agent-to-find-the-best-activity-7329099450612682753-k840")
    c.setFillColor(WHITE); c.setFont("Sans", 12)
    c.drawString(lx2 + c.stringWidth("see tool", "Sans", 12), b2y, ")")

    # Bullet 3: "read here" link
    b3y = cy + ch - 184
    c.setFillColor(YELLOW); c.setFont("Sans", 12); c.drawString(78, b3y, "\u2192")
    prefix3 = "\u201cOrganoids Digest\u201d newsletter launch ("
    c.setFillColor(WHITE); c.setFont("Sans", 12); c.drawString(96, b3y, prefix3)
    lx3 = 96 + c.stringWidth(prefix3, "Sans", 12)
    link_text(c, "read here", lx3, b3y, "Sans", 12,
              "https://organoid.substack.com/p/watching-car-t-cells-in-action-within")
    c.setFillColor(WHITE); c.setFont("Sans", 12)
    c.drawString(lx3 + c.stringWidth("read here", "Sans", 12), b3y, ")")

    # Bullet 4: no link
    b4y = cy + ch - 216
    c.setFillColor(YELLOW); c.setFont("Sans", 12); c.drawString(78, b4y, "\u2192")
    wrap(c, "Advanced scraping of pharma profiles and event speakers for personalized targeting campaigns",
         96, b4y, cw - 60, "Sans", 12, WHITE, lh=18)

    # ── Card 2: Sorcova Health ──
    card(c, 80 + cw, cy, cw, ch, CARD_B2, YELLOW)

    c.setFont("SansBold", 17)
    c.setFillColor(YELLOW)
    c.drawString(98 + cw, cy + ch - 36, "Sorcova Health")
    c.setFont("Sans", 12)
    c.setFillColor(MUTED)
    c.drawString(98 + cw, cy + ch - 56, "CEO \u2014 Personal Branding")
    hline(c, 98 + cw, cy + ch - 68, cw - 36, BORDER, 0.4)

    wrap(c, "Built strategic personal brand reaching 500,000+ scientists through targeted content and thought leadership:",
         98 + cw, cy + ch - 90, cw - 56, "Sans", 12, WHITE, lh=20)

    # Bullet 1: "genome project post" link
    s1y = cy + ch - 150
    c.setFillColor(YELLOW); c.setFont("Sans", 12); c.drawString(98 + cw, s1y, "\u2192")
    prefix_s1 = "Viral content strategy for genomics research ("
    c.setFillColor(WHITE); c.setFont("Sans", 12); c.drawString(116 + cw, s1y, prefix_s1)
    lxs1 = 116 + cw + c.stringWidth(prefix_s1, "Sans", 12)
    link_text(c, "genome project post", lxs1, s1y, "Sans", 12,
              "https://www.linkedin.com/posts/laviniaionita_half-a-million-genomes-15-billion-variants-activity-7366787611471912963-hrJr")
    c.setFillColor(WHITE); c.setFont("Sans", 12)
    c.drawString(lxs1 + c.stringWidth("genome project post", "Sans", 12), s1y, ")")

    # Bullet 2: no link
    s2y = cy + ch - 196
    c.setFillColor(YELLOW); c.setFont("Sans", 12); c.drawString(98 + cw, s2y, "\u2192")
    wrap(c, "Brand platform development for stress biomarkers B2B GTM (10-day intensive sprint)",
         116 + cw, s2y, cw - 72, "Sans", 12, WHITE, lh=18)

    footer(c)
    c.showPage()

# ─── PAGE 7: B2B COMPANIES ────────────────────────────────────────────────────
def page7(c):
    bg(c)

    label(c, "B2B Companies", 60, H - 68)
    hline(c, 180, H - 61, W - 240)

    c.setFont("Display", 40)
    c.setFillColor(WHITE)
    c.drawString(60, H - 138, "B2B Companies: Marketing Leadership")
    c.drawString(60, H - 186, "That Delivers")

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
    ch = 330
    cy = 58

    for i, (company, desc, tags) in enumerate(cases):
        cx2 = 60 + i * (cw + 20)
        card(c, cx2, cy, cw, ch, CARD_BG, YELLOW)
        top = cy + ch
        c.setFont("SansBold", 16)
        c.setFillColor(WHITE)
        c.drawString(cx2 + 18, top - 30, company)
        hline(c, cx2 + 18, top - 42, cw - 36, BORDER, 0.4)
        wrap(c, desc, cx2 + 18, top - 70, cw - 36, "Sans", 12, MUTED, lh=20)

        ty = cy + 24
        for tag in tags:
            tbw = c.stringWidth(tag, "Sans", 11) + 18
            c.setFillColor(BORDER)
            c.setStrokeColor(Color(0.4, 0.4, 0.43))
            c.setLineWidth(0.5)
            c.roundRect(cx2 + 18, ty, tbw, 22, 4, stroke=1, fill=1)
            c.setFont("Sans", 11)
            c.setFillColor(MUTED)
            c.drawString(cx2 + 27, ty + 6, tag)
            ty += 30

    footer(c)
    c.showPage()

# ─── PAGE 8: PATIENT ENGAGEMENT ──────────────────────────────────────────────
def page8(c):
    bg(c)

    label(c, "Patient Engagement", 60, H - 68)
    hline(c, 220, H - 61, W - 280)

    c.setFont("Display", 40)
    c.setFillColor(WHITE)
    c.drawString(60, H - 138, "Patient Engagement: B2C and B2B2C Strategies")

    cw = (W - 140) / 2
    ch = 460
    cy = 70

    # ── Card 1: Albus ──
    card(c, 60, cy, cw, ch, CARD_B2, YELLOW)
    c.setFont("SansBold", 17)
    c.setFillColor(YELLOW)
    c.drawString(78, cy + ch - 38, "Albus \u2013 B2C Strategy for Nurses")
    hline(c, 78, cy + ch - 52, cw - 36, BORDER, 0.4)
    c.setFont("Sans", 13)
    c.setFillColor(WHITE)
    c.drawString(78, cy + ch - 74, "Comprehensive patient acquisition strategy:")

    items_albus = [
        "\u20ac300K paid advertising budget management across Facebook and Instagram",
        "Strategic influencer collaborations and partnerships",
        "Full agency management for content creation and paid campaigns",
        "Data-driven optimization and performance tracking",
    ]
    for i, item in enumerate(items_albus):
        iy = cy + ch - 108 - i * 44
        c.setFillColor(YELLOW); c.setFont("Sans", 13); c.drawString(78, iy + 2, "\u2192")
        wrap(c, item, 98, iy, cw - 64, "Sans", 12, WHITE, lh=18)

    # ── Card 2: Dr Solène Vo Quang ──
    card(c, 80 + cw, cy, cw, ch, CARD_B2, YELLOW)
    c.setFont("SansBold", 16)
    c.setFillColor(YELLOW)
    c.drawString(98 + cw, cy + ch - 38, "Dr Sol\u00e8ne Vo Quang \u2013 Stomatology Clinic")
    hline(c, 98 + cw, cy + ch - 52, cw - 36, BORDER, 0.4)
    wrap(c,
         "Developed sophisticated B2B2C referral strategy to expand patient network through professional healthcare partnerships and strategic positioning.",
         98 + cw, cy + ch - 84, cw - 56, "Sans", 13, WHITE, lh=22)

    footer(c)
    c.showPage()

# ─── PAGE 9: SERVICES ─────────────────────────────────────────────────────────
def page9(c):
    bg(c)

    label(c, "Examples of Collaborations", 60, H - 68)
    hline(c, 290, H - 61, W - 350)

    c.setFont("Display", 40)
    c.setFillColor(WHITE)
    c.drawString(60, H - 138, "Examples of collaborations")

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
    cy = 56

    for i, (title, duration, desc, cta_label, cta_url) in enumerate(services):
        cx2 = 60 + i * (cw + 20)
        card(c, cx2, cy, cw, ch, CARD_BG, YELLOW)
        top = cy + ch

        # Duration badge
        c.setFillColor(Color(0.976, 0.976, 0.659, 0.13))
        c.setStrokeColor(Color(0, 0, 0, 0))
        bw = c.stringWidth(duration, "SansBold", 11) + 18
        c.roundRect(cx2 + 18, top - 50, bw, 22, 4, stroke=0, fill=1)
        c.setFont("SansBold", 11)
        c.setFillColor(YELLOW)
        c.drawString(cx2 + 27, top - 43, duration)

        c.setFont("SansBold", 17)
        c.setFillColor(WHITE)
        c.drawString(cx2 + 18, top - 80, title)
        hline(c, cx2 + 18, top - 93, cw - 36, BORDER, 0.4)

        wrap(c, desc, cx2 + 18, top - 122, cw - 36, "Sans", 12, MUTED, lh=20)

        if cta_label and cta_url:
            btn_y = cy + 20
            btn_h = 30
            btn_w = c.stringWidth(cta_label, "SansBold", 11) + 24
            c.setFillColor(YELLOW)
            c.setStrokeColor(Color(0, 0, 0, 0))
            c.roundRect(cx2 + 18, btn_y, btn_w, btn_h, 4, stroke=0, fill=1)
            c.setFont("SansBold", 11)
            c.setFillColor(BG)
            c.drawString(cx2 + 30, btn_y + 10, cta_label)
            c.linkURL(cta_url, (cx2 + 18, btn_y, cx2 + 18 + btn_w, btn_y + btn_h), relative=0)
        else:
            c.setFont("Display", 22)
            c.setFillColor(Color(0.976, 0.976, 0.659, 0.28))
            c.drawString(cx2 + 18, cy + 18, "\u2192")

    footer(c)
    c.showPage()

# ─── PAGE 10: TESTIMONIALS ────────────────────────────────────────────────────
def page10(c):
    bg(c)

    label(c, "What Clients Say", 60, H - 68)
    hline(c, 202, H - 61, W - 262)

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
    ch = (H - 170) / 2

    positions = [
        (60,        H / 2 + 8),
        (80 + cw,   H / 2 + 8),
        (60,        H / 2 - ch - 8),
        (80 + cw,   H / 2 - ch - 8),
    ]

    for (x, y), (name, company, quote) in zip(positions, testimonials):
        card(c, x, y, cw, ch - 18, CARD_BG)
        top = y + ch - 18
        c.setFont("Display", 64)
        c.setFillColor(Color(0.976, 0.976, 0.659, 0.08))
        c.drawString(x + 14, top - 52, "\u201c")
        wrap(c, quote, x + 18, top - 66, cw - 36, "SansItalic", 14, WHITE, lh=24)
        c.setFont("SansBold", 12)
        c.setFillColor(YELLOW)
        c.drawString(x + 18, y + 38, name)
        c.setFont("Sans", 11)
        c.setFillColor(MUTED)
        c.drawString(x + 18, y + 22, company)

    footer(c)
    c.showPage()

# ─── PAGE 11: CLOSING ─────────────────────────────────────────────────────────
def page11(c):
    bg(c)

    # Diagonal texture
    c.setStrokeColor(Color(1, 1, 1, 0.015))
    c.setLineWidth(0.4)
    for i in range(-H, W + H, 28):
        c.line(i, 0, i + H, H)

    cx = 80

    c.setFont("SansBold", 14)
    c.setFillColor(YELLOW)
    c.drawString(cx, H - 110, "\u2014 Ready?")

    c.setFont("Display", 50)
    c.setFillColor(WHITE)
    c.drawString(cx, H - 186, "If you\u2019re reading this,")
    c.drawString(cx, H - 250, "you probably have the ambition to become a reference")
    c.drawString(cx, H - 314, "in healthcare.")

    hline(c, cx, H - 356, 420, BORDER, 0.5)

    c.setFont("Display", 46)
    c.setFillColor(YELLOW)
    c.drawString(cx, H - 416, "Let\u2019s make it happen")

    # CTA button — clickable
    cta_url = "https://app.lemcal.com/@clementpougetosmont/45-minutes"
    cta_text = "Book a 45-min call \u2192"
    btn_w = 262
    btn_h = 48
    btn_y = H - 508
    c.setFillColor(YELLOW)
    c.setStrokeColor(Color(0, 0, 0, 0))
    c.roundRect(cx, btn_y, btn_w, btn_h, 6, stroke=0, fill=1)
    c.setFont("SansBold", 14)
    c.setFillColor(BG)
    tw = c.stringWidth(cta_text, "SansBold", 14)
    c.drawString(cx + (btn_w - tw) / 2, btn_y + 17, cta_text)
    c.linkURL(cta_url, (cx, btn_y, cx + btn_w, btn_y + btn_h), relative=0)

    # Deco right circles
    c.setStrokeColor(Color(0.976, 0.976, 0.659, 0.06))
    c.setLineWidth(55)
    c.circle(1010, 380, 290, stroke=1, fill=0)
    c.setLineWidth(1)
    c.setStrokeColor(Color(0.976, 0.976, 0.659, 0.14))
    c.circle(1010, 380, 175, stroke=1, fill=0)

    footer(c)
    c.showPage()

# ─── PAGE 12: CONTACT ─────────────────────────────────────────────────────────
def page12(c):
    bg(c)

    # Left accent bar
    c.setFillColor(Color(0.976, 0.976, 0.659, 0.06))
    c.rect(0, 0, 5, H, stroke=0, fill=1)
    c.setFillColor(Color(0.976, 0.976, 0.659, 0.12))
    c.rect(0, 0, 2, H, stroke=0, fill=1)

    label(c, "Get in Touch", 80, H - 78)
    hline(c, 188, H - 71, W - 248)

    c.setFont("Display", 50)
    c.setFillColor(WHITE)
    c.drawString(80, H - 168, "Cl\u00e9ment Pouget-Osmont")

    c.setFont("Sans", 20)
    c.setFillColor(MUTED)
    c.drawString(80, H - 208, "Healthcare Marketing Director")

    hline(c, 80, H - 238, W - 160, BORDER, 0.5)

    cy = H - 284

    # Email — clickable
    email = "clement.pougetosmont@gmail.com"
    c.setFont("Sans", 18)
    c.setFillColor(WHITE)
    c.drawString(80, cy, email)
    ew = c.stringWidth(email, "Sans", 18)
    c.linkURL("mailto:clement.pougetosmont@gmail.com",
              (80, cy - 4, 80 + ew, cy + 18), relative=0)

    # Phone
    cy -= 44
    c.setFont("Sans", 18)
    c.setFillColor(WHITE)
    c.drawString(80, cy, "+33 6 62 64 39 55")

    # clempo.fr | Connect on LinkedIn — both clickable
    cy -= 44
    c.setFont("SansBold", 18)
    c.setFillColor(YELLOW)
    site = "clempo.fr"
    c.drawString(80, cy, site)
    sw = c.stringWidth(site, "SansBold", 18)
    c.linkURL("https://clempo.fr/", (80, cy - 4, 80 + sw, cy + 18), relative=0)

    sep = " | "
    c.setFont("Sans", 18)
    c.setFillColor(MUTED)
    sepw = c.stringWidth(sep, "Sans", 18)
    c.drawString(80 + sw, cy, sep)

    linkedin = "Connect on LinkedIn"
    c.setFont("SansBold", 18)
    c.setFillColor(YELLOW)
    lx = 80 + sw + sepw
    c.drawString(lx, cy, linkedin)
    lnw = c.stringWidth(linkedin, "SansBold", 18)
    c.linkURL("https://www.linkedin.com/in/cl%C3%A9ment-pougetosmont/",
              (lx, cy - 4, lx + lnw, cy + 18), relative=0)

    hline(c, 80, 68, W - 160, BORDER, 0.5)
    c.setFont("Sans", 10)
    c.setFillColor(MUTED)
    c.drawString(80, 44, "\u00a9 2026 Cl\u00e9ment Pouget-Osmont")
    c.drawRightString(W - 80, 44, "clempo.fr")

    # Deco right circles
    c.setStrokeColor(Color(0.976, 0.976, 0.659, 0.08))
    c.setLineWidth(1.5)
    for r in [80, 140, 200, 260]:
        c.circle(980, 400, r, stroke=1, fill=0)
    c.setFillColor(Color(0.976, 0.976, 0.659, 0.12))
    c.circle(980, 400, 40, stroke=0, fill=1)

    c.showPage()

# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    c = canvas.Canvas(OUTPUT_PATH, pagesize=(W, H))
    c.setTitle("Services Presentation 2026 \u2014 Cl\u00e9ment Pouget-Osmont")
    c.setAuthor("Cl\u00e9ment Pouget-Osmont")
    c.setSubject("Healthcare Marketing Director \u2014 Services")

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
