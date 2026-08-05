"""Seed data for the THIRD demo tenant: the open-air museum Muzeul Satului Bănățean.

This runs ALONGSIDE the PRISPA festival seed and the Poiana Mărului resort seed
(see `seed.py`) to further prove the "one engine, many verticals" idea: the same
data model, driven by a different `event_type` ("museum") and per-tenant
`labels`, renders as an open-air village museum instead of a festival or resort.

The data is built inline (rather than from a JSON file) so the museum copy and
image mapping live in one readable place. Mirrors `seed_poiana.py` exactly.
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

TENANT_ID = "muzeul-satului-banatean"


def _u(photo_id: str, w: int = 1200) -> str:
    """Build an Unsplash URL in the same format the frontend image pool uses."""
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w={w}&q=80"


# --- Reused, known-good photo IDs (from web/.../prispa/images.ts) ---
CRAFTS = _u("1513519245088-0e12902e35ca", 1600)
WEAVING = _u("1528795259021-d8c86e14354c", 1600)
POTTERY = _u("1565193566173-7a0ee3dbe261", 1600)
CERAMICS = _u("1610701596007-11502861dcfa", 1600)
VILLAGE = _u("1500534623283-312aade485b7", 1600)
VILLAGE_HERO = _u("1500534623283-312aade485b7", 2000)
FOLK = _u("1533928298208-27ff66555d8d", 1400)
AUTUMN = _u("1508615039623-a25605d2b022", 1600)
FOREST = _u("1441974231531-c6227db76b6e", 1600)
MEADOW = _u("1470252649378-9c29740c9fa8", 1600)
VALLEY = _u("1454391304352-2bf4678b1a7a", 1600)
RIVER = _u("1439066615861-d1af74d74000", 1600)
CHILDREN = _u("1541692641319-981cc79ee10a", 1400)
WORKSHOP = _u("1452860606245-08befc0ff44b", 1400)
CHEESE = _u("1486297678162-eb2a19b0a32d")
HONEY = _u("1587049352846-4a222e784d38")
BREAD = _u("1509440159596-0249088772ff")
DISH = _u("1414235077428-338989a2e8c0")
FOOD_SPREAD = _u("1504674900247-0877df9cc836")
MARKET = _u("1488459716781-31db52582fe9")
FOLK_MUSIC = _u("1533174072545-7a4b6ad7a6c3", 1400)


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
    "slug": "muzeul-satului-banatean",
    "event_type": "museum",
    "name": "Muzeul Satului Bănățean",
    "tagline": "Satul bănățean, sub cerul liber",
    "short_description": (
        "Muzeu în aer liber în Pădurea Verde din Timișoara, cu case țărănești "
        "aduse din tot Banatul, o biserică de lemn, ateliere de meșteșuguri și "
        "colecții etnografice care păstrează vie viața satului de altădată."
    ),
    "long_description": (
        "Muzeul Satului Bănățean se întinde pe câteva zeci de hectare din "
        "Pădurea Verde, la marginea Timișoarei, ca un sat întreg strămutat sub "
        "cerul liber. Peste 40 de construcții tradiționale — case de câmpie și "
        "de munte, gospodării cu anexe, o moară de apă, ateliere și o biserică "
        "de lemn — au fost aduse din toate zonele etnografice ale Banatului și "
        "reasamblate grindă cu grindă. Interioarele păstrează mobilierul, "
        "textilele și uneltele originale, iar meșterii țin vii olăritul, "
        "țesutul și fierăria în ateliere deschise publicului. Muzeul este "
        "deschis tot anul, iar expozițiile temporare, târgurile de meșteșuguri "
        "și atelierele pentru copii aduc satul de altădată în prezent. "
        "Program de vizitare: marți–duminică, 10:00–18:00 (luni închis)."
    ),
    "start_date": None,
    "end_date": None,
    "location_name": "Pădurea Verde",
    "city": "Timișoara",
    "county": "Timiș",
    "hero_image": VILLAGE_HERO,
    "hero_badge": "Tradiție • Meșteșuguri • Aer liber",
    "logo_text": "Muzeul Satului Bănățean",
    # Theme — institutional, warm charcoal-brown, distinct from festival green
    # (#183C32) and resort teal (#17414B).
    "theme_primary": "#3A2E2A",
    "theme_secondary": "#F1EBE0",
    "theme_terracotta": "#9C5A3C",
    "theme_gold": "#A9843F",
    "theme_charcoal": "#26221F",
    "theme_background": "#F7F3EC",
    "social_facebook": "https://facebook.com/muzeulsatuluibanatean",
    "social_instagram": "https://instagram.com/muzeulsatuluibanatean",
    "social_youtube": "https://youtube.com/@muzeulsatuluibanatean",
    "social_website": "https://muzeulsatuluibanatean.ro",
    "contact_email": "contact@muzeulsatuluibanatean.ro",
    "contact_phone": "+40 256 225 588",
    "contact_address": "Aleea CFR nr. 1, Pădurea Verde",
    "contact_city": "Timișoara",
    "contact_county": "Timiș",
    "contact_map_query": "Muzeul Satului Bănățean, Timișoara",
    "navigation": [
        {"label": "Despre", "href": "/despre"},
        {"label": "Colecții", "href": "/expozanti"},
        {"label": "Exponate", "href": "/produse"},
        {"label": "Case & spații", "href": "/destinatii"},
        {"label": "Expoziții & evenimente", "href": "/program"},
        {"label": "Galerie", "href": "/galerie"},
        {"label": "Noutăți", "href": "/noutati"},
        {"label": "Contact", "href": "/contact"},
    ],
    "sections": [
        {"id": "hero", "label": "Hero", "visible": True},
        {"id": "about", "label": "Despre muzeu", "visible": True},
        {"id": "experiences", "label": "Zone & experiențe", "visible": True},
        {"id": "program", "label": "Expoziții & evenimente", "visible": True},
        {"id": "exhibitors", "label": "Colecții", "visible": True},
        {"id": "products", "label": "Exponate", "visible": True},
        {"id": "destinations", "label": "Case & spații", "visible": True},
        {"id": "partners", "label": "Parteneri", "visible": True},
        {"id": "gallery", "label": "Galerie", "visible": True},
        {"id": "news", "label": "Noutăți", "visible": True},
        {"id": "newsletter", "label": "Newsletter", "visible": True},
    ],
    "stats": [
        {"label": "Construcții tradiționale", "value": "40+", "icon": "MapPin"},
        {"label": "Peste 100 de ani", "value": "1904", "icon": "CalendarDays"},
        {"label": "Zone etnografice", "value": "6", "icon": "Mountain"},
        {"label": "Deschis tot anul", "value": "365 zile", "icon": "Store"},
    ],
    "experiences": [
        {
            "id": "case",
            "title": "Case & gospodării tradiționale",
            "description": "Case de câmpie și de munte, cu interioare originale, aduse din toate zonele etnografice ale Banatului.",
            "icon": "Store",
            "image": VILLAGE,
        },
        {
            "id": "ateliere",
            "title": "Ateliere de meșteșuguri",
            "description": "Olărit, țesut și fierărie ținute vii de meșteri, în ateliere deschise publicului.",
            "icon": "Hammer",
            "image": CRAFTS,
        },
        {
            "id": "biserica",
            "title": "Biserica de lemn",
            "description": "O biserică de lemn strămutată grindă cu grindă, mărturie a arhitecturii sacre bănățene.",
            "icon": "MapPin",
            "image": FOREST,
        },
        {
            "id": "colectii",
            "title": "Colecții etnografice",
            "description": "Textile, port popular, ceramică și mobilier țărănesc, în colecții tematice bogate.",
            "icon": "ShoppingBasket",
            "image": WEAVING,
        },
        {
            "id": "copii",
            "title": "Ateliere pentru copii",
            "description": "Ateliere de olărit, țesut și pictură pe sticlă, prin care cei mici descoperă meșteșugurile.",
            "icon": "Baby",
            "image": CHILDREN,
        },
        {
            "id": "evenimente",
            "title": "Evenimente & expoziții",
            "description": "Expoziții temporare, concerte de colinde, târguri de meșteșuguri și Noaptea Muzeelor.",
            "icon": "Music",
            "image": FOLK,
        },
    ],
    "labels": {
        "heroCtaPrimary": "Planifică vizita",
        "heroCtaSecondary": "Vezi expozițiile",
        "aboutEyebrow": "Despre muzeu",
        "aboutTitle": "Un sat bănățean întreg, sub cerul liber",
        "experiencesEyebrow": "Zone & experiențe",
        "experiencesTitle": "Ce descoperi la muzeu",
        "experiencesDescription": "De la case și ateliere la biserica de lemn și colecțiile etnografice — satul de altădată, viu în fiecare colț.",
        "programEyebrow": "Expoziții & evenimente",
        "programTitle": "Ce se întâmplă la muzeu",
        "programDescription": "Expoziții temporare, ateliere, concerte și târguri de meșteșuguri, pe tot parcursul anului.",
        "exhibitorsEyebrow": "Colecții",
        "exhibitorsTitle": "Colecțiile muzeului",
        "exhibitorsDescription": "Secții și colecții tematice care păstrează textilele, ceramica, uneltele și mobilierul satului bănățean.",
        "productsEyebrow": "Exponate",
        "productsTitle": "Exponate de neratat",
        "productsDescription": "Obiecte reprezentative din patrimoniul muzeului, de la portul popular la uneltele de meșteșug.",
        "destinationsEyebrow": "Case & spații",
        "destinationsTitle": "Casele & spațiile muzeului",
        "destinationsDescription": "Construcțiile în aer liber ale muzeului: case, gospodării, moara de apă, atelierul de olărit și biserica de lemn.",
        "partnersEyebrow": "Parteneri",
        "partnersTitle": "Parteneri și susținători",
        "partnersDescription": "Instituții și organizații culturale care sprijină conservarea patrimoniului bănățean.",
        "galleryEyebrow": "Galerie",
        "galleryTitle": "Muzeul în imagini",
        "galleryDescription": "Casele, atelierele și viața satului de altădată, surprinse în fiecare anotimp.",
        "newsEyebrow": "Noutăți",
        "newsTitle": "Povești de la muzeu",
        "newsDescription": "Articole, povești și noutăți despre patrimoniul și viața muzeului.",
        "exhibitorsPageTitle": "Colecții & secții",
        "exhibitorsPageDescription": "Colecțiile și secțiile tematice ale Muzeului Satului Bănățean.",
        "productsPageTitle": "Exponate",
        "productsPageDescription": "Obiectele reprezentative din patrimoniul Muzeului Satului Bănățean.",
        "destinationsPageTitle": "Case & spații",
        "destinationsPageDescription": "Casele, gospodăriile și spațiile în aer liber ale muzeului.",
        "programPageTitle": "Expoziții & evenimente",
        "programPageDescription": "Calendarul expozițiilor și evenimentelor Muzeului Satului Bănățean.",
    },
}


# ---------------------------------------------------------------------------
# Content — festival entities mapped to museum meaning
# ---------------------------------------------------------------------------

# Exhibitors -> Colecții (thematic collections / sections)
EXHIBITORS: list[dict[str, Any]] = [
    {
        "id": "mz-ex-1",
        "tenant_id": TENANT_ID,
        "slug": "colectia-de-textile-si-port-popular",
        "name": "Colecția de textile & port popular",
        "category": "Colecție",
        "town": "Timișoara",
        "county": "Timiș",
        "region": "Banat",
        "short_description": "Ii cusute manual, catrințe, ștergare și costume de sărbătoare din toate zonele Banatului.",
        "description": (
            "Colecția de textile și port popular adună sute de piese lucrate în casă: ii "
            "cusute cu mărgele și fir, catrințe țesute la război, ștergare de perete și "
            "costume de sărbătoare. Fiecare zonă etnografică a Banatului își are propriul "
            "chromatism și croi, iar exponatele arată cum se îmbrăca satul la muncă, la horă "
            "și la biserică."
        ),
        "image": WEAVING,
        "gallery": [WEAVING, CRAFTS, FOLK],
        "certified": True,
        "featured": True,
        "product_ids": [],
        "contact_phone": "+40 256 225 588",
        "contact_website": "https://muzeulsatuluibanatean.ro/textile",
        "status": "published",
        "sort_order": 0,
    },
    {
        "id": "mz-ex-2",
        "tenant_id": TENANT_ID,
        "slug": "atelierul-fierarului",
        "name": "Atelierul fierarului",
        "category": "Secție",
        "town": "Timișoara",
        "county": "Timiș",
        "region": "Banat",
        "short_description": "Fierăria satului, cu foale, nicovală și unelte forjate manual, în atelier funcțional.",
        "description": (
            "Atelierul fierarului reconstituie fierăria satului, cu vatra, foalele și "
            "nicovala la locul lor. Aici se forjau potcoave, balamale, unelte agricole și "
            "obiecte de uz casnic. La demonstrațiile de meșteșug, vizitatorii văd metalul "
            "înroșit prinzând formă sub ciocan, așa cum se lucra cu un secol în urmă."
        ),
        "image": CRAFTS,
        "gallery": [CRAFTS, WORKSHOP, VILLAGE],
        "certified": True,
        "featured": True,
        "product_ids": [],
        "contact_phone": "+40 256 225 588",
        "contact_website": "",
        "status": "published",
        "sort_order": 1,
    },
    {
        "id": "mz-ex-3",
        "tenant_id": TENANT_ID,
        "slug": "colectia-de-ceramica-banateana",
        "name": "Colecția de ceramică bănățeană",
        "category": "Colecție",
        "town": "Timișoara",
        "county": "Timiș",
        "region": "Banat",
        "short_description": "Oale, străchini și cahle smălțuite din centrele de olari ale Banatului.",
        "description": (
            "Colecția de ceramică reunește piese din marile centre de olari bănățene: oale "
            "de gătit, străchini smălțuite, ulcioare și cahle de teracotă pentru sobe. "
            "Decorul verde-măsliniu și galben, specific Banatului, spune povestea unor "
            "ateliere care au aprovizionat satele întregi cu vase de zi cu zi și de sărbătoare."
        ),
        "image": POTTERY,
        "gallery": [POTTERY, CERAMICS, CRAFTS],
        "certified": True,
        "featured": True,
        "product_ids": [],
        "contact_phone": "+40 256 225 588",
        "contact_website": "",
        "status": "published",
        "sort_order": 2,
    },
    {
        "id": "mz-ex-4",
        "tenant_id": TENANT_ID,
        "slug": "gospodaria-de-la-munte",
        "name": "Gospodăria de la munte",
        "category": "Secție",
        "town": "Timișoara",
        "county": "Timiș",
        "region": "Banat",
        "short_description": "Reconstituirea unei gospodării de munte, cu anexe, unelte și interior autentic.",
        "description": (
            "Gospodăria de la munte reconstituie viața dintr-o zonă de deal a Banatului: "
            "casa cu tindă, anexele pentru animale, șura și uneltele de lucru. Interiorul "
            "păstrează vatra, patul înalt cu zestre și obiectele de uz zilnic, oferind o "
            "imagine completă a autonomiei gospodăriei țărănești."
        ),
        "image": VILLAGE,
        "gallery": [VILLAGE, FOREST, MEADOW],
        "certified": False,
        "featured": False,
        "product_ids": [],
        "contact_phone": "+40 256 225 588",
        "contact_website": "",
        "status": "published",
        "sort_order": 3,
    },
    {
        "id": "mz-ex-5",
        "tenant_id": TENANT_ID,
        "slug": "colectia-de-icoane",
        "name": "Colecția de icoane",
        "category": "Colecție",
        "town": "Timișoara",
        "county": "Timiș",
        "region": "Banat",
        "short_description": "Icoane pe sticlă și pe lemn, mărturii ale credinței și artei populare bănățene.",
        "description": (
            "Colecția de icoane cuprinde icoane pe sticlă și pe lemn, lucrate de meșteri "
            "populari și de zugravi de biserici. Culorile vii și naivitatea desenului fac "
            "din aceste piese o expresie autentică a credinței satului. Colecția include și "
            "obiecte de cult folosite în bisericile de lemn din zonă."
        ),
        "image": CRAFTS,
        "gallery": [CRAFTS, FOLK, POTTERY],
        "certified": True,
        "featured": False,
        "product_ids": [],
        "contact_phone": "+40 256 225 588",
        "contact_website": "",
        "status": "published",
        "sort_order": 4,
    },
    {
        "id": "mz-ex-6",
        "tenant_id": TENANT_ID,
        "slug": "instalatii-tehnice-taranesti",
        "name": "Instalații tehnice țărănești",
        "category": "Secție",
        "town": "Timișoara",
        "county": "Timiș",
        "region": "Banat",
        "short_description": "Mori de apă, pive și instalații de fierărie, mărturii ale tehnicii populare.",
        "description": (
            "Secția de instalații tehnice adună mărturii ale ingeniozității țărănești: mori "
            "de apă, pive pentru bătut țesăturile, teascuri și instalații de fierărie. Puse "
            "în funcțiune la demonstrații, ele arată cum folosea satul forța apei pentru a "
            "măcina grâul și a prelucra materialele."
        ),
        "image": RIVER,
        "gallery": [RIVER, VALLEY, WORKSHOP],
        "certified": False,
        "featured": False,
        "product_ids": [],
        "contact_phone": "+40 256 225 588",
        "contact_website": "",
        "status": "published",
        "sort_order": 5,
    },
    {
        "id": "mz-ex-7",
        "tenant_id": TENANT_ID,
        "slug": "colectia-de-mobilier-taranesc",
        "name": "Colecția de mobilier țărănesc",
        "category": "Colecție",
        "town": "Timișoara",
        "county": "Timiș",
        "region": "Banat",
        "short_description": "Lăzi de zestre, paturi și blidare pictate, mobilierul casei bănățene.",
        "description": (
            "Colecția de mobilier țărănesc adună piesele care umpleau casa bănățeană: lăzi "
            "de zestre pictate cu flori, paturi înalte, blidare, scaune și mese lucrate de "
            "dulgheri de sat. Decorul pictat și îmbinările măiestrite arată cât de multă "
            "grijă se punea în obiectele care treceau din generație în generație."
        ),
        "image": VILLAGE,
        "gallery": [VILLAGE, CRAFTS, WEAVING],
        "certified": True,
        "featured": False,
        "product_ids": [],
        "contact_phone": "+40 256 225 588",
        "contact_website": "",
        "status": "published",
        "sort_order": 6,
    },
]

# Products -> Exponate (individual museum objects; not for sale, price=None)
PRODUCTS: list[dict[str, Any]] = [
    {
        "id": "mz-pr-1",
        "season": "all",
        "tenant_id": TENANT_ID,
        "slug": "ie-cusuta-manual",
        "name": "Ie cusută manual",
        "producer": "Colecția de textile & port popular",
        "exhibitor_id": None,
        "region": "Banat",
        "category": "Textile",
        "short_description": "Ie de sărbătoare cusută manual cu fir și mărgele, din zona de câmpie a Banatului.",
        "story": (
            "Această ie de sărbătoare a fost cusută manual, cu fir de bumbac și mărgele, de "
            "o femeie din zona de câmpie a Banatului la începutul secolului XX. Motivele "
            "geometrice de pe mâneci și piept spuneau cui aparținea și din ce sat venea "
            "purtătoarea. O piesă care cerea luni de muncă la lumina lămpii."
        ),
        "image": WEAVING,
        "gallery": [WEAVING, FOLK],
        "price": None,
        "featured": True,
        "status": "published",
        "sort_order": 0,
    },
    {
        "id": "mz-pr-2",
        "season": "all",
        "tenant_id": TENANT_ID,
        "slug": "razboi-de-tesut-orizontal",
        "name": "Război de țesut orizontal",
        "producer": "Colecția de textile & port popular",
        "exhibitor_id": None,
        "region": "Banat",
        "category": "Unelte",
        "short_description": "Război de țesut din lemn, la care se lucrau covoare, catrințe și pânză de casă.",
        "story": (
            "Războiul de țesut orizontal era inima textilă a fiecărei case. La el se țeseau "
            "covoarele, catrințele și pânza de casă, iarnă după iarnă. Acest exemplar, din "
            "lemn masiv, păstrează urmele mâinilor care l-au folosit generații la rând și "
            "este pus în funcțiune la atelierele de țesut ale muzeului."
        ),
        "image": CRAFTS,
        "gallery": [CRAFTS, WEAVING],
        "price": None,
        "featured": True,
        "status": "published",
        "sort_order": 1,
    },
    {
        "id": "mz-pr-3",
        "season": "all",
        "tenant_id": TENANT_ID,
        "slug": "ceramica-smaltuita-de-banat",
        "name": "Ceramică smălțuită de Banat",
        "producer": "Colecția de ceramică bănățeană",
        "exhibitor_id": None,
        "region": "Banat",
        "category": "Ceramică",
        "short_description": "Strachină smălțuită cu decor verde și galben, din centrele de olari bănățene.",
        "story": (
            "Strachina smălțuită cu verde-măsliniu și galben este semnătura ceramicii "
            "bănățene. Lucrată la roata olarului și arsă în cuptor cu lemne, ea servea deopotrivă "
            "la masa de zi cu zi și la sărbători. Decorul simplu, dar viu, o făcea la fel de "
            "frumoasă pe cât de folositoare."
        ),
        "image": POTTERY,
        "gallery": [POTTERY, CERAMICS],
        "price": None,
        "featured": True,
        "status": "published",
        "sort_order": 2,
    },
    {
        "id": "mz-pr-4",
        "season": "all",
        "tenant_id": TENANT_ID,
        "slug": "icoana-pe-sticla",
        "name": "Icoană pe sticlă",
        "producer": "Colecția de icoane",
        "exhibitor_id": None,
        "region": "Banat",
        "category": "Artă sacră",
        "short_description": "Icoană pe sticlă pictată de un meșter popular, cu culori vii și desen naiv.",
        "story": (
            "Icoana pe sticlă era nelipsită din casa țăranului bănățean, așezată la loc de "
            "cinste pe peretele dinspre răsărit. Pictată invers, pe spatele sticlei, cu culori "
            "vii și un desen naiv, plin de căldură, ea era în același timp obiect de cult și "
            "podoabă a casei."
        ),
        "image": CRAFTS,
        "gallery": [CRAFTS, FOLK],
        "price": None,
        "featured": False,
        "status": "published",
        "sort_order": 3,
    },
    {
        "id": "mz-pr-5",
        "season": "all",
        "tenant_id": TENANT_ID,
        "slug": "lada-de-zestre-pictata",
        "name": "Ladă de zestre pictată",
        "producer": "Colecția de mobilier țărănesc",
        "exhibitor_id": None,
        "region": "Banat",
        "category": "Mobilier",
        "short_description": "Ladă de zestre din lemn, pictată cu flori, în care fata își strângea zestrea.",
        "story": (
            "În lada de zestre, pictată cu buchete de flori pe fond închis, fata de măritat "
            "își strângea de mică zestrea: ii, ștergare, catrințe și așternuturi. Lada o "
            "însoțea la casa nouă și rămânea toată viața piesa cea mai prețuită din odaie, "
            "mărturie a hărniciei și a rânduielii satului."
        ),
        "image": VILLAGE,
        "gallery": [VILLAGE, CRAFTS],
        "price": None,
        "featured": False,
        "status": "published",
        "sort_order": 4,
    },
    {
        "id": "mz-pr-6",
        "season": "all",
        "tenant_id": TENANT_ID,
        "slug": "costum-popular-banatean",
        "name": "Costum popular bănățean",
        "producer": "Colecția de textile & port popular",
        "exhibitor_id": None,
        "region": "Banat",
        "category": "Textile",
        "short_description": "Costum de sărbătoare complet, cu ie, catrință, brâu și pieptar.",
        "story": (
            "Costumul popular bănățean de sărbătoare adună într-o singură ținută întreaga "
            "măiestrie a satului: ia cusută, catrința țesută în fir, brâul, pieptarul de "
            "blană și cizmele. Se purta la horă, la nuntă și la marile sărbători, iar croiul "
            "și culorile spuneau din ce sat și din ce zonă venea cel care îl purta."
        ),
        "image": FOLK,
        "gallery": [FOLK, WEAVING],
        "price": None,
        "featured": True,
        "status": "published",
        "sort_order": 5,
    },
    {
        "id": "mz-pr-7",
        "season": "all",
        "tenant_id": TENANT_ID,
        "slug": "cahle-de-teracota",
        "name": "Cahle de teracotă",
        "producer": "Colecția de ceramică bănățeană",
        "exhibitor_id": None,
        "region": "Banat",
        "category": "Ceramică",
        "short_description": "Cahle smălțuite din care se construiau sobele de teracotă ale caselor.",
        "story": (
            "Din cahle de teracotă, turnate și smălțuite la olar, se ridicau sobele care "
            "încălzeau casa bănățeană. Fiecare cahlă era decorată cu motive în relief, iar "
            "soba întreagă devenea o piesă de mândrie a odăii. Colecția păstrează cahle de "
            "diferite forme și culori, din mai multe centre de olari."
        ),
        "image": CERAMICS,
        "gallery": [CERAMICS, POTTERY],
        "price": None,
        "featured": False,
        "status": "published",
        "sort_order": 6,
    },
    {
        "id": "mz-pr-8",
        "season": "all",
        "tenant_id": TENANT_ID,
        "slug": "unelte-de-fierarie",
        "name": "Unelte de fierărie",
        "producer": "Atelierul fierarului",
        "exhibitor_id": None,
        "region": "Banat",
        "category": "Unelte",
        "short_description": "Ciocane, clești și unelte forjate manual din atelierul fierarului.",
        "story": (
            "Uneltele de fierărie — ciocane, clești, dălți și potcoave — au fost forjate "
            "manual în atelierul satului. Cu ele, fierarul lucra tot ce avea nevoie "
            "gospodăria: de la balamale și cuie la fiare de plug. Expuse lângă nicovală și "
            "foale, ele întregesc imaginea unui meșteșug esențial vieții de la sat."
        ),
        "image": CRAFTS,
        "gallery": [CRAFTS, WORKSHOP],
        "price": None,
        "featured": False,
        "status": "published",
        "sort_order": 7,
    },
]

# Destinations -> Case & spații (open-air pavilions / areas)
DESTINATIONS: list[dict[str, Any]] = [
    {
        "id": "mz-de-1",
        "tenant_id": TENANT_ID,
        "slug": "biserica-de-lemn-din-barsa",
        "name": "Biserica de lemn din Bârsa",
        "region": "Banat",
        "county": "Timiș",
        "short_description": "Biserică de lemn strămutată grindă cu grindă, inima spirituală a muzeului.",
        "description": (
            "Biserica de lemn din Bârsa este piesa de rezistență a muzeului: o construcție "
            "sacră strămutată grindă cu grindă și reasamblată în Pădurea Verde. Turla înaltă, "
            "acoperișul de șindrilă și interiorul pictat mărturisesc măiestria dulgherilor de "
            "biserici din Banat. În jurul ei, muzeul reconstituie atmosfera unui sat de "
            "altădată, cu ulițe, garduri de nuiele și grădini. Este locul unde se țin "
            "concertele de colinde și slujbele de sărbătoare, punctul cel mai fotografiat al "
            "întregului muzeu."
        ),
        "cover_image": FOREST,
        "gallery": [FOREST, VILLAGE, CRAFTS],
        "attractions": ["Turla de lemn", "Iconostasul pictat", "Curtea bisericii"],
        "experiences": ["Vizită ghidată", "Concerte de colinde", "Fotografie de patrimoniu"],
        "gastronomy": ["Colaci de sărbătoare", "Vin fiert", "Miere de salcâm"],
        "external_link": None,
        "featured": True,
        "editorial": True,
        "status": "published",
        "sort_order": 0,
    },
    {
        "id": "mz-de-2",
        "tenant_id": TENANT_ID,
        "slug": "casa-din-zona-de-campie",
        "name": "Casa din Zona de câmpie",
        "region": "Banat",
        "county": "Timiș",
        "short_description": "Casă bănățeană de câmpie cu tindă, odaie curată și interior original.",
        "description": (
            "Casa din zona de câmpie arată cum trăia gospodarul bănățean din satele de șes: "
            "o casă lungă, cu tindă la mijloc, odaia de zi și odaia curată păstrată pentru "
            "oaspeți și sărbători. Pereții văruiți, ferestrele mici și prispa din față sunt "
            "specifice arhitecturii de câmpie. Interiorul păstrează mobilierul, textilele și "
            "vasele de ceramică la locul lor, ca și cum gazda tocmai ar fi ieșit din odaie."
        ),
        "cover_image": VILLAGE,
        "gallery": [VILLAGE, WEAVING, POTTERY],
        "attractions": ["Prispa", "Odaia curată", "Bucătăria de vară"],
        "experiences": ["Vizită de interior", "Demonstrație de gospodărie", "Ateliere de tradiții"],
        "gastronomy": ["Pâine de casă", "Zacuscă", "Dulceață de casă"],
        "external_link": None,
        "featured": True,
        "editorial": False,
        "status": "published",
        "sort_order": 1,
    },
    {
        "id": "mz-de-3",
        "tenant_id": TENANT_ID,
        "slug": "gospodaria-de-munte",
        "name": "Gospodăria de munte",
        "region": "Banat",
        "county": "Timiș",
        "short_description": "Gospodărie de deal cu casă, șură și anexe, reconstituită integral.",
        "description": (
            "Gospodăria de munte reconstituie o curte întreagă din zona de deal a Banatului: "
            "casa cu pivniță de piatră, șura pentru fân, grajdul și anexele pentru unelte. "
            "Materialele — lemn și piatră — și așezarea în pantă vorbesc despre viața mai "
            "aspră de la munte. Interiorul păstrează vatra, uneltele agricole și obiectele de "
            "uz zilnic ale unei familii care își producea aproape tot ce avea nevoie."
        ),
        "cover_image": MEADOW,
        "gallery": [MEADOW, FOREST, VILLAGE],
        "attractions": ["Casa cu pivniță", "Șura", "Grajdul"],
        "experiences": ["Vizită ghidată", "Demonstrație de unelte", "Ateliere pentru copii"],
        "gastronomy": ["Brânză de burduf", "Afumături", "Pâine pe vatră"],
        "external_link": None,
        "featured": True,
        "editorial": False,
        "status": "published",
        "sort_order": 2,
    },
    {
        "id": "mz-de-4",
        "tenant_id": TENANT_ID,
        "slug": "moara-de-apa",
        "name": "Moara de apă",
        "region": "Banat",
        "county": "Timiș",
        "short_description": "Moară de apă funcțională, care măcina grâul cu forța pârâului.",
        "description": (
            "Moara de apă este una dintre cele mai îndrăgite construcții ale muzeului: pusă "
            "în funcțiune, roata de lemn se învârte sub apa pârâului și antrenează pietrele "
            "de moară. Vizitatorii văd cum boabele de grâu se transformă în făină, la fel ca "
            "acum o sută de ani. Moara era o instituție a satului, unde oamenii veneau nu doar "
            "să macine, ci și să afle noutățile."
        ),
        "cover_image": RIVER,
        "gallery": [RIVER, VALLEY, WORKSHOP],
        "attractions": ["Roata de apă", "Pietrele de moară", "Iazul morii"],
        "experiences": ["Demonstrație de măcinat", "Vizită tehnică", "Fotografie de peisaj"],
        "gastronomy": ["Mălai de casă", "Făină de grâu", "Turte pe plită"],
        "external_link": None,
        "featured": False,
        "editorial": False,
        "status": "published",
        "sort_order": 3,
    },
    {
        "id": "mz-de-5",
        "tenant_id": TENANT_ID,
        "slug": "atelierul-de-olarit",
        "name": "Atelierul de olărit",
        "region": "Banat",
        "county": "Timiș",
        "short_description": "Atelier de olar cu roată și cuptor, unde se țin demonstrații și ateliere.",
        "description": (
            "Atelierul de olărit reconstituie locul de muncă al olarului bănățean, cu roata, "
            "lada de lut și cuptorul de ars vasele. Aici meșterii țin demonstrații și ateliere "
            "deschise, în care vizitatorii, mari și mici, pot pune mâna pe lut și pot modela "
            "propria oală. Este unul dintre cele mai vii spații ale muzeului, unde meșteșugul "
            "trece direct din mâinile meșterului în ale publicului."
        ),
        "cover_image": POTTERY,
        "gallery": [POTTERY, CERAMICS, CRAFTS],
        "attractions": ["Roata olarului", "Cuptorul de ars", "Expoziția de vase"],
        "experiences": ["Atelier de olărit", "Demonstrație de meșteșug", "Ateliere pentru copii"],
        "gastronomy": [],
        "external_link": None,
        "featured": False,
        "editorial": False,
        "status": "published",
        "sort_order": 4,
    },
    {
        "id": "mz-de-6",
        "tenant_id": TENANT_ID,
        "slug": "poiana-evenimentelor",
        "name": "Poiana evenimentelor",
        "region": "Banat",
        "county": "Timiș",
        "short_description": "Poiană deschisă în inima muzeului, gazdă a târgurilor și spectacolelor.",
        "description": (
            "Poiana evenimentelor este spațiul deschis din inima muzeului, unde se desfășoară "
            "târgurile de meșteșuguri, spectacolele folclorice și marile sărbători precum "
            "Noaptea Muzeelor sau Ziua Muzeului. Înconjurată de case și ateliere, poiana adună "
            "meșteri, ansambluri și vizitatori, transformând muzeul dintr-o colecție statică "
            "într-un sat viu, plin de muzică, culoare și miros de bucate tradiționale."
        ),
        "cover_image": FOLK,
        "gallery": [FOLK, MARKET, MEADOW],
        "attractions": ["Scena de spectacole", "Aleile târgului", "Vatra de foc"],
        "experiences": ["Târguri de meșteșuguri", "Spectacole folclorice", "Ateliere în aer liber"],
        "gastronomy": ["Bucate la ceaun", "Cârnați bănățeni", "Gogoși și plăcinte"],
        "external_link": None,
        "featured": False,
        "editorial": False,
        "status": "published",
        "sort_order": 5,
    },
]

# Program -> Expoziții & evenimente
PROGRAM: list[dict[str, Any]] = [
    {
        "id": "mz-ev-1",
        "tenant_id": TENANT_ID,
        "day": 1,
        "date": "2026-09-15",
        "start_time": "10:00",
        "end_time": "18:00",
        "title": "Expoziție: Portul popular bănățean",
        "description": "Expoziție temporară dedicată portului popular din toate zonele etnografice ale Banatului, cu piese rar expuse.",
        "stage": "Sala mare",
        "category": "Conferință",
        "featured": True,
        "sort_order": 0,
    },
    {
        "id": "mz-ev-2",
        "tenant_id": TENANT_ID,
        "day": 1,
        "date": "2026-05-16",
        "start_time": "18:00",
        "end_time": "23:59",
        "title": "Noaptea Muzeelor",
        "description": "Muzeul deschis până noaptea târziu, cu tururi cu felinare, ateliere și concerte în poiană.",
        "stage": "Poiană",
        "category": "Turism",
        "featured": True,
        "sort_order": 1,
    },
    {
        "id": "mz-ev-3",
        "tenant_id": TENANT_ID,
        "day": 2,
        "date": "2026-06-01",
        "start_time": "11:00",
        "end_time": "14:00",
        "title": "Atelier de olărit pentru copii",
        "description": "Cei mici modelează lutul la roata olarului, sub îndrumarea meșterului, de Ziua Copilului.",
        "stage": "Atelier",
        "category": "Copii",
        "featured": False,
        "sort_order": 2,
    },
    {
        "id": "mz-ev-4",
        "tenant_id": TENANT_ID,
        "day": 3,
        "date": "2026-12-20",
        "start_time": "17:00",
        "end_time": "19:00",
        "title": "Concert de colinde",
        "description": "Colinde bănățene interpretate de ansambluri locale, la biserica de lemn, în atmosfera sărbătorilor.",
        "stage": "Poiană",
        "category": "Muzică",
        "featured": True,
        "sort_order": 3,
    },
    {
        "id": "mz-ev-5",
        "tenant_id": TENANT_ID,
        "day": 2,
        "date": "2026-07-12",
        "start_time": "10:00",
        "end_time": "20:00",
        "title": "Ziua Muzeului",
        "description": "Sărbătoarea muzeului, cu demonstrații de meșteșuguri, spectacole folclorice și bucate tradiționale.",
        "stage": "Poiană",
        "category": "Meșteșuguri",
        "featured": True,
        "sort_order": 4,
    },
    {
        "id": "mz-ev-6",
        "tenant_id": TENANT_ID,
        "day": 3,
        "date": "2026-10-04",
        "start_time": "10:00",
        "end_time": "18:00",
        "title": "Târg de meșteșuguri de toamnă",
        "description": "Meșteri populari din tot Banatul își expun și vând lucrările în poiana muzeului, la cules de toamnă.",
        "stage": "Poiană",
        "category": "Meșteșuguri",
        "featured": False,
        "sort_order": 5,
    },
]

# Partners
PARTNERS: list[dict[str, Any]] = [
    {
        "id": "mz-pa-1",
        "tenant_id": TENANT_ID,
        "slug": "consiliul-judetean-timis",
        "name": "Consiliul Județean Timiș",
        "tier": "Organizator",
        "logo": "CT",
        "description": "Autoritatea în subordinea căreia funcționează muzeul și principalul finanțator al activității sale.",
        "website": "https://cjtimis.ro",
        "featured_on_home": True,
        "sort_order": 1,
        "status": "published",
    },
    {
        "id": "mz-pa-2",
        "tenant_id": TENANT_ID,
        "slug": "ministerul-culturii",
        "name": "Ministerul Culturii",
        "tier": "Partener instituțional",
        "logo": "MC",
        "description": "Partener în programele de conservare și restaurare a patrimoniului cultural din Banat.",
        "website": "https://cultura.ro",
        "featured_on_home": True,
        "sort_order": 2,
        "status": "published",
    },
    {
        "id": "mz-pa-3",
        "tenant_id": TENANT_ID,
        "slug": "universitatea-de-vest-timisoara",
        "name": "Universitatea de Vest din Timișoara",
        "tier": "Partener principal",
        "logo": "UV",
        "description": "Partener în cercetarea etnografică și în programele educaționale desfășurate la muzeu.",
        "website": "https://uvt.ro",
        "featured_on_home": True,
        "sort_order": 3,
        "status": "published",
    },
    {
        "id": "mz-pa-4",
        "tenant_id": TENANT_ID,
        "slug": "asociatia-pentru-patrimoniu-banat",
        "name": "Asociația pentru Patrimoniu Banat",
        "tier": "Partener local",
        "logo": "PB",
        "description": "ONG cultural care sprijină restaurarea construcțiilor tradiționale și promovarea meșteșugurilor.",
        "website": "https://patrimoniubanat.ro",
        "featured_on_home": False,
        "sort_order": 4,
        "status": "published",
    },
    {
        "id": "mz-pa-5",
        "tenant_id": TENANT_ID,
        "slug": "primaria-timisoara",
        "name": "Primăria Timișoara",
        "tier": "Sponsor",
        "logo": "PT",
        "description": "Partener în promovarea muzeului ca destinație culturală a orașului Timișoara.",
        "website": "https://primariatm.ro",
        "featured_on_home": False,
        "sort_order": 5,
        "status": "published",
    },
]

# Gallery
GALLERY: list[dict[str, Any]] = [
    {"id": "mz-g-1", "tenant_id": TENANT_ID, "src": VILLAGE, "alt": "Case tradiționale bănățene în Muzeul Satului", "category": "Tradiții", "span": "wide", "sort_order": 0},
    {"id": "mz-g-2", "tenant_id": TENANT_ID, "src": CRAFTS, "alt": "Obiecte de meșteșug expuse la muzeu", "category": "Ateliere", "span": "tall", "sort_order": 1},
    {"id": "mz-g-3", "tenant_id": TENANT_ID, "src": WEAVING, "alt": "Textile și țesături din colecția muzeului", "category": "Tradiții", "span": "normal", "sort_order": 2},
    {"id": "mz-g-4", "tenant_id": TENANT_ID, "src": POTTERY, "alt": "Ceramică smălțuită de Banat", "category": "Ateliere", "span": "wide", "sort_order": 3},
    {"id": "mz-g-5", "tenant_id": TENANT_ID, "src": FOLK, "alt": "Ansamblu folcloric la Ziua Muzeului", "category": "Tradiții", "span": "normal", "sort_order": 4},
    {"id": "mz-g-6", "tenant_id": TENANT_ID, "src": FOREST, "alt": "Biserica de lemn în Pădurea Verde", "category": "Turism", "span": "tall", "sort_order": 5},
    {"id": "mz-g-7", "tenant_id": TENANT_ID, "src": CHILDREN, "alt": "Copii la atelierul de olărit", "category": "Ateliere", "span": "normal", "sort_order": 6},
    {"id": "mz-g-8", "tenant_id": TENANT_ID, "src": BREAD, "alt": "Pâine coaptă pe vatră la muzeu", "category": "Gastronomie", "span": "normal", "sort_order": 7},
    {"id": "mz-g-9", "tenant_id": TENANT_ID, "src": MARKET, "alt": "Târg de meșteșuguri în poiana muzeului", "category": "Tradiții", "span": "normal", "sort_order": 8},
    {"id": "mz-g-10", "tenant_id": TENANT_ID, "src": AUTUMN, "alt": "Muzeul în culorile toamnei", "category": "Turism", "span": "wide", "sort_order": 9},
]

# Articles
ARTICLES: list[dict[str, Any]] = [
    {
        "id": "mz-ar-1",
        "tenant_id": TENANT_ID,
        "slug": "o-zi-la-muzeul-satului",
        "title": "O zi la Muzeul Satului",
        "excerpt": "Un mini-ghid pentru o vizită completă: de la casele de câmpie la biserica de lemn și atelierele vii.",
        "body": (
            "<p>Muzeul Satului Bănățean se vizitează cel mai bine pe îndelete, ca o plimbare "
            "printr-un sat de altădată. Iată cum poți profita de o zi întreagă în Pădurea Verde.</p>"
            "<h2>Dimineața</h2>"
            "<p>Începe cu casele din zona de câmpie și continuă spre gospodăria de munte, ca să "
            "vezi diferențele de arhitectură și de viață. Nu rata odaia curată, păstrată pentru "
            "sărbători.</p>"
            "<h2>După-amiaza</h2>"
            "<p>Oprește-te la atelierul de olărit pentru o demonstrație, apoi urcă spre biserica "
            "de lemn. Închide ziua în poiana evenimentelor, mai ales dacă prinzi un târg de "
            "meșteșuguri.</p>"
        ),
        "category": "Ghid",
        "author": "Echipa Muzeului",
        "date": "2026-04-20",
        "reading_minutes": 5,
        "cover_image": VILLAGE,
        "featured": True,
        "status": "published",
        "sort_order": 0,
    },
    {
        "id": "mz-ar-2",
        "tenant_id": TENANT_ID,
        "slug": "portul-popular-banatean",
        "title": "Portul popular bănățean",
        "excerpt": "Ia, catrința și costumul de sărbătoare — cum spunea portul din ce sat vii și cine ești.",
        "body": (
            "<p>În Banat, portul popular era un fel de carte de identitate țesută. Croiul, "
            "culorile și motivele spuneau din ce zonă venea purtătorul și la ce sărbătoare era.</p>"
            "<h2>Ia și catrința</h2>"
            "<p>Ia se cosea manual, luni de-a rândul, cu fir și mărgele. Catrința, țesută la "
            "război, o completa cu dungi și fir metalic. Împreună, ele alcătuiau ținuta de "
            "sărbătoare a femeii.</p>"
            "<blockquote>Un costum de sărbătoare putea cere un an întreg de muncă.</blockquote>"
            "<p>Colecția de textile a muzeului păstrează piese din toate zonele etnografice ale "
            "Banatului.</p>"
        ),
        "category": "Regiuni",
        "author": "Dr. Elena Munteanu",
        "date": "2026-05-10",
        "reading_minutes": 6,
        "cover_image": WEAVING,
        "featured": True,
        "status": "published",
        "sort_order": 1,
    },
    {
        "id": "mz-ar-3",
        "tenant_id": TENANT_ID,
        "slug": "mestesuguri-care-nu-se-sting",
        "title": "Meșteșuguri care nu se sting",
        "excerpt": "Olăritul, țesutul și fierăria, ținute vii de meșterii care lucrează în atelierele muzeului.",
        "body": (
            "<p>Un muzeu în aer liber nu este doar o colecție de obiecte, ci un loc unde "
            "meșteșugurile continuă să trăiască. La Muzeul Satului Bănățean, atelierele nu sunt "
            "goale.</p>"
            "<h2>Mâini care știu</h2>"
            "<p>Olarul modelează lutul la roată, țesătoarea trece suveica prin război, iar "
            "fierarul înroșește metalul la foc. La demonstrații, vizitatorii nu doar privesc, ci "
            "pot pune și ei mâna pe meșteșug.</p>"
            "<p>Așa, gesturile vechi de sute de ani trec mai departe, din mâinile meșterilor în "
            "ale copiilor care vin la ateliere.</p>"
        ),
        "category": "Producători",
        "author": "Ovidiu Sârbu",
        "date": "2026-06-25",
        "reading_minutes": 5,
        "cover_image": CRAFTS,
        "featured": False,
        "status": "published",
        "sort_order": 2,
    },
    {
        "id": "mz-ar-4",
        "tenant_id": TENANT_ID,
        "slug": "povestile-caselor",
        "title": "Poveștile caselor",
        "excerpt": "Fiecare casă din muzeu a fost strămutată grindă cu grindă. Iată câteva dintre poveștile lor.",
        "body": (
            "<p>Casele muzeului nu au fost construite aici. Ele au fost aduse din satele "
            "Banatului, demontate grindă cu grindă și reasamblate în Pădurea Verde, cu tot cu "
            "poveștile lor.</p>"
            "<h2>Grindă cu grindă</h2>"
            "<p>Fiecare bârnă a fost numerotată, transportată și așezată exact la locul ei. "
            "Restauratorii au refăcut acoperișurile de șindrilă și pereții văruiți, păstrând cât "
            "mai mult din materialul original.</p>"
            "<blockquote>O casă strămutată își aduce cu ea nu doar lemnul, ci și amintirile.</blockquote>"
            "<p>Biserica de lemn din Bârsa este cel mai impresionant exemplu al acestei munci de "
            "salvare a patrimoniului.</p>"
        ),
        "category": "Regiuni",
        "author": "Echipa Muzeului",
        "date": "2026-07-18",
        "reading_minutes": 4,
        "cover_image": FOREST,
        "featured": False,
        "status": "published",
        "sort_order": 3,
    },
]

# Contact messages
CONTACT_MESSAGES: list[dict[str, Any]] = [
    {
        "id": "mz-cm-1",
        "tenant_id": TENANT_ID,
        "name": "Ioana Petrescu",
        "email": "ioana.p@example.com",
        "subject": "Vizită cu grupul de elevi",
        "message": "Bună ziua! Aș dori să organizez o vizită ghidată pentru o clasă de 25 de elevi. Aveți ateliere pentru copii disponibile într-o zi de miercuri?",
        "date": "2026-04-15",
        "read": False,
    },
    {
        "id": "mz-cm-2",
        "tenant_id": TENANT_ID,
        "name": "Marius Olaru",
        "email": "marius.o@example.com",
        "subject": "Program de vizitare",
        "message": "Care este programul de vizitare în weekend și cât costă biletul de intrare pentru o familie? Mulțumesc!",
        "date": "2026-05-02",
        "read": True,
    },
]

# Newsletter subscribers
NEWSLETTER: list[dict[str, Any]] = [
    {"id": "mz-ns-1", "tenant_id": TENANT_ID, "email": "adriana.lupu@example.com", "date": "2026-03-12", "source": "Homepage"},
    {"id": "mz-ns-2", "tenant_id": TENANT_ID, "email": "george.stan@example.com", "date": "2026-04-01", "source": "Articol"},
    {"id": "mz-ns-3", "tenant_id": TENANT_ID, "email": "carmen.vasile@example.com", "date": "2026-05-20", "source": "Contact"},
]

# Media assets (optional stock rows for this tenant)
MEDIA: list[dict[str, Any]] = [
    {"id": "mz-md-village", "tenant_id": TENANT_ID, "url": VILLAGE, "alt": "Village", "filename": "village.jpg", "content_type": "image/jpeg", "size": 0, "is_stock": True},
    {"id": "mz-md-crafts", "tenant_id": TENANT_ID, "url": CRAFTS, "alt": "Crafts", "filename": "crafts.jpg", "content_type": "image/jpeg", "size": 0, "is_stock": True},
    {"id": "mz-md-weaving", "tenant_id": TENANT_ID, "url": WEAVING, "alt": "Weaving", "filename": "weaving.jpg", "content_type": "image/jpeg", "size": 0, "is_stock": True},
    {"id": "mz-md-pottery", "tenant_id": TENANT_ID, "url": POTTERY, "alt": "Pottery", "filename": "pottery.jpg", "content_type": "image/jpeg", "size": 0, "is_stock": True},
    {"id": "mz-md-folk", "tenant_id": TENANT_ID, "url": FOLK, "alt": "Folk", "filename": "folk.jpg", "content_type": "image/jpeg", "size": 0, "is_stock": True},
    {"id": "mz-md-forest", "tenant_id": TENANT_ID, "url": FOREST, "alt": "Forest", "filename": "forest.jpg", "content_type": "image/jpeg", "size": 0, "is_stock": True},
]


def _wipe_museum(session: Session, tenant_id: str = TENANT_ID) -> None:
    """Delete all content, media and the tenant row for the museum tenant."""
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


def run_museum_seed(session: Session, *, force: bool = False) -> None:
    """Insert the Muzeul Satului Bănățean museum demo data.

    Idempotent: if the tenant already exists and not force, return; if force,
    wipe it first. Mirrors the insert order / flush discipline of `run_seed`.
    """
    existing = session.get(Tenant, TENANT_ID)
    if existing and not force:
        return
    if existing and force:
        _wipe_museum(session, TENANT_ID)

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
