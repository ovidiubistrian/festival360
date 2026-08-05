"""Seed data for the second demo tenant: the tourist resort Poiana Mărului.

This runs ALONGSIDE the PRISPA festival seed (see `seed.py`) to prove the
"one engine, many verticals" idea: the same data model, driven by a different
`event_type` ("resort") and per-tenant `labels`, renders as a mountain resort
instead of a festival.

The data is built inline (rather than from a JSON file) so the resort copy and
image mapping live in one readable place.
"""

from __future__ import annotations

import datetime as dt
from typing import Any

from sqlmodel import Session, select

from app.models import (
    Article,
    ContactMessage,
    Destination,
    Exhibitor,
    GalleryImage,
    MediaAsset,
    NewsletterSubscriber,
    Partner,
    ProgramEvent,
    Product,
    Tenant,
)

TENANT_ID = "poiana-marului"


def _u(photo_id: str, w: int = 1200) -> str:
    """Build an Unsplash URL in the same format the frontend image pool uses."""
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w={w}&q=80"


# --- Reused, known-good mountain/nature photo IDs (from web/.../prispa/images.ts) ---
MOUNTAIN_LAKE = _u("1506905925346-21bda4d32df4", 1600)
MOUNTAIN_LAKE_HERO = _u("1506905925346-21bda4d32df4", 2000)
MOUNTAINS = _u("1464822759023-fed622ff2c3b", 1600)
FOREST = _u("1441974231531-c6227db76b6e", 1600)
VALLEY = _u("1454391304352-2bf4678b1a7a", 1600)
PEAKS = _u("1519681393784-d120267933ba", 1600)
VILLAGE = _u("1500534623283-312aade485b7", 1600)
MEADOW = _u("1470252649378-9c29740c9fa8", 1600)
RIVER = _u("1439066615861-d1af74d74000", 1600)
AUTUMN = _u("1508615039623-a25605d2b022", 1600)
CONCERT = _u("1533174072545-7a4b6ad7a6c3", 1400)
FOLK = _u("1533928298208-27ff66555d8d", 1400)
CHILDREN = _u("1541692641319-981cc79ee10a", 1400)
WORKSHOP = _u("1452860606245-08befc0ff44b", 1400)
CHEESE = _u("1486297678162-eb2a19b0a32d")
HONEY = _u("1587049352846-4a222e784d38")
DISH = _u("1414235077428-338989a2e8c0")
FOOD_SPREAD = _u("1504674900247-0877df9cc836")
MARKET = _u("1488459716781-31db52582fe9")


def _parse_dates(row: dict[str, Any], keys: list[str]) -> dict[str, Any]:
    """Convert ISO date strings to date objects for the given keys."""
    out = dict(row)
    for k in keys:
        v = out.get(k)
        if isinstance(v, str) and v:
            out[k] = dt.date.fromisoformat(v)
    return out


# ---------------------------------------------------------------------------
# Tenant config
# ---------------------------------------------------------------------------

