"""Event-type presets (the terminology/branding registry).

Each preset is the default configuration applied when a NEW tenant of that type
is created via the platform wizard: theme, terminology labels, navigation,
sections, and a few starter config items. Content collections start empty — the
tenant owner fills them in from the admin.

Adding a vertical = adding an entry here. No code changes elsewhere.
"""

from __future__ import annotations

from typing import Any

# A mountain/nature/community image reused as a neutral hero placeholder.
_HERO = {
    "festival": "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=2000&q=80",
    "resort": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=80",
    "museum": "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&w=2000&q=80",
    "conference": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=2000&q=80",
    "institution": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80",
    "experience": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2000&q=80",
}


def _nav(items: list[tuple[str, str]]) -> list[dict[str, str]]:
    return [{"label": label, "href": href} for label, href in items]


_SECTION_IDS = [
    ("hero", "Hero"),
    ("about", "Despre"),
    ("experiences", "Zone și experiențe"),
    ("program", "Program"),
    ("exhibitors", "Directoar"),
    ("products", "Catalog"),
    ("destinations", "Locuri"),
    ("partners", "Parteneri"),
    ("gallery", "Galerie"),
    ("news", "Noutăți"),
    ("newsletter", "Newsletter"),
]


def _sections() -> list[dict[str, Any]]:
    return [{"id": i, "label": lbl, "visible": True} for i, lbl in _SECTION_IDS]


# --- Preset definitions ------------------------------------------------------

