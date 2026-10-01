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

export interface SeasonRef {
  season: string;
  year: number;
}

const SEASON_ORDER = ['winter', 'spring', 'summer', 'fall'];

/** Stagione del calendario: gen-mar inverno, apr-giu primavera, lug-set estate, ott-dic autunno */
export function currentSeason(date: Date = new Date()): SeasonRef {
  const month = date.getMonth() + 1;
  const season = month <= 3 ? 'winter' : month <= 6 ? 'spring' : month <= 9 ? 'summer' : 'fall';
  return { season, year: date.getFullYear() };
}

export function previousSeason({ season, year }: SeasonRef): SeasonRef {
  const index = SEASON_ORDER.indexOf(season);
  return index === 0
    ? { season: 'fall', year: year - 1 }
    : { season: SEASON_ORDER[index - 1], year };
}

export function nextSeason({ season, year }: SeasonRef): SeasonRef {
  const index = SEASON_ORDER.indexOf(season);
  return index === SEASON_ORDER.length - 1
    ? { season: 'winter', year: year + 1 }
    : { season: SEASON_ORDER[index + 1], year };
}

export function sameSeason(a: SeasonRef, b: SeasonRef): boolean {
  return a.season === b.season && a.year === b.year;
}

/** Parametro di rotta delle pagine stagionali, es. "fall-2026" */
export function seasonSlug({ season, year }: SeasonRef): string {
  return `${season}-${year}`;
}

/** Etichetta mostrata in home, es. "Fall 2026" */
export function seasonLabel({ season, year }: SeasonRef): string {
  return `${season.charAt(0).toUpperCase()}${season.slice(1)} ${year}`;
}

/** Data locale in formato YYYY-MM-DD, confrontabile con aired.from */
export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/*
 * Cambio di stagione in home.
 * Gli anime di una stagione non partono il primo del mese: escono sparsi nei
 * primi 10-15 giorni (a volte già negli ultimi giorni del mese prima). Per
 * non mostrare una stagione "vuota" si guarda quando escono davvero i titoli
 * più attesi.
 */

/** Dal 20 dell'ultimo mese di una stagione... */
export const TRANSITION_START_DAY = 20;
/** ...al 14 del primo mese della successiva; dal 15 vale sempre il calendario */
export const TRANSITION_END_DAY = 15;
/** Senza dati, nella finestra si passa alla stagione nuova da questo giorno */
export const FALLBACK_SWITCH_DAY = 5;
/** Quanti titoli più popolari della stagione nuova si guardano */
export const STARTED_TOP_N = 10;
/** Quota di popolarità (tra quei titoli) già uscita per considerarla iniziata */
export const STARTED_THRESHOLD = 1 / 3;

export interface SeasonTransition {
  incoming: SeasonRef;
  outgoing: SeasonRef;
}

/** Se today è nella finestra di cambio stagione dice quali sono le due stagioni, altrimenti null */
export function seasonTransition(today: Date): SeasonTransition | null {
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const calendar = currentSeason(today);
  const isFirstMonth = month % 3 === 1;
  const isLastMonth = month % 3 === 0;

  if (isFirstMonth && day < TRANSITION_END_DAY) {
    return { incoming: calendar, outgoing: previousSeason(calendar) };
  }
  if (isLastMonth && day >= TRANSITION_START_DAY) {
    return { incoming: nextSeason(calendar), outgoing: calendar };
  }
  return null;
}

/** Ripiego senza dati: nella finestra la stagione nuova parte dal giorno FALLBACK_SWITCH_DAY */
export function fallbackSeasonStarted(today: Date): boolean {
  return (today.getMonth() + 1) % 3 === 1 && today.getDate() >= FALLBACK_SWITCH_DAY;
}

/**
 * true se la stagione è "partita": tra i STARTED_TOP_N TV/ONA più popolari,
 * quelli già usciti (aired.from <= oggi) pesano almeno STARTED_THRESHOLD della
 * popolarità totale. Il peso è members (Jikan, o popularity di AniList tradotto
 * dal backend); se manca si usa la posizione nella lista, che arriva già
 * ordinata per popolarità.
 */
export function isSeasonStarted(list: any[], today: Date): boolean {
  const series = uniqueByMalId(list.filter(a => a?.type === 'TV' || a?.type === 'ONA'));
  const top = series
    .sort((a, b) => (b.members || 0) - (a.members || 0))
    .slice(0, STARTED_TOP_N);
  if (top.length === 0) return false;

  const hasMembers = top.every(a => a.members > 0);
  const todayIso = toIsoDate(today);
  let total = 0;
  let started = 0;

  top.forEach((anime, index) => {
    const weight = hasMembers ? anime.members : top.length - index;
    total += weight;
    const from: string | undefined = anime.aired?.from;
    if (from && from.slice(0, 10) <= todayIso) started += weight;
  });

  return started / total >= STARTED_THRESHOLD;
}

/**
 * Di che stagione è una lista di Jikan (o del fallback AniList), guardando la
 * maggioranza degli anime che hanno season/year. null se non lo dice nessuno.
 */
export function seasonOfList(list: any[]): SeasonRef | null {
  const counts = new Map<string, number>();
  for (const anime of list) {
    if (anime?.season && anime?.year) {
      const key = `${anime.season}-${anime.year}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  let best: string | null = null;
  counts.forEach((count, key) => {
    if (best === null || count > counts.get(best)!) best = key;
  });
  if (best === null) return null;
  const [season, year] = (best as string).split('-');
  return { season, year: Number(year) };
}

/** Quanti dei titoli più popolari servono con un voto per ordinare per voto */
const SCORE_SORT_TOP_N = 20;

/**
 * Ordine della stagione in home. Appena partita quasi nessun titolo nuovo ha
 * un voto: allora si ordina per popolarità; quando almeno metà dei più
 * popolari ha un voto si ordina per voto, con in coda i titoli senza voto.
 */
export function sortSeasonalForHome<T extends { mal_id: number; score?: number | null; members?: number }>(list: T[]): T[] {
  const byPopularity = uniqueByMalId(list).sort((a, b) => (b.members || 0) - (a.members || 0));
  const top = byPopularity.slice(0, SCORE_SORT_TOP_N);
  const scoredInTop = top.filter(a => (a.score || 0) > 0).length;
  if (scoredInTop < top.length / 2) return byPopularity;

  const scored = byPopularity.filter(a => (a.score || 0) > 0).sort((a, b) => b.score! - a.score!);
  const unscored = byPopularity.filter(a => !((a.score || 0) > 0));
  return [...scored, ...unscored];
}