TENANT: dict[str, Any] = {
    "id": TENANT_ID,
    "slug": "poiana-marului",
    "event_type": "resort",
    "name": "Poiana Mărului",
    "tagline": "Muntele care te așteaptă",
    "short_description": (
        "Stațiune de munte la poalele Munților Țarcu, cu un lac de smarald, "
        "trasee de drumeție, pârtii de schi, pescuit și ospitalitate autentică."
    ),
    "long_description": (
        "Poiana Mărului este poarta de intrare în Munții Țarcu, o stațiune "
        "risipită pe văi la 1.200 de metri altitudine, cu case de lemn, stâne "
        "cu tradiție și un lac de acumulare de un verde-smarald. Iarna, "
        "pârtiile de la Muntele Mic cheamă schiorii; vara, potecile urcă spre "
        "creste alpine, iar lacul devine loc de pescuit și plimbări cu barca. "
        "Aici muntele se trăiește în toate cele patru anotimpuri, iar gazdele "
        "te primesc cu bucate de munte și povești la foc de tabără."
    ),
    "start_date": None,
    "end_date": None,
    "location_name": "Poiana Mărului",
    "city": "Poiana Mărului",
    "county": "Caraș-Severin",
    "hero_image": MOUNTAIN_LAKE_HERO,
    "hero_badge": "Munte • Lac • Ospitalitate",
    "logo_text": "Poiana Mărului",
    # Theme — cooler mountain palette, distinct from the festival's warm one.
    "theme_primary": "#17414B",
    "theme_secondary": "#EAF1F1",
    "theme_terracotta": "#B4623A",
    "theme_gold": "#C9A24B",
    "theme_charcoal": "#1E2A2C",
    "theme_background": "#F5F8F7",
    "social_facebook": "https://facebook.com/poianamarului",
    "social_instagram": "https://instagram.com/poianamarului",
    "social_youtube": "https://youtube.com/@poianamarului",
    "social_website": "https://poianamarului.ro",
    "contact_email": "rezervari@poianamarului.ro",
    "contact_phone": "+40 255 000 200",
    "contact_address": "Strada Principală nr. 12",
    "contact_city": "Poiana Mărului",
    "contact_county": "Caraș-Severin",
    "contact_map_query": "Poiana Mărului, Caraș-Severin",
    "navigation": [
        {"label": "Despre", "href": "/despre"},
        {"label": "Cazare", "href": "/expozanti"},
        {"label": "Experiențe", "href": "/produse"},
        {"label": "Atracții", "href": "/destinatii"},
        {"label": "Evenimente", "href": "/program"},
        {"label": "Galerie", "href": "/galerie"},
        {"label": "Noutăți", "href": "/noutati"},
        {"label": "Contact", "href": "/contact"},
    ],
    "sections": [
        {"id": "hero", "label": "Hero", "visible": True},
        {"id": "about", "label": "Despre stațiune", "visible": True},
        {"id": "experiences", "label": "Experiențe de munte", "visible": True},
        {"id": "program", "label": "Evenimente", "visible": True},
        {"id": "exhibitors", "label": "Cazare & gazde", "visible": True},
        {"id": "products", "label": "Experiențe & activități", "visible": True},
        {"id": "destinations", "label": "Atracții", "visible": True},
        {"id": "partners", "label": "Parteneri", "visible": True},
        {"id": "gallery", "label": "Galerie", "visible": True},
        {"id": "news", "label": "Noutăți", "visible": True},
        {"id": "newsletter", "label": "Newsletter", "visible": True},
    ],
    "stats": [
        {"label": "Altitudine", "value": "1.200 m", "icon": "Mountain"},
        {"label": "Trasee", "value": "40 km", "icon": "MapPin"},
        {"label": "Anotimpuri", "value": "4", "icon": "CalendarDays"},
        {"label": "Lac de smarald", "value": "1", "icon": "UtensilsCrossed"},
    ],
    "experiences": [
        {
            "id": "schi",
            "title": "Schi & sporturi de iarnă",
            "description": "Pârtii la Muntele Mic, sănii și plimbări cu snowmobilul, pentru zile albe de iarnă.",
            "icon": "Mountain",
            "image": PEAKS,
        },
        {
            "id": "drumetii",
            "title": "Drumeții & trasee",
            "description": "Peste 40 km de poteci spre crestele Țarcului, printre păduri seculare și pajiști alpine.",
            "icon": "Mountain",
            "image": FOREST,
        },
        {
            "id": "pescuit",
            "title": "Pescuit la lac",
            "description": "Păstrăv și zile de liniște pe malul lacului de smarald, cu barca și undița pregătite.",
            "icon": "ShoppingBasket",
            "image": RIVER,
        },
        {
            "id": "gastronomie",
            "title": "Gastronomie de munte",
            "description": "Bucate de stână, păstrăv la grătar și preparate gătite la ceaun, în inima Banatului Montan.",
            "icon": "UtensilsCrossed",
            "image": DISH,
        },
        {
            "id": "relaxare",
            "title": "Relaxare & natură",
            "description": "Aer curat, plimbări pe malul apei și seri la foc de tabără, departe de agitația orașului.",
            "icon": "Music",
            "image": MEADOW,
        },
        {
            "id": "copii",
            "title": "Aventură pentru copii",
            "description": "Călărie, ateliere în natură și trasee ușoare, gândite pentru cei mici și familiile lor.",
            "icon": "Baby",
            "image": CHILDREN,
        },
    ],
    "labels": {
        "heroCtaPrimary": "Planifică vizita",
        "heroCtaSecondary": "Vezi cazarea",
        "aboutEyebrow": "Despre stațiune",
        "aboutTitle": "Muntele care te așteaptă în toate anotimpurile",
        "experiencesEyebrow": "Experiențe de munte",
        "experiencesTitle": "Ce poți trăi la Poiana Mărului",
        "experiencesDescription": "De la schi și drumeții la pescuit și seri la foc — muntele are ceva pentru fiecare anotimp.",
        "programEyebrow": "Evenimente",
        "programTitle": "Evenimente în stațiune",
        "programDescription": "Deschideri de sezon, concursuri și sărbători de munte, pe tot parcursul anului.",
        "exhibitorsEyebrow": "Cazare & gazde",
        "exhibitorsTitle": "Unde stai",
        "exhibitorsDescription": "Cabane, pensiuni și hoteluri de munte, cu ospitalitate autentică la poalele Țarcului.",
        "productsEyebrow": "Experiențe",
        "productsTitle": "Ce poți face",
        "productsDescription": "Activități și experiențe ghidate, pentru toate vârstele și toate anotimpurile.",
        "destinationsEyebrow": "Atracții",
        "destinationsTitle": "Ce vezi în zonă",
        "destinationsDescription": "Lacul de smarald, crestele Țarcului, domeniul schiabil și rezervația de zimbri.",
        "partnersEyebrow": "Parteneri",
        "partnersTitle": "Parteneri și colaboratori",
        "partnersDescription": "Instituții și operatori locali care fac stațiunea posibilă.",
        "galleryEyebrow": "Galerie",
        "galleryTitle": "Poiana Mărului în imagini",
        "galleryDescription": "Muntele, lacul și viața stațiunii, surprinse în fiecare anotimp.",
        "newsEyebrow": "Noutăți",
        "newsTitle": "Povești de la munte",
        "newsDescription": "Ghiduri, povești și noutăți despre stațiune și împrejurimile ei.",
        "exhibitorsPageTitle": "Cazare & gazde",
        "exhibitorsPageDescription": "Cabane, pensiuni și hoteluri de munte din Poiana Mărului și împrejurimi.",
        "productsPageTitle": "Experiențe & activități",
        "productsPageDescription": "Tot ce poți face la Poiana Mărului, în toate cele patru anotimpuri.",
        "destinationsPageTitle": "Atracții & obiective",
        "destinationsPageDescription": "Obiectivele de neratat din jurul stațiunii Poiana Mărului.",
        "programPageTitle": "Evenimente",
        "programPageDescription": "Calendarul evenimentelor din stațiune, sezon de sezon.",
    },
}


# ---------------------------------------------------------------------------
# Content — festival entities mapped to resort meaning
# ---------------------------------------------------------------------------

