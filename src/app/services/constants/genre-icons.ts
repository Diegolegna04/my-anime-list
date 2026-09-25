// Icona Font Awesome (solid) per ogni genere di MyAnimeList (id Jikan).
// I nomi sono quelli compatibili con Font Awesome 6.0.0-beta3 caricato in index.html.
export const GENRE_ICONS: { [key: number]: string } = {
  // Generi
  1: 'fist-raised',       // Action
  2: 'compass',           // Adventure
  5: 'shapes',            // Avant Garde
  46: 'trophy',           // Award Winning
  28: 'mars-double',      // Boys Love
  4: 'laugh-squint',      // Comedy
  8: 'theater-masks',     // Drama
  10: 'hat-wizard',       // Fantasy
  26: 'venus-double',     // Girls Love
  47: 'utensils',         // Gourmet
  14: 'skull',            // Horror
  7: 'user-secret',       // Mystery
  22: 'heart',            // Romance
  24: 'atom',             // Sci-Fi
  36: 'coffee',           // Slice of Life
  30: 'running',          // Sports
  37: 'ghost',            // Supernatural
  41: 'hourglass-half',   // Suspense
  // Espliciti
  9: 'kiss-wink-heart',   // Ecchi
  49: 'fire',             // Erotica
  12: 'eye-slash',        // Hentai
  // Temi
  50: 'user-tie',         // Adult Cast
  51: 'paw',              // Anthropomorphic
  52: 'smile-beam',       // CGDCT
  53: 'baby',             // Childcare
  54: 'hand-rock',        // Combat Sports
  81: 'tshirt',           // Crossdressing
  55: 'user-ninja',       // Delinquents
  39: 'search',           // Detective
  56: 'graduation-cap',   // Educational
  57: 'grin-squint-tears',// Gag Humor
  58: 'tint',             // Gore
  35: 'users',            // Harem
  59: 'dice',             // High Stakes Game
  13: 'landmark',         // Historical
  60: 'microphone',       // Idols (Female)
  61: 'microphone-alt',   // Idols (Male)
  62: 'door-open',        // Isekai
  63: 'leaf',             // Iyashikei
  64: 'heart-broken',     // Love Polygon
  65: 'exchange-alt',     // Magical Sex Shift
  66: 'magic',            // Mahou Shoujo
  17: 'yin-yang',         // Martial Arts
  18: 'robot',            // Mecha
  67: 'stethoscope',      // Medical
  38: 'fighter-jet',      // Military
  19: 'music',            // Music
  6: 'dragon',            // Mythology
  68: 'mask',             // Organized Crime
  69: 'book-open',        // Otaku Culture
  20: 'grin-tongue-wink', // Parody
  70: 'ticket-alt',       // Performing Arts
  71: 'dog',              // Pets
  40: 'brain',            // Psychological
  3: 'flag-checkered',    // Racing
  72: 'sync-alt',         // Reincarnation
  73: 'user-friends',     // Reverse Harem
  74: 'pause',            // Love Status Quo
  21: 'torii-gate',       // Samurai
  23: 'school',           // School
  75: 'film',             // Showbiz
  29: 'rocket',           // Space
  11: 'chess',            // Strategy Game
  31: 'bolt',             // Super Power
  76: 'campground',       // Survival
  77: 'futbol',           // Team Sports
  78: 'history',          // Time Travel
  32: 'moon',             // Vampire
  79: 'gamepad',          // Video Game
  80: 'palette',          // Visual Arts
  48: 'briefcase',        // Workplace
  82: 'city',             // Urban Fantasy
  83: 'crown',            // Villainess
  // Demografie
  43: 'female',           // Josei
  15: 'child',            // Kids
  42: 'male',             // Seinen
  25: 'gem',              // Shoujo
  27: 'shield-alt'        // Shounen
};

/** Classe completa dell'icona, con un'etichetta generica per generi nuovi non ancora mappati */
export function getGenreIcon(genreId: number): string {
  return `fas fa-${GENRE_ICONS[genreId] ?? 'tag'}`;
}