PRESETS: dict[str, dict[str, Any]] = {
    "festival": {
        "name": "Festival",
        "description": "Festivaluri, târguri și evenimente cu program, expozanți și produse.",
        "tagline": "Festivalul tău, o experiență completă",
        "hero_badge": "Program • Expozanți • Experiențe",
        "theme": {
            "primary": "#183C32", "secondary": "#F5EFE3", "terracotta": "#B85C3B",
            "gold": "#C99A45", "charcoal": "#202522", "background": "#FCFAF6",
        },
        "navigation": _nav([
            ("Despre", "/despre"), ("Program", "/program"), ("Expozanți", "/expozanti"),
            ("Produse", "/produse"), ("Destinații", "/destinatii"), ("Parteneri", "/parteneri"),
            ("Galerie", "/galerie"), ("Noutăți", "/noutati"), ("Contact", "/contact"),
        ]),
        "labels": {},  # frontend uses festival defaults
    },
    "resort": {
        "name": "Stațiune / destinație turistică",
        "description": "Stațiuni și zone turistice: cazare, experiențe, atracții și evenimente.",
        "tagline": "Locul care te așteaptă",
        "hero_badge": "Cazare • Experiențe • Natură",
        "theme": {
            "primary": "#17414B", "secondary": "#EAF1F1", "terracotta": "#B4623A",
            "gold": "#C9A24B", "charcoal": "#1E2A2C", "background": "#F5F8F7",
        },
        "navigation": _nav([
            ("Despre", "/despre"), ("Cazare", "/expozanti"), ("Experiențe", "/produse"),
            ("Atracții", "/destinatii"), ("Evenimente", "/program"),
            ("Galerie", "/galerie"), ("Noutăți", "/noutati"), ("Contact", "/contact"),
        ]),
        "labels": {
            "heroCtaPrimary": "Planifică vizita", "heroCtaSecondary": "Vezi cazarea",
            "aboutEyebrow": "Despre destinație", "aboutTitle": "Muntele care te așteaptă",
            "experiencesEyebrow": "Experiențe", "experiencesTitle": "Ce poți face aici",
            "exhibitorsEyebrow": "Cazare & gazde", "exhibitorsTitle": "Unde stai",
            "productsEyebrow": "Experiențe", "productsTitle": "Ce poți face",
            "destinationsEyebrow": "Atracții", "destinationsTitle": "Ce vezi în zonă",
            "programEyebrow": "Evenimente", "programTitle": "Ce se întâmplă",
            "exhibitorsPageTitle": "Cazare & gazde", "productsPageTitle": "Experiențe & activități",
            "destinationsPageTitle": "Atracții & obiective", "programPageTitle": "Evenimente",
        },
    },
    "museum": {
        "name": "Muzeu / galerie",
        "description": "Muzee și galerii: colecții, exponate, expoziții și evenimente.",
        "tagline": "Cultura, aproape de tine",
        "hero_badge": "Colecții • Expoziții • Evenimente",
        "theme": {
            "primary": "#3A2E2A", "secondary": "#F1EBE0", "terracotta": "#9C5A3C",
            "gold": "#A9843F", "charcoal": "#26221F", "background": "#F7F3EC",
        },
        "navigation": _nav([
            ("Despre", "/despre"), ("Colecții", "/expozanti"), ("Exponate", "/produse"),
            ("Case & spații", "/destinatii"), ("Expoziții & evenimente", "/program"),
            ("Galerie", "/galerie"), ("Noutăți", "/noutati"), ("Contact", "/contact"),
        ]),
        "labels": {
            "heroCtaPrimary": "Planifică vizita", "heroCtaSecondary": "Vezi expozițiile",
            "aboutEyebrow": "Despre muzeu", "aboutTitle": "Un muzeu viu",
            "experiencesEyebrow": "Ce vei descoperi", "experiencesTitle": "Colecții & experiențe",
            "exhibitorsEyebrow": "Colecții", "exhibitorsTitle": "Colecțiile noastre",
            "productsEyebrow": "Exponate", "productsTitle": "Exponate de neratat",
            "destinationsEyebrow": "Case & spații", "destinationsTitle": "Spațiile muzeului",
            "programEyebrow": "Expoziții & evenimente", "programTitle": "Ce se întâmplă",
            "exhibitorsPageTitle": "Colecții & secții", "productsPageTitle": "Exponate",
            "destinationsPageTitle": "Case & spații", "programPageTitle": "Expoziții & evenimente",
        },
    },
    "conference": {
        "name": "Conferință",
        "description": "Conferințe și evenimente business: vorbitori, agendă, sponsori.",
        "tagline": "Conferința ta, online și offline",
        "hero_badge": "Vorbitori • Agendă • Networking",
        "theme": {
            "primary": "#1E2A44", "secondary": "#EAEEF5", "terracotta": "#C2603F",
            "gold": "#C2A24B", "charcoal": "#1A1F2B", "background": "#F6F8FC",
        },
        "navigation": _nav([
            ("Despre", "/despre"), ("Agendă", "/program"), ("Vorbitori", "/expozanti"),
            ("Sesiuni", "/produse"), ("Săli", "/destinatii"), ("Sponsori", "/parteneri"),
            ("Galerie", "/galerie"), ("Noutăți", "/noutati"), ("Contact", "/contact"),
        ]),
        "labels": {
            "heroCtaPrimary": "Înscrie-te", "heroCtaSecondary": "Vezi agenda",
            "aboutEyebrow": "Despre eveniment", "aboutTitle": "O zi despre viitor",
            "experiencesEyebrow": "De ce să participi", "experiencesTitle": "Ce te așteaptă",
            "exhibitorsEyebrow": "Vorbitori", "exhibitorsTitle": "Cine urcă pe scenă",
            "productsEyebrow": "Sesiuni", "productsTitle": "Sesiuni & workshopuri",
            "destinationsEyebrow": "Săli", "destinationsTitle": "Locația & sălile",
            "programEyebrow": "Agendă", "programTitle": "Programul zilei",
            "exhibitorsPageTitle": "Vorbitori", "productsPageTitle": "Sesiuni & workshopuri",
            "destinationsPageTitle": "Săli & locație", "programPageTitle": "Agenda completă",
        },
    },
    "institution": {
        "name": "Instituție / administrație",
        "description": "Instituții publice și administrații: servicii, departamente, anunțuri.",
        "tagline": "Administrație digitală, aproape de oameni",
        "hero_badge": "Servicii • Anunțuri • Transparență",
        "theme": {
            "primary": "#26364A", "secondary": "#EDF1F5", "terracotta": "#8C5A3E",
            "gold": "#A98A45", "charcoal": "#1C2530", "background": "#F6F8FB",
        },
        "navigation": _nav([
            ("Despre", "/despre"), ("Servicii", "/produse"), ("Departamente", "/expozanti"),
            ("Sedii", "/destinatii"), ("Anunțuri", "/program"),
            ("Galerie", "/galerie"), ("Noutăți", "/noutati"), ("Contact", "/contact"),
        ]),
        "labels": {
            "heroCtaPrimary": "Vezi serviciile", "heroCtaSecondary": "Contactează-ne",
            "aboutEyebrow": "Despre instituție", "aboutTitle": "În slujba comunității",
            "experiencesEyebrow": "Ce oferim", "experiencesTitle": "Servicii pentru cetățeni",
            "exhibitorsEyebrow": "Departamente", "exhibitorsTitle": "Departamentele noastre",
            "productsEyebrow": "Servicii", "productsTitle": "Servicii publice",
            "destinationsEyebrow": "Sedii", "destinationsTitle": "Unde ne găsești",
            "programEyebrow": "Anunțuri & evenimente", "programTitle": "Anunțuri publice",
            "exhibitorsPageTitle": "Departamente", "productsPageTitle": "Servicii publice",
            "destinationsPageTitle": "Sedii & birouri", "programPageTitle": "Anunțuri & evenimente",
        },
    },
    "experience": {
        "name": "Experiență / atracție",
        "description": "Parcuri, trasee și atracții: activități, obiective, bilete.",
        "tagline": "Descoperă, explorează, trăiește",
        "hero_badge": "Activități • Trasee • Atracții",
        "theme": {
            "primary": "#3E5B2A", "secondary": "#EEF2E4", "terracotta": "#B4623A",
            "gold": "#C89A3E", "charcoal": "#232A1A", "background": "#F6F9EF",
        },
        "navigation": _nav([
            ("Despre", "/despre"), ("Activități", "/produse"), ("Operatori", "/expozanti"),
            ("Atracții & trasee", "/destinatii"), ("Evenimente", "/program"),
            ("Galerie", "/galerie"), ("Noutăți", "/noutati"), ("Contact", "/contact"),
        ]),
        "labels": {
            "heroCtaPrimary": "Planifică vizita", "heroCtaSecondary": "Vezi activitățile",
            "aboutEyebrow": "Despre", "aboutTitle": "Aventura începe aici",
            "experiencesEyebrow": "Ce poți face", "experiencesTitle": "Experiențe de neuitat",
            "exhibitorsEyebrow": "Operatori", "exhibitorsTitle": "Operatorii noștri",
            "productsEyebrow": "Activități", "productsTitle": "Activități & experiențe",
            "destinationsEyebrow": "Atracții", "destinationsTitle": "Atracții & trasee",
            "programEyebrow": "Evenimente", "programTitle": "Ce se întâmplă",
            "exhibitorsPageTitle": "Operatori", "productsPageTitle": "Activități & experiențe",
            "destinationsPageTitle": "Atracții & trasee", "programPageTitle": "Evenimente",
        },
    },
}


