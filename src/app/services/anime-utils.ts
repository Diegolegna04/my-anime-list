/**
 * Toglie gli anime ripetuti tenendo la prima occorrenza.
 * Jikan in /seasons/now restituisce alcuni anime due volte nella stessa
 * pagina (es. "Grand Blue Season 3"), e le pagine successive possono
 * ripetere voci di quelle precedenti.
 */
export function uniqueByMalId<T extends { mal_id: number }>(list: T[]): T[] {
  const seen = new Set<number>();
  return list.filter(anime => {
    if (seen.has(anime.mal_id)) return false;
    seen.add(anime.mal_id);
    return true;
  });
}

/** Stagione corrente: gen-mar inverno, apr-giu primavera, lug-set estate, ott-dic autunno */
export function currentSeason(date: Date = new Date()): { season: string; year: number } {
  const month = date.getMonth() + 1;
  const season = month <= 3 ? 'winter' : month <= 6 ? 'spring' : month <= 9 ? 'summer' : 'fall';
  return { season, year: date.getFullYear() };
}