# Exhibitors -> Cazare (accommodation)
EXHIBITORS: list[dict[str, Any]] = [
    {
        "id": "pm-ex-1",
        "tenant_id": TENANT_ID,
        "slug": "cabana-lacul-verde",
        "name": "Cabana Lacul Verde",
        "category": "Cabană",
        "town": "Poiana Mărului",
        "county": "Caraș-Severin",
        "region": "Banatul Montan",
        "short_description": "Cabană chiar pe malul lacului de smarald, cu terasă spre apă și foc de tabără.",
        "description": (
            "Cabana Lacul Verde stă chiar pe malul lacului de acumulare, la câțiva pași "
            "de apă. Camerele de lemn au vedere spre munte, iar terasa este locul perfect "
            "pentru o cafea în zori sau o cină la apus. Gazdele organizează ieșiri cu barca, "
            "partide de pescuit și seri la foc de tabără, cu povești despre munte."
        ),
        "image": VILLAGE,
        "gallery": [VILLAGE, MOUNTAIN_LAKE, MEADOW],
        "certified": True,
        "featured": True,
        "product_ids": [],
        "contact_phone": "+40 745 210 111",
        "contact_website": "https://cabanalaculverde.ro",
        "status": "published",
        "sort_order": 0,
    },
    {
        "id": "pm-ex-2",
        "tenant_id": TENANT_ID,
        "slug": "pensiunea-la-prispa",
        "name": "Pensiunea La Prispă",
        "category": "Pensiune",
        "town": "Poiana Mărului",
        "county": "Caraș-Severin",
        "region": "Banatul Montan",
        "short_description": "Pensiune cu prispă și bucătărie de munte, la poalele Munților Țarcu.",
        "description": (
            "Pensiunea La Prispă oferă mai mult decât cazare: cine cu produse din curte, "
            "drumeții ghidate spre lac și seri la foc cu povești despre munte. Prispa lungă "
            "de lemn privește spre creste, iar micul dejun se servește cu brânză de stână și "
            "miere de munte."
        ),
        "image": VALLEY,
        "gallery": [VALLEY, VILLAGE, DISH],
        "certified": True,
        "featured": True,
        "product_ids": [],
        "contact_phone": "+40 749 999 000",
        "contact_website": "https://pensiunealaprispa.ro",
        "status": "published",
        "sort_order": 1,
    },
    {
        "id": "pm-ex-3",
        "tenant_id": TENANT_ID,
        "slug": "hotel-tarcu",
        "name": "Hotel Țarcu",
        "category": "Hotel",
        "town": "Poiana Mărului",
        "county": "Caraș-Severin",
        "region": "Banatul Montan",
        "short_description": "Hotel de munte cu spa, restaurant panoramic și acces facil spre pârtii.",
        "description": (
            "Hotel Țarcu este cea mai mare unitate din stațiune, cu camere spațioase, un "
            "restaurant panoramic și o zonă de spa cu saună și piscină interioară. Iarna, "
            "oaspeții pleacă direct spre pârtiile de la Muntele Mic; vara, hotelul organizează "
            "drumeții ghidate și tururi cu bicicleta."
        ),
        "image": MOUNTAINS,
        "gallery": [MOUNTAINS, PEAKS, VALLEY],
        "certified": True,
        "featured": True,
        "product_ids": [],
        "contact_phone": "+40 255 300 400",
        "contact_website": "https://hoteltarcu.ro",
        "status": "published",
        "sort_order": 2,
    },
    {
        "id": "pm-ex-4",
        "tenant_id": TENANT_ID,
        "slug": "casa-din-poiana",
        "name": "Casa din Poiană",
        "category": "Casă de vacanță",
        "town": "Poiana Mărului",
        "county": "Caraș-Severin",
        "region": "Banatul Montan",
        "short_description": "Casă de vacanță de închiriat integral, pentru familii și grupuri.",
        "description": (
            "Casa din Poiană se închiriază integral, ideală pentru familii sau grupuri de "
            "prieteni. Are bucătărie complet utilată, șemineu, curte largă și grătar. De la "
            "poartă pornesc poteci spre pădure și spre lac, iar liniștea este garantată."
        ),
        "image": MEADOW,
        "gallery": [MEADOW, FOREST, VILLAGE],
        "certified": False,
        "featured": False,
        "product_ids": [],
        "contact_phone": "+40 746 512 313",
        "contact_website": "",
        "status": "published",
        "sort_order": 3,
    },
    {
        "id": "pm-ex-5",
        "tenant_id": TENANT_ID,
        "slug": "cabana-vanatorilor",
        "name": "Cabana Vânătorilor",
        "category": "Cabană",
        "town": "Muntele Mic",
        "county": "Caraș-Severin",
        "region": "Banatul Montan",
        "short_description": "Cabană rustică sus, lângă pârtii, cu cină la ceaun și priveliște spre Retezat.",
        "description": (
            "Cabana Vânătorilor stă sus, aproape de pârtiile Muntelui Mic, cu o priveliște "
            "care se deschide spre Retezat și Țarcu. Atmosfera este rustică, cu bârne de lemn "
            "și un foc care arde mereu în sezonul rece. Cina se gătește la ceaun, iar diminețile "
            "încep cu aer tare de munte."
        ),
        "image": PEAKS,
        "gallery": [PEAKS, MOUNTAINS, FOREST],
        "certified": False,
        "featured": False,
        "product_ids": [],
        "contact_phone": "+40 747 818 202",
        "contact_website": "",
        "status": "published",
        "sort_order": 4,
    },
    {
        "id": "pm-ex-6",
        "tenant_id": TENANT_ID,
        "slug": "pensiunea-izvorul-rece",
        "name": "Pensiunea Izvorul Rece",
        "category": "Pensiune",
        "town": "Poiana Mărului",
        "county": "Caraș-Severin",
        "region": "Banatul Montan",
        "short_description": "Pensiune liniștită lângă un izvor de munte, cu grădină și produse de casă.",
        "description": (
            "Numele vine de la izvorul rece care curge chiar la marginea grădinii. Pensiunea "
            "Izvorul Rece este o gospodărie primitoare, cu camere curate, o grădină plină de "
            "flori și o masă încărcată cu produse de casă: dulcețuri, brânză și pâine coaptă în "
            "cuptor pe vatră."
        ),
        "image": RIVER,
        "gallery": [RIVER, VALLEY, MEADOW],
        "certified": True,
        "featured": False,
        "product_ids": [],
        "contact_phone": "+40 748 404 505",
        "contact_website": "https://izvorulrece.ro",
        "status": "published",
        "sort_order": 5,
    },
    {
        "id": "pm-ex-7",
        "tenant_id": TENANT_ID,
        "slug": "chalet-muntele-mic",
        "name": "Chalet Muntele Mic",
        "category": "Cabană",
        "town": "Muntele Mic",
        "county": "Caraș-Severin",
        "region": "Banatul Montan",
        "short_description": "Chalet modern ski-in / ski-out, cu jacuzzi și vedere la pârtie.",
        "description": (
            "Chalet Muntele Mic este un refugiu modern de lemn și sticlă, chiar la marginea "
            "pârtiei. Are jacuzzi exterior cu vedere la munte, ferestre uriașe și o zonă de zi "
            "cu șemineu. Iarna te dai pe schi direct de la ușă; vara, terasa devine loc de "
            "răsărituri și apusuri lungi."
        ),
        "image": MOUNTAINS,
        "gallery": [MOUNTAINS, PEAKS, AUTUMN],
        "certified": False,
        "featured": True,
        "product_ids": [],
        "contact_phone": "+40 749 111 717",
        "contact_website": "https://chaletmuntelemic.ro",
        "status": "published",
        "sort_order": 6,
    },
]

