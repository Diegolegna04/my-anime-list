import {
  cleanSynopsis,
  currentSeason,
  fallbackSeasonStarted,
  hasAnnouncedTitles,
  isSeasonStarted,
  nextSeason,
  previousSeason,
  seasonLabel,
  seasonOfList,
  seasonSlug,
  seasonTransition,
  sortSeasonalForHome,
  uniqueByMalId
} from './anime-utils';

/** I 10 TV/ONA più popolari dell'autunno 2026 secondo AniList (dati del 1/10/2026) */
const FALL_2026 = [
  { mal_id: 1, title: 'Kusuriya no Hitorigoto 3rd Season', type: 'TV', members: 76406, from: '2026-10-02' },
  { mal_id: 2, title: 'Cyberpunk: Edgerunners 2', type: 'ONA', members: 69486, from: '2026-10-20' },
  { mal_id: 3, title: 'Black Clover 2nd Season', type: 'TV', members: 66766, from: '2026-10-03' },
  { mal_id: 4, title: 'Tensei Shitara Ken Deshita 2nd Season', type: 'ONA', members: 39739, from: '2026-10-01' },
  { mal_id: 5, title: 'Ao no Hako Season 2', type: 'TV', members: 36124, from: '2026-10-04' },
  { mal_id: 6, title: 'JoJo: Steel Ball Run 2nd & 3rd STAGE', type: 'ONA', members: 33139, from: '2026-09-25' },
  { mal_id: 7, title: 'Tokyo Revengers: Santen Sensou-hen', type: 'TV', members: 25129, from: '2026-10-03' },
  { mal_id: 8, title: 'Koori no Jouheki 2nd Season', type: 'TV', members: 22605, from: '2026-10-01' },
  { mal_id: 9, title: 'Kikansha no Mahou wa Tokubetsu desu 2nd Season', type: 'TV', members: 21280, from: '2026-10-08' },
  { mal_id: 10, title: 'Tantei wa mou, Shindeiru. Season 2', type: 'TV', members: 21131, from: '2026-10-07' }
].map(({ from, ...anime }) => ({ ...anime, aired: { from: `${from}T00:00:00+00:00` } }));

