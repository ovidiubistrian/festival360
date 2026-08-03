/**
 * Central image pool for the PRISPA demo.
 *
 * All public imagery references these constants, so swapping the demo Unsplash
 * photos for real festival photos means editing THIS FILE ONLY (or dropping
 * files into /public/images and pointing the constants there).
 */

function u(id: string, w = 1200): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
}

export const IMG = {
  // Hero / festival atmosphere
  hero: u("1533174072545-7a4b6ad7a6c3", 2000),
  heroAlt: u("1470229722913-7c0e2dbbafd3", 2000),
  festivalCrowd: u("1524368535928-5b5e00ddc76b", 1600),
  aboutCollage: u("1528605248644-14dd04022da1", 1400),

  // Gastronomy
  foodSpread: u("1504674900247-0877df9cc836"),
  dish: u("1414235077428-338989a2e8c0"),
  cheese: u("1486297678162-eb2a19b0a32d"),
  cheeseBoard: u("1452195100486-9cc805987862"),
  bread: u("1509440159596-0249088772ff"),
  breadLoaves: u("1476718406336-bb5a9690ee2a"),
  honey: u("1587049352846-4a222e784d38"),
  honeyJars: u("1558642452-9d2a7deb7f62"),
  jam: u("1600271886742-f049cd451bba"),
  preserves: u("1524594152303-9fd13543fe6e"),
  wine: u("1510812431401-41d2bd2722f3"),
  smoked: u("1467003909585-2f8a72700288"),
  market: u("1488459716781-31db52582fe9"),

  // Crafts
  pottery: u("1565193566173-7a0ee3dbe261"),
  ceramics: u("1610701596007-11502861dcfa"),
  weaving: u("1528795259021-d8c86e14354c"),
  crafts: u("1513519245088-0e12902e35ca"),

  // Nature / mountains (Carpați / Banat Montan)
  mountainLake: u("1506905925346-21bda4d32df4", 1600),
  mountains: u("1464822759023-fed622ff2c3b", 1600),
  forest: u("1441974231531-c6227db76b6e", 1600),
  valley: u("1454391304352-2bf4678b1a7a", 1600),
  peaks: u("1519681393784-d120267933ba", 1600),
  village: u("1500534623283-312aade485b7", 1600),
  meadow: u("1470252649378-9c29740c9fa8", 1600),
  river: u("1439066615861-d1af74d74000", 1600),
  autumn: u("1508615039623-a25605d2b022", 1600),

  // Music / community
  concert: u("1533174072545-7a4b6ad7a6c3", 1400),
  concertLights: u("1470229722913-7c0e2dbbafd3", 1400),
  folk: u("1533928298208-27ff66555d8d", 1400),
  children: u("1541692641319-981cc79ee10a", 1400),
  workshop: u("1452860606245-08befc0ff44b", 1400),
} as const;

export type ImageKey = keyof typeof IMG;