# Products -> Experiențe (activities)
PRODUCTS: list[dict[str, Any]] = [
    {
        "id": "pm-pr-1",
        "tenant_id": TENANT_ID,
        "slug": "schi-la-muntele-mic",
        "name": "Schi la Muntele Mic",
        "producer": "Domeniul Schiabil Muntele Mic",
        "exhibitor_id": None,
        "region": "Banatul Montan",
        "category": "Iarnă",
        "short_description": "Acces la pârtii, telescaun și zăpadă bună de decembrie până în aprilie.",
        "story": (
            "Muntele Mic este prima stațiune de schi din Banat, cu pârtii pentru toate nivelurile "
            "și un sezon lung, grație altitudinii. Poți închiria echipament pe loc, poți lua o "
            "lecție cu instructor sau pur și simplu te poți bucura de zăpada de munte și de "
            "priveliștea spre Retezat."
        ),
        "image": PEAKS,
        "gallery": [PEAKS, MOUNTAINS],
        "price": "de la 120 lei / zi",
        "featured": True,
        "status": "published",
        "sort_order": 0,
    },
    {
        "id": "pm-pr-2",
        "tenant_id": TENANT_ID,
        "slug": "drumetie-varful-tarcu",
        "name": "Drumeție pe Vârful Țarcu",
        "producer": "Ghizii Munților Țarcu",
        "exhibitor_id": None,
        "region": "Banatul Montan",
        "category": "Drumeții",
        "short_description": "Traseu ghidat de o zi până pe Vârful Țarcu (2.190 m), cu panorame nesfârșite.",
        "story": (
            "O drumeție de o zi întreagă urcă din stațiune spre creasta Munților Țarcu, pe "
            "poteci printre păduri și pajiști alpine, până pe vârful de 2.190 de metri. Ghizii "
            "locali cunosc fiecare potecă și fiecare poveste a muntelui, iar de sus priveliștea "
            "se deschide spre Retezat și spre valea Bistrei."
        ),
        "image": MOUNTAINS,
        "gallery": [MOUNTAINS, FOREST],
        "price": "de la 90 lei / persoană",
        "featured": True,
        "status": "published",
        "sort_order": 1,
    },
    {
        "id": "pm-pr-3",
        "tenant_id": TENANT_ID,
        "slug": "pescuit-lacul-poiana-marului",
        "name": "Pescuit la Lacul Poiana Mărului",
        "producer": "Asociația Pescarilor Bistra",
        "exhibitor_id": None,
        "region": "Banatul Montan",
        "category": "Apă",
        "short_description": "O zi de pescuit la păstrăv pe lacul de smarald, cu permis și echipament incluse.",
        "story": (
            "Lacul de acumulare de la Poiana Mărului, de un verde-smarald, este un loc răbdător "
            "și liniștit, perfect pentru o zi de pescuit la păstrăv. Pachetul include permisul, "
            "echipamentul de bază și sfaturile localnicilor despre unde mușcă peștele la ora "
            "răsăritului."
        ),
        "image": RIVER,
        "gallery": [RIVER, MOUNTAIN_LAKE],
        "price": "de la 80 lei / zi",
        "featured": True,
        "status": "published",
        "sort_order": 2,
    },
    {
        "id": "pm-pr-4",
        "tenant_id": TENANT_ID,
        "slug": "tur-cu-barca-pe-lac",
        "name": "Tur cu barca pe lac",
        "producer": "Cabana Lacul Verde",
        "exhibitor_id": None,
        "region": "Banatul Montan",
        "category": "Apă",
        "short_description": "Plimbare cu barca pe lacul de smarald, la răsărit sau la apus.",
        "story": (
            "O plimbare lină cu barca pe apele liniștite ale lacului, cu munții oglindiți în "
            "apă. Turul poate fi ales la răsărit, când lacul fumegă ușor, sau la apus, când "
            "culorile se aprind pe creste. Ideal pentru fotografii și clipe de liniște."
        ),
        "image": MOUNTAIN_LAKE,
        "gallery": [MOUNTAIN_LAKE, VALLEY],
        "price": "de la 60 lei / persoană",
        "featured": False,
        "status": "published",
        "sort_order": 3,
    },
    {
        "id": "pm-pr-5",
        "tenant_id": TENANT_ID,
        "slug": "calarie-pe-poteci-de-munte",
        "name": "Călărie pe poteci de munte",
        "producer": "Herghelia din Poiană",
        "exhibitor_id": None,
        "region": "Banatul Montan",
        "category": "Familie",
        "short_description": "Ture călare pe poteci de pădure, pentru începători și avansați.",
        "story": (
            "Caii de munte cunosc potecile mai bine decât oricine. Turele pornesc din stațiune "
            "și urcă lin prin pădure, cu opriri la belvederi spre lac. Există trasee scurte "
            "pentru începători și copii, dar și ture mai lungi pentru cei obișnuiți cu șaua."
        ),
        "image": MEADOW,
        "gallery": [MEADOW, FOREST],
        "price": "de la 100 lei / oră",
        "featured": False,
        "status": "published",
        "sort_order": 4,
    },
    {
        "id": "pm-pr-6",
        "tenant_id": TENANT_ID,
        "slug": "seara-la-foc-de-tabara",
        "name": "Seară la foc de tabără",
        "producer": "Pensiunea La Prispă",
        "exhibitor_id": None,
        "region": "Banatul Montan",
        "category": "Familie",
        "short_description": "Foc de tabără, povești de munte și bucate la ceaun, sub cerul plin de stele.",
        "story": (
            "Când se lasă seara, focul se aprinde în poiană și oaspeții se strâng în jurul lui. "
            "Se gătește la ceaun, se cântă și se spun povești despre munte și ciobani. Departe de "
            "luminile orașului, cerul se umple de stele, iar noaptea de munte devine de neuitat."
        ),
        "image": AUTUMN,
        "gallery": [AUTUMN, FOREST],
        "price": "de la 70 lei / persoană",
        "featured": True,
        "status": "published",
        "sort_order": 5,
    },
    {
        "id": "pm-pr-7",
        "tenant_id": TENANT_ID,
        "slug": "vizita-la-stana",
        "name": "Vizită la stână",
        "producer": "Stâna din Țarcu",
        "exhibitor_id": None,
        "region": "Banatul Montan",
        "category": "Familie",
        "short_description": "O zi la stână, cu demonstrație de preparare a brânzei și degustare.",
        "story": (
            "Sus, pe pajiștile Țarcului, stâna funcționează ca acum o sută de ani. Vizitatorii "
            "văd cum se mulge, cum se leagă cașul și cum se afumă cașcavalul, apoi degustă "
            "brânză proaspătă cu mămăligă caldă. O experiență autentică pentru toată familia."
        ),
        "image": DISH,
        "gallery": [DISH, CHEESE],
        "price": "de la 50 lei / persoană",
        "featured": False,
        "status": "published",
        "sort_order": 6,
    },
    {
        "id": "pm-pr-8",
        "tenant_id": TENANT_ID,
        "slug": "inchiriere-echipament",
        "name": "Închiriere echipament",
        "producer": "Centrul de Închirieri Poiana",
        "exhibitor_id": None,
        "region": "Banatul Montan",
        "category": "Iarnă",
        "short_description": "Schiuri, plăci, clăpari și echipament de drumeție, pentru toate sezoanele.",
        "story": (
            "Nu trebuie să vii cu tot bagajul: centrul din stațiune închiriază schiuri, "
            "snowboard, clăpari și bețe iarna, iar vara bocanci, bețe de trekking și biciclete. "
            "Echipamentul este verificat și potrivit pe măsură, cu sfaturi de la localnici "
            "despre traseele potrivite."
        ),
        "image": MOUNTAINS,
        "gallery": [MOUNTAINS, PEAKS],
        "price": "de la 40 lei / zi",
        "featured": False,
        "status": "published",
        "sort_order": 7,
    },
]