describe('anime-utils', () => {
  describe('cleanSynopsis', () => {
    it('toglie i tag HTML delle descrizioni AniList tenendo gli a capo', () => {
      // Com'è davvero la descrizione di Death Note che arriva da AniList
      const raw = 'A notepad called a <i>Death Note</i>. Should anyone hold such power?<br>\n<br>\n'
        + 'The consequences will set the world ablaze.<br>\n<br>\n(Source: VIZ Media)';
      expect(cleanSynopsis(raw)).toBe('A notepad called a Death Note. Should anyone hold such power?\n\n'
        + 'The consequences will set the world ablaze.\n\n(Source: VIZ Media)');
    });

    it('gestisce <br/>, maiuscole ed entità', () => {
      expect(cleanSynopsis('<b>Uno</b><br/>due<BR />')).toBe('Uno\ndue');
      expect(cleanSynopsis('Tom &amp; Jerry &quot;vs&quot; l&#039;altro')).toBe('Tom & Jerry "vs" l\'altro');
    });

    it('lascia invariate le sinossi di Jikan', () => {
      const jikan = 'During their decade-long quest...\n\nDecades later, Frieren returns.\n\n[Written by MAL Rewrite]';
      expect(cleanSynopsis(jikan)).toBe(jikan);
      expect(cleanSynopsis(null)).toBeNull();
    });
  });

  it('toglie gli anime ripetuti tenendo il primo', () => {
    const list = [
      { mal_id: 1, title: 'Grand Blue Season 3' },
      { mal_id: 2, title: 'Altro' },
      { mal_id: 1, title: 'Grand Blue Season 3 (doppione)' }
    ];
    expect(uniqueByMalId(list).map(a => a.title)).toEqual(['Grand Blue Season 3', 'Altro']);
  });

  it('calcola la stagione corrente', () => {
    expect(currentSeason(new Date(2026, 0, 10))).toEqual({ season: 'winter', year: 2026 });
    expect(currentSeason(new Date(2026, 5, 30))).toEqual({ season: 'spring', year: 2026 });
    expect(currentSeason(new Date(2026, 8, 25))).toEqual({ season: 'summer', year: 2026 });
    expect(currentSeason(new Date(2026, 11, 1))).toEqual({ season: 'fall', year: 2026 });
  });

  it('stagione precedente e successiva, anche a cavallo dell\'anno', () => {
    expect(previousSeason({ season: 'winter', year: 2027 })).toEqual({ season: 'fall', year: 2026 });
    expect(previousSeason({ season: 'fall', year: 2026 })).toEqual({ season: 'summer', year: 2026 });
    expect(nextSeason({ season: 'fall', year: 2026 })).toEqual({ season: 'winter', year: 2027 });
    expect(nextSeason({ season: 'spring', year: 2026 })).toEqual({ season: 'summer', year: 2026 });
  });

  it('slug ed etichetta', () => {
    expect(seasonSlug({ season: 'fall', year: 2026 })).toBe('fall-2026');
    expect(seasonLabel({ season: 'fall', year: 2026 })).toBe('Autunno 2026');
    expect(seasonLabel({ season: 'summer', year: 2026 })).toBe('Estate 2026');
  });

  describe('finestra di cambio stagione', () => {
    const fall = { incoming: { season: 'fall', year: 2026 }, outgoing: { season: 'summer', year: 2026 } };

    it('dal 20 dell\'ultimo mese al 14 del primo', () => {
      expect(seasonTransition(new Date(2026, 8, 19))).toBeNull();
      expect(seasonTransition(new Date(2026, 8, 20))).toEqual(fall);
      expect(seasonTransition(new Date(2026, 9, 1))).toEqual(fall);
      expect(seasonTransition(new Date(2026, 9, 14))).toEqual(fall);
      expect(seasonTransition(new Date(2026, 9, 15))).toBeNull();
      expect(seasonTransition(new Date(2026, 10, 2))).toBeNull();
    });

    it('a cavallo dell\'anno', () => {
      const winter = { incoming: { season: 'winter', year: 2027 }, outgoing: { season: 'fall', year: 2026 } };
      expect(seasonTransition(new Date(2026, 11, 28))).toEqual(winter);
      expect(seasonTransition(new Date(2027, 0, 3))).toEqual(winter);
    });

    it('senza dati la stagione nuova parte dal giorno 5', () => {
      expect(fallbackSeasonStarted(new Date(2026, 8, 28))).toBeFalse();
      expect(fallbackSeasonStarted(new Date(2026, 9, 4))).toBeFalse();
      expect(fallbackSeasonStarted(new Date(2026, 9, 5))).toBeTrue();
    });
  });

  describe('isSeasonStarted', () => {
    it('autunno 2026: il 1/10 non è ancora partito, il 2/10 con "Il monologo della speziale" sì', () => {
      expect(isSeasonStarted(FALL_2026, new Date(2026, 8, 28))).toBeFalse();
      expect(isSeasonStarted(FALL_2026, new Date(2026, 9, 1))).toBeFalse();
      expect(isSeasonStarted(FALL_2026, new Date(2026, 9, 2))).toBeTrue();
    });

    it('senza members usa la posizione nella lista (già ordinata per popolarità)', () => {
      const noMembers = FALL_2026.map(({ members, ...anime }) => anime);
      expect(isSeasonStarted(noMembers, new Date(2026, 9, 1))).toBeFalse();
      expect(isSeasonStarted(noMembers, new Date(2026, 9, 2))).toBeTrue();
    });

    it('ignora film e special e liste vuote', () => {
      const movie = { mal_id: 99, type: 'Movie', members: 999999, aired: { from: '2026-09-01T00:00:00+00:00' } };
      expect(isSeasonStarted([movie, ...FALL_2026], new Date(2026, 9, 1))).toBeFalse();
      expect(isSeasonStarted([], new Date(2026, 9, 10))).toBeFalse();
    });
  });

  it('stagione apribile solo con abbastanza titoli annunciati', () => {
    expect(hasAnnouncedTitles(FALL_2026)).toBeTrue();
    expect(hasAnnouncedTitles(FALL_2026.slice(0, 4))).toBeFalse();
    expect(hasAnnouncedTitles([])).toBeFalse();
  });

  it('riconosce di che stagione è una lista', () => {
    const summer = [
      { season: 'summer', year: 2026 },
      { season: 'summer', year: 2026 },
      { season: null, year: null },
      { season: 'spring', year: 2026 }
    ];
    expect(seasonOfList(summer)).toEqual({ season: 'summer', year: 2026 });
    expect(seasonOfList([{ title: 'senza stagione' }])).toBeNull();
  });

  describe('ordine della stagione in home', () => {
    it('appena partita (pochi voti) ordina per popolarità e tiene chi non ha voto', () => {
      const list = [
        { mal_id: 1, members: 100, score: null },
        { mal_id: 2, members: 5000, score: null },
        { mal_id: 3, members: 300, score: 8.9 },
        { mal_id: 4, members: 2000, score: null }
      ];
      expect(sortSeasonalForHome(list).map(a => a.mal_id)).toEqual([2, 4, 3, 1]);
    });

    it('con i voti ordina per voto, chi non ha voto in coda per popolarità', () => {
      const list = [
        { mal_id: 1, members: 100, score: null },
        { mal_id: 2, members: 5000, score: 7.1 },
        { mal_id: 3, members: 300, score: 8.9 },
        { mal_id: 4, members: 2000, score: null },
        { mal_id: 5, members: 900, score: 7.5 }
      ];
      expect(sortSeasonalForHome(list).map(a => a.mal_id)).toEqual([3, 5, 2, 4, 1]);
    });
  });
});
