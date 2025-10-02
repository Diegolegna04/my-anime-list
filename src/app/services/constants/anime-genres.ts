export const ANIME_GENRES: { [key: number]: string } = {
  1: 'Action',
  2: 'Adventure',
  3: 'Racing',
  4: 'Comedy',
  5: 'Avant Garde',
  6: 'Mythology',
  7: 'Mystery',
  8: 'Drama',
  9: 'Ecchi',
  10: 'Fantasy',
  11: 'Strategy Game',
  12: 'Hentai',
  13: 'Historical',
  14: 'Horror',
  15: 'Kids',
  16: 'Martial Arts',
  17: 'Mecha',
  18: 'Music',
  19: 'Parody',
  20: 'Samurai',
  21: 'School',
  22: 'Romance',
  23: 'Shounen Ai',
  24: 'Sci-Fi',
  25: 'Shoujo',
  26: 'Shoujo Ai',
  27: 'Shounen',
  28: 'Space',
  29: 'Thriller',
  30: 'Sports',
  31: 'Super Power',
  32: 'Vampire',
  33: 'Yaoi',
  34: 'Yuri',
  35: 'Harem',
  36: 'Slice of Life',
  37: 'Supernatural',
  38: 'Military',
  39: 'Police',
  40: 'Psychological',
  41: 'Suspense',
  42: 'Seinen',
  43: 'Josei',
  44: 'Award Winning',
  45: 'Gourmet',
  46: 'Work Life',
  47: 'Organized Crime',
  48: 'Workplace',
  49: 'Erotica',
  50: 'Adult Cast',
  51: 'Anthropomorphic',
  52: 'CGDCT',
  53: 'Childcare',
  54: 'Combat Sports',
  55: 'Delinquents',
  56: 'Educational',
  57: 'GAG Humor',
  58: 'Gore',
  59: 'High Stakes Game',
  60: 'Idols (Female)',
  61: 'Idols (Male)',
  62: 'Isekai',
  63: 'Iyashikei',
  64: 'Love Polygon',
  65: 'Magical Sex Shift',
  66: 'Mahou Shoujo',
  67: 'Medical',
  68: 'Memoir',
  69: 'Otaku Culture',
  70: 'Performing Arts',
  71: 'Pets',
  72: 'Reincarnation',
  73: 'Reverse Harem',
  74: 'Romantic Subtext',
  75: 'Showbiz',
  76: 'Survival',
  77: 'Team Sports',
  78: 'Time Travel',
  79: 'Video Game',
  80: 'Visual Arts',
  81: 'Crossdressing'
};
  
/**
 * Restituisce il nome del genere dato il suo ID
 * @param id - L'ID del genere
 * @returns Il nome del genere o 'Sconosciuto' se non trovato
*/
export function getGenreName(id: number): string {
    return ANIME_GENRES[id] || 'Sconosciuto';
}
  
/**
 * Restituisce tutti gli ID dei generi disponibili
 * @returns Array di ID dei generi
*/
export function getGenreIds(): number[] {
  return Object.keys(ANIME_GENRES).map(id => parseInt(id, 10));
}
  
/**
 * Controlla se un ID genere è valido
 * @param id - L'ID del genere da controllare
 * @returns true se l'ID è valido, false altrimenti
*/
export function isValidGenreId(id: number): boolean {
  return id in ANIME_GENRES;
}