# Destinations -> Atracții (attractions)
DESTINATIONS: list[dict[str, Any]] = [
    {
        "id": "pm-de-1",
        "tenant_id": TENANT_ID,
        "slug": "lacul-poiana-marului",
        "name": "Lacul Poiana Mărului",
        "region": "Banatul Montan",
        "county": "Caraș-Severin",
        "short_description": "Lacul de smarald din inima stațiunii, loc de pescuit, plimbări și liniște.",
        "description": (
            "Lacul de acumulare de la Poiana Mărului este vedeta stațiunii: un luciu de apă de "
            "un verde-smarald, înconjurat de păduri și de creste. Aici se pescuiește păstrăv, se "
            "plimbă cu barca și se stă pe mal la răsărit și la apus. Malurile line invită la "
            "plimbări lungi, iar apa oglindește munții în zilele senine. Este locul în jurul "
            "căruia s-a construit întreaga stațiune și punctul de plecare pentru majoritatea "
            "experiențelor."
        ),
        "cover_image": MOUNTAIN_LAKE,
        "gallery": [MOUNTAIN_LAKE, VALLEY, RIVER],
        "attractions": ["Malul de sud", "Barajul", "Golful cu păstrăv"],
        "experiences": ["Pescuit sportiv", "Tur cu barca", "Plimbări pe mal"],
        "gastronomy": ["Păstrăv la grătar", "Brânză de stână", "Ceai de plante"],
        "external_link": None,
        "featured": True,
        "editorial": True,
        "status": "published",
        "sort_order": 0,
    },
    {
        "id": "pm-de-2",
        "tenant_id": TENANT_ID,
        "slug": "varful-tarcu",
        "name": "Vârful Țarcu",
        "region": "Banatul Montan",
        "county": "Caraș-Severin",
        "short_description": "Vârf alpin de 2.190 m, cu panorame spre Retezat și pajiști de creastă.",
        "description": (
            "Vârful Țarcu, la 2.190 de metri, este cel mai înalt punct al masivului și o "
            "destinație de drumeție de o zi din stațiune. Traseul urcă prin păduri și pajiști "
            "alpine, iar de sus priveliștea se deschide spre Retezat, Godeanu și valea Bistrei. "
            "Este un ținut de liniște deplină și aer tare de munte."
        ),
        "cover_image": MOUNTAINS,
        "gallery": [MOUNTAINS, PEAKS, FOREST],
        "attractions": ["Vârful Țarcu", "Pajiștile de creastă", "Belvederea spre Retezat"],
        "experiences": ["Trekking de creastă", "Fotografie de natură", "Observarea florei alpine"],
        "gastronomy": ["Pastramă de oaie", "Brânză de burduf", "Afine de pădure"],
        "external_link": None,
        "featured": True,
        "editorial": False,
        "status": "published",
        "sort_order": 1,
    },
    {
        "id": "pm-de-3",
        "tenant_id": TENANT_ID,
        "slug": "domeniul-schiabil-muntele-mic",
        "name": "Domeniul schiabil Muntele Mic",
        "region": "Banatul Montan",
        "county": "Caraș-Severin",
        "short_description": "Prima stațiune de schi din Banat, cu pârtii pentru toate nivelurile.",
        "description": (
            "Muntele Mic este domeniul schiabil al stațiunii: pârtii pentru începători și "
            "avansați, telescaun și un sezon lung datorită altitudinii. Iarna atrage schiorii "
            "din tot Banatul, iar vara pajiștile alpine devin loc de drumeție și belvedere spre "
            "Retezat și Țarcu."
        ),
        "cover_image": PEAKS,
        "gallery": [PEAKS, MOUNTAINS, MEADOW],
        "attractions": ["Pârtiile principale", "Telescaunul", "Panorama spre Retezat"],
        "experiences": ["Schi și snowboard", "Sănii", "Drumeții de vară"],
        "gastronomy": ["Bulz la ceaun", "Vin fiert", "Miere de munte"],
        "external_link": None,
        "featured": True,
        "editorial": False,
        "status": "published",
        "sort_order": 2,
    },
    {
        "id": "pm-de-4",
        "tenant_id": TENANT_ID,
        "slug": "rezervatia-de-zimbri-armenis",
        "name": "Rezervația de zimbri Armeniș",
        "region": "Banatul Montan",
        "county": "Caraș-Severin",
        "short_description": "Locul unde zimbrii au fost readuși în libertate, la poalele Țarcului.",
        "description": (
            "La Armeniș, zimbrul european a fost reintrodus în sălbăticie după sute de ani de "
            "absență. Rezervația organizează ture de observare ghidate, în care vizitatorii pot "
            "vedea turmele păscând pe versanții împăduriți. Este un model de turism responsabil "
            "și una dintre cele mai emoționante experiențe din zonă."
        ),
        "cover_image": FOREST,
        "gallery": [FOREST, MEADOW, RIVER],
        "attractions": ["Zona de observare", "Centrul de vizitare", "Valea Timișului"],
        "experiences": ["Safari de zimbri", "Drumeții tematice", "Fotografie de faună"],
        "gastronomy": ["Bucătărie de gospodărie", "Afumături de casă", "Pâine pe vatră"],
        "external_link": None,
        "featured": False,
        "editorial": False,
        "status": "published",
        "sort_order": 3,
    },
    {
        "id": "pm-de-5",
        "tenant_id": TENANT_ID,
        "slug": "cascada-de-sub-tarcu",
        "name": "Cascada de sub Țarcu",
        "region": "Banatul Montan",
        "county": "Caraș-Severin",
        "short_description": "Cascadă ascunsă în pădure, la capătul unui traseu scurt de drumeție.",
        "description": (
            "Ascunsă în pădurea de sub Țarcu, cascada se dezvăluie la capătul unui traseu scurt "
            "și răcoros, pe lângă pârâu. Apa cade peste stânci acoperite de mușchi, într-o "
            "atmosferă de basm. Este o destinație perfectă pentru o jumătate de zi, potrivită și "
            "pentru familii cu copii."
        ),
        "cover_image": RIVER,
        "gallery": [RIVER, FOREST, VALLEY],
        "attractions": ["Cascada", "Poteca pe lângă pârâu", "Poiana de picnic"],
        "experiences": ["Drumeție ușoară", "Picnic în natură", "Fotografie de peisaj"],
        "gastronomy": ["Sandvișuri de munte", "Apă de izvor", "Fructe de pădure"],
        "external_link": None,
        "featured": False,
        "editorial": False,
        "status": "published",
        "sort_order": 4,
    },
    {
        "id": "pm-de-6",
        "tenant_id": TENANT_ID,
        "slug": "cheile-bistrei",
        "name": "Cheile Bistrei",
        "region": "Banatul Montan",
        "county": "Caraș-Severin",
        "short_description": "Chei sălbatice săpate de râul Bistra, cu pereți de stâncă și ape repezi.",
        "description": (
            "Râul Bistra a săpat în timp un defileu spectaculos, cu pereți de stâncă și ape "
            "repezi. Cheile Bistrei sunt un traseu de drumeție și un loc iubit de fotografi, cu "
            "poduri de lemn peste apă și belvederi spre versanții împăduriți. Un colț sălbatic, "
            "la doar câțiva kilometri de stațiune."
        ),
        "cover_image": VALLEY,
        "gallery": [VALLEY, RIVER, MOUNTAINS],
        "attractions": ["Defileul", "Podurile de lemn", "Belvederile de stâncă"],
        "experiences": ["Drumeție prin chei", "Fotografie de peisaj", "Observarea păsărilor"],
        "gastronomy": ["Păstrăv proaspăt", "Brânză de munte", "Zacuscă de casă"],
        "external_link": None,
        "featured": False,
        "editorial": False,
        "status": "published",
        "sort_order": 5,
    },
]

