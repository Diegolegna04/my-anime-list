import { currentSeason, uniqueByMalId } from './anime-utils';

describe('anime-utils', () => {
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
});