def list_presets() -> list[dict[str, Any]]:
    """Public summary for the wizard (no heavy nesting)."""
    return [
        {
            "key": key,
            "name": p["name"],
            "description": p["description"],
            "theme": p["theme"],
        }
        for key, p in PRESETS.items()
    ]


def build_tenant_fields(preset_key: str, name: str, slug: str) -> dict[str, Any]:
    """Return kwargs for a new Tenant from a preset (empty content collections)."""
    p = PRESETS.get(preset_key) or PRESETS["festival"]
    theme = p["theme"]
    return {
        "id": slug,
        "slug": slug,
        "event_type": preset_key if preset_key in PRESETS else "festival",
        "labels": p["labels"],
        "name": name,
        "tagline": p["tagline"],
        "short_description": p["description"],
        "long_description": "",
        "start_date": None,
        "end_date": None,
        "location_name": "",
        "city": "",
        "county": "",
        "hero_image": _HERO.get(preset_key, _HERO["festival"]),
        "hero_badge": p["hero_badge"],
        "logo_text": name,
        "theme_primary": theme["primary"],
        "theme_secondary": theme["secondary"],
        "theme_terracotta": theme["terracotta"],
        "theme_gold": theme["gold"],
        "theme_charcoal": theme["charcoal"],
        "theme_background": theme["background"],
        "social_facebook": "",
        "social_instagram": "",
        "social_youtube": "",
        "social_website": "",
        "contact_email": "",
        "contact_phone": "",
        "contact_address": "",
        "contact_city": "",
        "contact_county": "",
        "contact_map_query": "",
        "navigation": p["navigation"],
        "sections": _sections(),
        "stats": [],
        "experiences": [],
    }