# Program -> Evenimente (seasonal events)
PROGRAM: list[dict[str, Any]] = [
    {
        "id": "pm-ev-1",
        "tenant_id": TENANT_ID,
        "day": 1,
        "date": "2026-12-12",
        "start_time": "10:00",
        "end_time": "16:00",
        "title": "Deschiderea sezonului de schi",
        "description": "Prima zi de pârtie a sezonului, cu vin fiert, muzică și demonstrații ale instructorilor.",
        "stage": "Pârtie",
        "category": "Turism",
        "featured": True,
        "sort_order": 0,
    },
    {
        "id": "pm-ev-2",
        "tenant_id": TENANT_ID,
        "day": 2,
        "date": "2026-07-18",
        "start_time": "11:00",
        "end_time": "18:00",
        "title": "Festivalul brânzei la stână",
        "description": "O zi la stânele din Țarcu, cu demonstrații de preparare a cașcavalului și degustări.",
        "stage": "Centru",
        "category": "Gastronomie",
        "featured": True,
        "sort_order": 1,
    },
    {
        "id": "pm-ev-3",
        "tenant_id": TENANT_ID,
        "day": 2,
        "date": "2026-08-08",
        "start_time": "07:00",
        "end_time": "14:00",
        "title": "Concurs de pescuit sportiv",
        "description": "Competiție prietenoasă de pescuit la păstrăv pe lacul de smarald, cu premii pentru cele mai mari capturi.",
        "stage": "Lac",
        "category": "Turism",
        "featured": False,
        "sort_order": 2,
    },
    {
        "id": "pm-ev-4",
        "tenant_id": TENANT_ID,
        "day": 2,
        "date": "2026-08-15",
        "start_time": "10:00",
        "end_time": "20:00",
        "title": "Ziua Muntelui",
        "description": "Sărbătoarea comunității, cu drumeții ghidate, muzică de fanfară, ateliere pentru copii și bucate de munte.",
        "stage": "Centru",
        "category": "Muzică",
        "featured": True,
        "sort_order": 3,
    },
    {
        "id": "pm-ev-5",
        "tenant_id": TENANT_ID,
        "day": 1,
        "date": "2026-12-31",
        "start_time": "18:00",
        "end_time": "20:00",
        "title": "Coborâre cu torțe",
        "description": "Spectacol de neuitat: instructorii coboară pârtia cu torțe aprinse, urmat de foc de artificii.",
        "stage": "Pârtie",
        "category": "Muzică",
        "featured": True,
        "sort_order": 4,
    },
    {
        "id": "pm-ev-6",
        "tenant_id": TENANT_ID,
        "day": 3,
        "date": "2026-10-10",
        "start_time": "10:00",
        "end_time": "17:00",
        "title": "Târg de toamnă",
        "description": "Producători locali, meșteșugari și bucate de sezon în centrul stațiunii, la culesul toamnei.",
        "stage": "Centru",
        "category": "Meșteșuguri",
        "featured": False,
        "sort_order": 5,
    },
]

# Partners
PARTNERS: list[dict[str, Any]] = [
    {
        "id": "pm-pa-1",
        "tenant_id": TENANT_ID,
        "slug": "primaria-zavoi",
        "name": "Primăria Zăvoi",
        "tier": "Organizator",
        "logo": "PZ",
        "description": "Administrația locală care gestionează stațiunea Poiana Mărului și susține dezvoltarea turismului.",
        "website": "https://primariazavoi.ro",
        "featured_on_home": True,
        "sort_order": 1,
        "status": "published",
    },
    {
        "id": "pm-pa-2",
        "tenant_id": TENANT_ID,
        "slug": "consiliul-judetean-caras-severin",
        "name": "Consiliul Județean Caraș-Severin",
        "tier": "Partener instituțional",
        "logo": "CS",
        "description": "Partener în promovarea Banatului Montan și a destinațiilor turistice din județ.",
        "website": "https://cjcs.ro",
        "featured_on_home": True,
        "sort_order": 2,
        "status": "published",
    },
    {
        "id": "pm-pa-3",
        "tenant_id": TENANT_ID,
        "slug": "salvamont-caras-severin",
        "name": "Salvamont Caraș-Severin",
        "tier": "Partener principal",
        "logo": "SM",
        "description": "Echipa de intervenție montană care asigură siguranța pe trasee și pe pârtii.",
        "website": "https://salvamontcs.ro",
        "featured_on_home": True,
        "sort_order": 3,
        "status": "published",
    },
    {
        "id": "pm-pa-4",
        "tenant_id": TENANT_ID,
        "slug": "rewilding-tarcu",
        "name": "Rewilding Țarcu",
        "tier": "Partener local",
        "logo": "RT",
        "description": "Organizația care coordonează reintroducerea zimbrilor și turismul responsabil în Munții Țarcu.",
        "website": "https://rewildingtarcu.ro",
        "featured_on_home": False,
        "sort_order": 4,
        "status": "published",
    },
    {
        "id": "pm-pa-5",
        "tenant_id": TENANT_ID,
        "slug": "asociatia-turism-banat",
        "name": "Asociația de Turism Banat",
        "tier": "Sponsor",
        "logo": "TB",
        "description": "Partener în promovarea stațiunii și a experiențelor de munte din Banatul Montan.",
        "website": "https://turismbanat.ro",
        "featured_on_home": False,
        "sort_order": 5,
        "status": "published",
    },
]

# Gallery
GALLERY: list[dict[str, Any]] = [
    {"id": "pm-g-1", "tenant_id": TENANT_ID, "src": MOUNTAIN_LAKE, "alt": "Lacul de smarald din Poiana Mărului", "category": "Turism", "span": "wide", "sort_order": 0},
    {"id": "pm-g-2", "tenant_id": TENANT_ID, "src": PEAKS, "alt": "Creste montane în Munții Țarcu", "category": "Turism", "span": "tall", "sort_order": 1},
    {"id": "pm-g-3", "tenant_id": TENANT_ID, "src": FOREST, "alt": "Pădure de munte pe versanții Țarcului", "category": "Turism", "span": "normal", "sort_order": 2},
    {"id": "pm-g-4", "tenant_id": TENANT_ID, "src": VALLEY, "alt": "Vale verde la poalele muntelui", "category": "Turism", "span": "wide", "sort_order": 3},
    {"id": "pm-g-5", "tenant_id": TENANT_ID, "src": RIVER, "alt": "Apele repezi ale râului de munte", "category": "Turism", "span": "normal", "sort_order": 4},
    {"id": "pm-g-6", "tenant_id": TENANT_ID, "src": DISH, "alt": "Preparat de munte gătit la ceaun", "category": "Gastronomie", "span": "normal", "sort_order": 5},
    {"id": "pm-g-7", "tenant_id": TENANT_ID, "src": CHEESE, "alt": "Brânză și cașcaval de stână", "category": "Gastronomie", "span": "normal", "sort_order": 6},
    {"id": "pm-g-8", "tenant_id": TENANT_ID, "src": FOLK, "alt": "Ansamblu folcloric la sărbătoarea muntelui", "category": "Tradiții", "span": "tall", "sort_order": 7},
    {"id": "pm-g-9", "tenant_id": TENANT_ID, "src": CHILDREN, "alt": "Copii la atelier în natură", "category": "Ateliere", "span": "normal", "sort_order": 8},
    {"id": "pm-g-10", "tenant_id": TENANT_ID, "src": MEADOW, "alt": "Pajiște alpină plină de flori", "category": "Turism", "span": "wide", "sort_order": 9},
]

# Articles
ARTICLES: list[dict[str, Any]] = [
    {
        "id": "pm-ar-1",
        "tenant_id": TENANT_ID,
        "slug": "un-weekend-la-poiana-marului",
        "title": "Un weekend la Poiana Mărului",
        "excerpt": "Două zile la munte, între lac, poteci și seri la foc. Un mini-ghid pentru o escapadă completă.",
        "body": (
            "<p>Poiana Mărului este genul de loc unde un weekend pare o vacanță întreagă. Aerul "
            "de munte, apa lacului și liniștea te desprind repede de agitația orașului.</p>"
            "<h2>Sâmbătă</h2>"
            "<p>Începe ziua cu o cafea pe malul lacului, apoi pornește pe o potecă spre pădure. "
            "După-amiaza, o plimbare cu barca și o baie de soare pe mal. Seara, foc de tabără și "
            "bucate la ceaun.</p>"
            "<h2>Duminică</h2>"
            "<p>O drumeție mai lungă spre creastă sau o vizită la stână, apoi drumul spre casă cu "
            "o oprire la Cheile Bistrei.</p>"
        ),
        "category": "Ghid",
        "author": "Echipa Poiana Mărului",
        "date": "2026-06-15",
        "reading_minutes": 5,
        "cover_image": MOUNTAIN_LAKE,
        "featured": True,
        "status": "published",
        "sort_order": 0,
    },
    {
        "id": "pm-ar-2",
        "tenant_id": TENANT_ID,
        "slug": "sezonul-de-schi-la-muntele-mic",
        "title": "Sezonul de schi la Muntele Mic",
        "excerpt": "Zăpadă bună, pârtii pentru toate nivelurile și un sezon lung. Tot ce trebuie să știi pentru iarnă.",
        "body": (
            "<p>Muntele Mic este prima stațiune de schi din Banat și, datorită altitudinii, are "
            "unul dintre cele mai lungi sezoane din zonă.</p>"
            "<h2>Pârtii pentru toți</h2>"
            "<p>De la pante line pentru începători la trasee mai abrupte pentru avansați, domeniul "
            "acoperă toate nivelurile. Poți închiria echipament pe loc și lua lecții cu instructor.</p>"
            "<blockquote>Cel mai bun moment pentru zăpadă pufoasă este dimineața devreme.</blockquote>"
            "<p>Nu rata coborârea cu torțe de Revelion — un spectacol de neuitat pe pârtie.</p>"
        ),
        "category": "Ghid",
        "author": "Andrei Muntean",
        "date": "2026-11-20",
        "reading_minutes": 6,
        "cover_image": PEAKS,
        "featured": True,
        "status": "published",
        "sort_order": 1,
    },
    {
        "id": "pm-ar-3",
        "tenant_id": TENANT_ID,
        "slug": "povestile-lacului",
        "title": "Poveștile lacului",
        "excerpt": "Cum s-a născut lacul de smarald și de ce a devenit inima stațiunii. O poveste despre apă și munte.",
        "body": (
            "<p>Lacul de la Poiana Mărului nu a fost dintotdeauna acolo. Barajul a schimbat valea, "
            "dar timpul a transformat apa într-un luciu de smarald în jurul căruia a crescut "
            "stațiunea.</p>"
            "<h2>O apă vie</h2>"
            "<p>Păstrăvul a găsit aici un cămin, iar pescarii vin de departe pentru zilele liniștite "
            "de pe mal. Localnicii spun că lacul are o culoare diferită în fiecare anotimp.</p>"
            "<p>Astăzi, lacul este punctul de plecare al aproape tuturor experiențelor din stațiune.</p>"
        ),
        "category": "Regiuni",
        "author": "Ana Codrea",
        "date": "2026-05-30",
        "reading_minutes": 4,
        "cover_image": VALLEY,
        "featured": False,
        "status": "published",
        "sort_order": 2,
    },
    {
        "id": "pm-ar-4",
        "tenant_id": TENANT_ID,
        "slug": "gustul-muntelui",
        "title": "Gustul muntelui",
        "excerpt": "Brânză de stână, păstrăv proaspăt și bucate la ceaun. O incursiune în bucătăria de munte a stațiunii.",
        "body": (
            "<p>La munte, mâncarea are alt gust. Poate fi aerul, poate fi apa de izvor, poate fi "
            "răbdarea cu care se gătește la ceaun.</p>"
            "<h2>De la stână la masă</h2>"
            "<p>Cașcavalul afumat și brânza frământată vin direct de la stânele din Țarcu. "
            "Păstrăvul, proaspăt scos din lac, se face la grătar cu un strop de lămâie.</p>"
            "<blockquote>Cea mai bună masă de munte este cea gătită încet, lângă foc.</blockquote>"
            "<p>Gazdele din stațiune păstrează rețete vechi și le pun pe masă cu mândrie.</p>"
        ),
        "category": "Producători",
        "author": "Mihai Preda",
        "date": "2026-07-05",
        "reading_minutes": 5,
        "cover_image": DISH,
        "featured": False,
        "status": "published",
        "sort_order": 3,
    },
]

# Contact messages
CONTACT_MESSAGES: list[dict[str, Any]] = [
    {
        "id": "pm-cm-1",
        "tenant_id": TENANT_ID,
        "name": "Diana Popescu",
        "email": "diana.p@example.com",
        "subject": "Cazare pentru un weekend de schi",
        "message": "Bună ziua! Căutăm cazare pentru 4 persoane în weekendul de deschidere a sezonului de schi. Aveți disponibilitate?",
        "date": "2026-11-25",
        "read": False,
    },
    {
        "id": "pm-cm-2",
        "tenant_id": TENANT_ID,
        "name": "Radu Ionescu",
        "email": "radu.i@example.com",
        "subject": "Pescuit la lac",
        "message": "Aș dori informații despre permisele de pescuit și dacă se poate închiria echipament pe loc. Mulțumesc!",
        "date": "2026-07-02",
        "read": True,
    },
]

# Newsletter subscribers
NEWSLETTER: list[dict[str, Any]] = [
    {"id": "pm-ns-1", "tenant_id": TENANT_ID, "email": "cristina.marin@example.com", "date": "2026-06-10", "source": "Homepage"},
    {"id": "pm-ns-2", "tenant_id": TENANT_ID, "email": "paul.enache@example.com", "date": "2026-06-18", "source": "Articol"},
    {"id": "pm-ns-3", "tenant_id": TENANT_ID, "email": "sorina.dumitru@example.com", "date": "2026-07-01", "source": "Contact"},
]

# Media assets (optional stock rows for this tenant)
MEDIA: list[dict[str, Any]] = [
    {"id": "pm-md-mountainlake", "tenant_id": TENANT_ID, "url": MOUNTAIN_LAKE, "alt": "Mountain Lake", "filename": "mountainLake.jpg", "content_type": "image/jpeg", "size": 0, "is_stock": True},
    {"id": "pm-md-mountains", "tenant_id": TENANT_ID, "url": MOUNTAINS, "alt": "Mountains", "filename": "mountains.jpg", "content_type": "image/jpeg", "size": 0, "is_stock": True},
    {"id": "pm-md-forest", "tenant_id": TENANT_ID, "url": FOREST, "alt": "Forest", "filename": "forest.jpg", "content_type": "image/jpeg", "size": 0, "is_stock": True},
    {"id": "pm-md-valley", "tenant_id": TENANT_ID, "url": VALLEY, "alt": "Valley", "filename": "valley.jpg", "content_type": "image/jpeg", "size": 0, "is_stock": True},
    {"id": "pm-md-peaks", "tenant_id": TENANT_ID, "url": PEAKS, "alt": "Peaks", "filename": "peaks.jpg", "content_type": "image/jpeg", "size": 0, "is_stock": True},
    {"id": "pm-md-village", "tenant_id": TENANT_ID, "url": VILLAGE, "alt": "Village", "filename": "village.jpg", "content_type": "image/jpeg", "size": 0, "is_stock": True},
    {"id": "pm-md-meadow", "tenant_id": TENANT_ID, "url": MEADOW, "alt": "Meadow", "filename": "meadow.jpg", "content_type": "image/jpeg", "size": 0, "is_stock": True},
    {"id": "pm-md-river", "tenant_id": TENANT_ID, "url": RIVER, "alt": "River", "filename": "river.jpg", "content_type": "image/jpeg", "size": 0, "is_stock": True},
]


def _wipe_poiana(session: Session, tenant_id: str = TENANT_ID) -> None:
    """Delete all content, media and the tenant row for the resort tenant."""
    for model in (
        Product,  # child of exhibitor — delete before exhibitor
        Exhibitor,
        Destination,
        ProgramEvent,
        Partner,
        GalleryImage,
        Article,
        ContactMessage,
        NewsletterSubscriber,
        MediaAsset,
    ):
        rows = session.exec(
            select(model).where(model.tenant_id == tenant_id)  # type: ignore[attr-defined]
        ).all()
        for r in rows:
            session.delete(r)
    tenant = session.get(Tenant, tenant_id)
    if tenant:
        session.delete(tenant)
    session.commit()


def run_poiana_seed(session: Session, *, force: bool = False) -> None:
    """Insert the Poiana Mărului resort demo data.

    Idempotent: if the tenant already exists and not force, return; if force,
    wipe it first. Mirrors the insert order / flush discipline of `run_seed`.
    """
    existing = session.get(Tenant, TENANT_ID)
    if existing and not force:
        return
    if existing and force:
        _wipe_poiana(session, TENANT_ID)

    # Insert parents before children so foreign keys resolve.
    session.add(Tenant(**_parse_dates(TENANT, ["start_date", "end_date"])))
    session.flush()

    for row in EXHIBITORS:
        session.add(Exhibitor(**row))
    session.flush()

    for row in PRODUCTS:
        session.add(Product(**row))
    for row in DESTINATIONS:
        session.add(Destination(**row))
    for row in PROGRAM:
        session.add(ProgramEvent(**_parse_dates(row, ["date"])))
    for row in PARTNERS:
        session.add(Partner(**row))
    for row in GALLERY:
        session.add(GalleryImage(**row))
    for row in ARTICLES:
        session.add(Article(**_parse_dates(row, ["date"])))
    for row in CONTACT_MESSAGES:
        session.add(ContactMessage(**_parse_dates(row, ["date"])))
    for row in NEWSLETTER:
        session.add(NewsletterSubscriber(**_parse_dates(row, ["date"])))
    for row in MEDIA:
        session.add(MediaAsset(**row))

    session.commit()
