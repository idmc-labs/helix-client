import {
    generateExcerptIduText,
    generateIduText,
    formatSource,
    formatDateRange,
    getQuantifierText,
    numberToWordsLessThanTen,
    getLowestAdminLevel,
    GenerateIduTextInput,
} from './iduText';

const geo = (identifier: string, displayName: string) => ({ identifier, displayName });

const gov = [{ name: 'Ministry', organizationKind: { name: 'Government' } }];
const gov2 = [
    { name: 'A', organizationKind: { name: 'Government' } },
    { name: 'B', organizationKind: { name: 'Local Authority' } },
];
const media = [{ name: 'El Capital', organizationKind: { name: 'Media' } }];
const iom = [{ name: 'International Organization for Migration (IOM)' }];
const twoNamed = [{ name: 'the Red Cross' }, { name: 'UNHCR' }];
const threeNamed = [{ name: 'the Red Cross' }, { name: 'UNHCR' }, { name: 'IOM' }];

// term name -> description, mirroring the backend FIGURE_TERMS enum labels
const termOptions = [
    { name: 'EVACUATED', description: 'Evacuated' },
    { name: 'DISPLACED', description: 'Displaced' },
    { name: 'FORCED_TO_FLEE', description: 'Forced to flee' },
    { name: 'RELOCATED', description: 'Relocated' },
    { name: 'SHELTERED', description: 'Sheltered' },
    { name: 'IN_RELIEF_CAMP', description: 'In relief camp' },
    { name: 'DESTROYED_HOUSING', description: 'Destroyed housing' },
    { name: 'PARTIALLY_DESTROYED_HOUSING', description: 'Partially destroyed housing' },
    { name: 'UNINHABITABLE_HOUSING', description: 'Uninhabitable housing' },
    { name: 'HOMELESS', description: 'Homeless' },
    { name: 'AFFECTED', description: 'Affected' },
    { name: 'RETURNS', description: 'Returns' },
    { name: 'MULTIPLE_OR_OTHER', description: 'Multiple/Other' },
];

// cause helpers (real backend subtype ids)
const disaster = (id: string) => ({ figureCause: 'DISASTER', disasterSubType: id });
const conflict = (id: string) => ({ figureCause: 'CONFLICT', violenceSubType: id });
const other = (id: string) => ({ figureCause: 'OTHER', otherSubType: id });

interface Case {
    n: number;
    input: GenerateIduTextInput;
    expected: string;
}

const base = { termOptions };

const cases: Case[] = [
    { n: 1, input: { ...base, term: 'EVACUATED', unit: 'PERSON', reported: 8, quantifier: 'EXACT', geoLocations: [geo('ORIGIN', 'Komyshuvakha, Orikhiv Raion, Zaporizhia Oblast, Ukraine')], ...conflict('2'), sources: gov, startDate: '2026-06-12' }, expected: 'According to national authorities, eight people were evacuated in Komyshuvakha due to international armed conflict on June 12, 2026.' },
    { n: 2, input: { ...base, term: 'DISPLACED', unit: 'HOUSEHOLD', reported: 1156, quantifier: 'MORE_THAN_OR_EQUAL', geoLocations: [geo('ORIGIN', 'Mangochi, Southern Region, Malawi')], ...disaster('13'), sources: media, startDate: '2025-01-31', endDate: '2025-03-10' }, expected: 'According to media sources, at least 1,156 households were displaced in Mangochi due to flooding between January 31 and March 10, 2025.' },
    { n: 3, input: { ...base, term: 'FORCED_TO_FLEE', unit: 'PERSON', reported: 3, quantifier: 'APPROXIMATELY', geoLocations: [geo('ORIGIN', 'Kharkiv, Ukraine'), geo('DESTINATION', 'Poltava, Ukraine')], ...conflict('13'), sources: gov2, startDate: '2025-12-01', endDate: '2025-12-16' }, expected: 'According to local authorities, around three people were forced to flee from Kharkiv to Poltava due to communal violence between the 1st and 16th of December 2025.' },
    { n: 4, input: { ...base, term: 'RELOCATED', unit: 'HOUSEHOLD', reported: 12450, quantifier: 'LESS_THAN_OR_EQUAL', geoLocations: [geo('ORIGIN_AND_DESTINATION', 'Huambo, Angola')], ...disaster('15'), sources: iom, startDate: '2024-11-06', endDate: '2025-02-01' }, expected: 'According to International Organization for Migration (IOM), up to 12,450 households were relocated within Huambo due to a landslide between November 2024 and February 2025.' },
    { n: 5, input: { ...base, term: 'SHELTERED', unit: 'PERSON', reported: 1, quantifier: 'EXACT', geoLocations: [geo('ORIGIN', 'Kathmandu, Bagmati, Nepal')], ...disaster('1'), sources: [], startDate: '2025-10-01' }, expected: 'According to reported sources, one person was sheltered in Kathmandu due to an earthquake on October 1, 2025.' },
    { n: 6, input: { ...base, term: 'HOMELESS', unit: 'HOUSEHOLD', reported: 27, quantifier: 'MORE_THAN_OR_EQUAL', geoLocations: [geo('ORIGIN', 'Poza Rica, Veracruz, Mexico')], ...disaster('13'), sources: gov, startDate: '2025-10-01', endDate: '2025-10-10' }, expected: 'According to national authorities, at least 27 households were homeless in Poza Rica due to flooding between the 1st and 10th of October 2025.' },
    { n: 7, input: { ...base, term: 'AFFECTED', unit: 'PERSON', reported: 5, quantifier: 'APPROXIMATELY', geoLocations: [geo('ORIGIN', 'Gisuru, Burundi')], ...disaster('7'), sources: media, startDate: '2025-02-14', endDate: '2025-05-20' }, expected: 'According to media sources, around five people were affected in Gisuru due to a drought between February 14 and May 20, 2025.' },
    { n: 8, input: { ...base, term: 'IN_RELIEF_CAMP', unit: 'HOUSEHOLD', reported: 2, quantifier: 'LESS_THAN_OR_EQUAL', geoLocations: [geo('ORIGIN', 'Cox Bazar, Bangladesh')], ...disaster('13'), sources: gov2, startDate: '2025-07-04' }, expected: 'According to local authorities, up to two households were in a relief camp in Cox Bazar due to flooding on July 4, 2025.' },
    { n: 9, input: { ...base, term: 'RETURNS', unit: 'HOUSEHOLD', reported: 340, quantifier: 'MORE_THAN_OR_EQUAL', geoLocations: [geo('ORIGIN', 'Kharkiv, Ukraine'), geo('DESTINATION', 'Donetsk, Ukraine')], ...conflict('2'), sources: gov, startDate: '2025-03-01', endDate: '2025-09-15' }, expected: 'According to national authorities, at least 340 households returned from Kharkiv to Donetsk due to international armed conflict between March 1 and September 15, 2025.' },
    { n: 10, input: { ...base, term: 'RETURNS', unit: 'PERSON', reported: 1, quantifier: 'EXACT', geoLocations: [geo('ORIGIN', 'Aleppo, Syria')], ...disaster('13'), sources: media, startDate: '2025-05-01' }, expected: 'According to media sources, one person returned in Aleppo due to flooding on May 1, 2025.' },
    { n: 11, input: { ...base, term: 'MULTIPLE_OR_OTHER', unit: 'PERSON', reported: 60, quantifier: 'APPROXIMATELY', geoLocations: [geo('ORIGIN_AND_DESTINATION', 'Nairobi, Kenya')], ...other('1'), sources: iom, startDate: '2025-08-01', endDate: '2025-08-20' }, expected: 'According to International Organization for Migration (IOM), around 60 people were affected within Nairobi due to development between the 1st and 20th of August 2025.' },
    { n: 12, input: { ...base, term: 'DESTROYED_HOUSING', unit: 'HOUSEHOLD', reported: 156, quantifier: 'LESS_THAN_OR_EQUAL', geoLocations: [geo('ORIGIN', 'Huambo, Huambo, Angola')], ...disaster('13'), sources: gov, startDate: '2025-11-06', endDate: '2025-12-31' }, expected: 'According to national authorities, up to 156 houses were destroyed in Huambo due to flooding between November 6 and December 31, 2025.' },
    { n: 13, input: { ...base, term: 'DESTROYED_HOUSING', unit: 'PERSON', reported: 4, quantifier: 'MORE_THAN_OR_EQUAL', geoLocations: [geo('ORIGIN', 'Kathmandu, Nepal')], ...disaster('1'), sources: [], startDate: '2025-04-25' }, expected: 'According to reported sources, at least four people were affected as their housing was destroyed in Kathmandu due to an earthquake on April 25, 2025.' },
    { n: 14, input: { ...base, term: 'PARTIALLY_DESTROYED_HOUSING', unit: 'HOUSEHOLD', reported: 9, quantifier: 'EXACT', geoLocations: [geo('ORIGIN', 'Beira, Mozambique')], ...disaster('13'), sources: gov2, startDate: '2025-03-01', endDate: '2025-03-14' }, expected: 'According to local authorities, nine houses were partially destroyed in Beira due to flooding between the 1st and 14th of March 2025.' },
    { n: 15, input: { ...base, term: 'PARTIALLY_DESTROYED_HOUSING', unit: 'PERSON', reported: 210, quantifier: 'APPROXIMATELY', geoLocations: [geo('ORIGIN', 'Freetown, Sierra Leone')], ...disaster('15'), sources: media, startDate: '2024-08-14', endDate: '2025-01-10' }, expected: 'According to media sources, around 210 people were affected as their housing was partially destroyed in Freetown due to a landslide between August 2024 and January 2025.' },
    { n: 16, input: { ...base, term: 'UNINHABITABLE_HOUSING', unit: 'HOUSEHOLD', reported: 1, quantifier: 'LESS_THAN_OR_EQUAL', geoLocations: [geo('ORIGIN', 'Tacloban, Philippines')], ...disaster('13'), sources: gov, startDate: '2025-09-09' }, expected: 'According to national authorities, up to one house was made uninhabitable in Tacloban due to flooding on September 9, 2025.' },
    { n: 17, input: { ...base, term: 'UNINHABITABLE_HOUSING', unit: 'PERSON', reported: 33, quantifier: 'MORE_THAN_OR_EQUAL', geoLocations: [geo('ORIGIN_AND_DESTINATION', 'Manila, Philippines')], ...other('2'), sources: iom, startDate: '2025-06-01', endDate: '2025-06-30' }, expected: 'According to International Organization for Migration (IOM), at least 33 people were affected as their housing was rendered uninhabitable within Manila due to eviction between the 1st and 30th of June 2025.' },
    { n: 18, input: { ...base, term: 'DISPLACED', unit: 'PERSON', reported: 40, quantifier: 'EXACT', geoLocations: [geo('ORIGIN', 'Goma, North Kivu, DRC')], ...conflict('13'), sources: twoNamed, startDate: '2025-05-02' }, expected: 'According to the Red Cross and UNHCR, 40 people were displaced in Goma due to communal violence on May 2, 2025.' },
    { n: 19, input: { ...base, term: 'EVACUATED', unit: 'HOUSEHOLD', reported: 12, quantifier: 'APPROXIMATELY', geoLocations: [geo('ORIGIN', 'Tarawa, Kiribati')], ...disaster('24'), sources: threeNamed, startDate: '2025-02-11', endDate: '2025-02-13' }, expected: 'According to the Red Cross, UNHCR, and IOM, around 12 households were evacuated in Tarawa due to a tropical cyclone between the 11th and 13th of February 2025.' },
    { n: 20, input: { ...base, term: 'SHELTERED', unit: 'PERSON', reported: 1, quantifier: 'MORE_THAN_OR_EQUAL', geoLocations: [geo('ORIGIN', 'Lviv, Ukraine')], ...conflict('2'), sources: gov, startDate: '2026-01-15' }, expected: 'According to national authorities, at least one person was sheltered in Lviv due to international armed conflict on January 15, 2026.' },
    { n: 21, input: { ...base, term: 'RETURNS', unit: 'PERSON', reported: 500, quantifier: 'MORE_THAN_OR_EQUAL', geoLocations: [geo('ORIGIN', 'Mosul, Iraq'), geo('DESTINATION', 'Baghdad, Iraq')], ...conflict('2'), sources: gov, startDate: '2025-04-01', endDate: '2025-11-30' }, expected: 'According to national authorities, at least 500 people returned from Mosul to Baghdad due to international armed conflict between April 1 and November 30, 2025.' },
    { n: 22, input: { ...base, term: 'DISPLACED', unit: 'HOUSEHOLD', reported: 3, quantifier: 'EXACT', geoLocations: [geo('ORIGIN', 'Beira, Mozambique')], ...disaster('13'), sources: media, startDate: '2025-03-02', endDate: '2025-03-03' }, expected: 'According to media sources, three households were displaced in Beira due to flooding between the 2nd and 3rd of March 2025.' },
    { n: 23, input: { ...base, term: 'AFFECTED', unit: 'PERSON', reported: 7, quantifier: 'APPROXIMATELY', geoLocations: [geo('ORIGIN', 'Chennai, Tamil Nadu, India')], ...disaster('7'), sources: gov2, startDate: '2025-11-11', endDate: '2025-11-13' }, expected: 'According to local authorities, around seven people were affected in Chennai due to a drought between the 11th and 13th of November 2025.' },
    // incomplete-form behavior
    { n: 24, input: { ...base, term: 'DESTROYED_HOUSING', reported: 1, quantifier: 'EXACT', geoLocations: [geo('ORIGIN', 'Tacloban, Philippines')], ...disaster('13'), sources: gov, startDate: '2025-09-09' }, expected: 'According to national authorities, one (People or Household) was destroyed in Tacloban due to flooding on September 9, 2025.' },
    { n: 25, input: {}, expected: 'According to reported sources, (Quantifier) (Figure) (People or Household) were (Term) (Location) due to (Main trigger) (Date of Event DD/MM/YYY).' },
    // edge-case / regression checks
    { n: 26, input: { ...base, term: 'DISPLACED', unit: 'HOUSEHOLD', reported: 100, quantifier: 'MORE_THAN_OR_EQUAL', geoLocations: [geo('ORIGIN_AND_DESTINATION', 'Kyiv, Ukraine'), geo('ORIGIN_AND_DESTINATION', 'Lviv, Ukraine')], ...disaster('13'), sources: gov, startDate: '2025-07-04' }, expected: 'According to national authorities, at least 100 households were displaced within Kyiv and Lviv due to flooding on July 4, 2025.' },
    { n: 27, input: { ...base, term: 'DISPLACED', unit: 'HOUSEHOLD', reported: 100, quantifier: 'MORE_THAN_OR_EQUAL', geoLocations: [geo('ORIGIN', 'Springfield, Illinois'), geo('ORIGIN', 'Springfield, Ohio')], ...disaster('13'), sources: gov, startDate: '2025-07-04' }, expected: 'According to national authorities, at least 100 households were displaced in Springfield due to flooding on July 4, 2025.' },
    { n: 28, input: { ...base, term: 'DISPLACED', unit: 'HOUSEHOLD', reported: 100, quantifier: 'MORE_THAN_OR_EQUAL', geoLocations: [geo('ORIGIN', 'Kharkiv, Ukraine'), geo('ORIGIN', 'Poltava, Ukraine')], ...disaster('13'), sources: gov, startDate: '2025-07-04' }, expected: 'According to national authorities, at least 100 households were displaced in Kharkiv and Poltava due to flooding on July 4, 2025.' },
    { n: 29, input: { ...base, term: 'DISPLACED', unit: 'HOUSEHOLD', reported: 100, quantifier: 'MORE_THAN_OR_EQUAL', geoLocations: [geo('ORIGIN', 'Kharkiv, Ukraine')], ...disaster('13'), sources: gov, startDate: '2025-10-01', endDate: '2025-10-08' }, expected: 'According to national authorities, at least 100 households were displaced in Kharkiv due to flooding between the 1st and 8th of October 2025.' },
    { n: 30, input: { ...base, term: 'DISPLACED', unit: 'HOUSEHOLD', reported: 100, quantifier: 'MORE_THAN_OR_EQUAL', geoLocations: [geo('ORIGIN', 'Kharkiv, Ukraine'), geo('ORIGIN', 'Sumy, Ukraine'), geo('DESTINATION', 'Poltava, Ukraine'), geo('DESTINATION', 'Lviv, Ukraine')], ...disaster('13'), sources: gov, startDate: '2025-07-04' }, expected: 'According to national authorities, at least 100 households were displaced from Kharkiv and Sumy to Poltava and Lviv due to flooding on July 4, 2025.' },
    { n: 31, input: { ...base, term: 'DISPLACED', unit: 'HOUSEHOLD', reported: 100, quantifier: 'MORE_THAN_OR_EQUAL', geoLocations: [geo('ORIGIN', 'Beira, Mozambique')], ...disaster('13'), sources: [{ name: 'Ministry', organizationKind: { name: 'Government' } }, { name: 'El Capital', organizationKind: { name: 'Media' } }], startDate: '2025-07-04' }, expected: 'According to national authorities, at least 100 households were displaced in Beira due to flooding on July 4, 2025.' },
];

describe('generateExcerptIduText (all documented cases)', () => {
    it.each(cases)('case $n', ({ input, expected }) => {
        expect(generateExcerptIduText(input)).toBe(expected);
    });
});

describe('generateExcerptIduText (branch edges)', () => {
    it('figureCause set to DISASTER but subtype missing -> no cause text', () => {
        expect(generateExcerptIduText({ figureCause: 'DISASTER', reported: 5, unit: 'PERSON', term: 'DISPLACED', termOptions }))
            .toContain('due to (Main trigger)');
    });
    it('conflict cause branch', () => {
        expect(generateExcerptIduText({ ...base, ...conflict('7'), reported: 5, unit: 'PERSON', term: 'DISPLACED', sources: gov }))
            .toContain('due to non-international armed conflict');
    });
    it('housing term with unit unset uses household phrasing + placeholder unit', () => {
        expect(generateExcerptIduText({ term: 'DESTROYED_HOUSING', reported: 2, ...disaster('13'), sources: gov }))
            .toBe('According to national authorities, (Quantifier) two (People or Household) were destroyed (Location) due to flooding (Date of Event DD/MM/YYY).');
    });
    it('singular household with a non-housing term', () => {
        expect(generateExcerptIduText({ ...base, term: 'DISPLACED', unit: 'HOUSEHOLD', reported: 1, quantifier: 'EXACT', geoLocations: [geo('ORIGIN', 'Beira, Mozambique')], ...disaster('13'), sources: gov, startDate: '2025-07-04' }))
            .toBe('According to national authorities, one household was displaced in Beira due to flooding on July 4, 2025.');
    });
    it('term with no matching termOptions -> (Term) placeholder', () => {
        expect(generateExcerptIduText({ term: 'DISPLACED', reported: 2, termOptions: [], sources: gov, ...disaster('13') }))
            .toContain('were (Term)');
    });
});

describe('array cardinality (1 and 3 items)', () => {
    const frame: GenerateIduTextInput = {
        ...base,
        term: 'DISPLACED',
        unit: 'HOUSEHOLD',
        reported: 100,
        quantifier: 'MORE_THAN_OR_EQUAL',
        ...disaster('13'),
        sources: gov,
        startDate: '2025-07-04',
    };
    const line = (loc: string) => `According to national authorities, at least 100 households were displaced ${loc} due to flooding on July 4, 2025.`;

    it('1 origin', () => {
        expect(generateExcerptIduText({ ...frame, geoLocations: [geo('ORIGIN', 'Kharkiv, Ukraine')] }))
            .toBe(line('in Kharkiv'));
    });
    it('3 origins', () => {
        expect(generateExcerptIduText({ ...frame, geoLocations: [geo('ORIGIN', 'Kharkiv, Ukraine'), geo('ORIGIN', 'Poltava, Ukraine'), geo('ORIGIN', 'Sumy, Ukraine')] }))
            .toBe(line('in Kharkiv, Poltava, and Sumy'));
    });
    it('1 origin + 1 destination', () => {
        expect(generateExcerptIduText({ ...frame, geoLocations: [geo('ORIGIN', 'Kharkiv, Ukraine'), geo('DESTINATION', 'Lviv, Ukraine')] }))
            .toBe(line('from Kharkiv to Lviv'));
    });
    it('3 origins + 3 destinations', () => {
        expect(generateExcerptIduText({ ...frame, geoLocations: [geo('ORIGIN', 'Kharkiv, Ukraine'), geo('ORIGIN', 'Poltava, Ukraine'), geo('ORIGIN', 'Sumy, Ukraine'), geo('DESTINATION', 'Lviv, Ukraine'), geo('DESTINATION', 'Odesa, Ukraine'), geo('DESTINATION', 'Kyiv, Ukraine')] }))
            .toBe(line('from Kharkiv, Poltava, and Sumy to Lviv, Odesa, and Kyiv'));
    });
    it('1 origin-and-destination', () => {
        expect(generateExcerptIduText({ ...frame, geoLocations: [geo('ORIGIN_AND_DESTINATION', 'Kyiv, Ukraine')] }))
            .toBe(line('within Kyiv'));
    });
    it('3 origin-and-destinations', () => {
        expect(generateExcerptIduText({ ...frame, geoLocations: [geo('ORIGIN_AND_DESTINATION', 'Kyiv, Ukraine'), geo('ORIGIN_AND_DESTINATION', 'Lviv, Ukraine'), geo('ORIGIN_AND_DESTINATION', 'Odesa, Ukraine')] }))
            .toBe(line('within Kyiv, Lviv, and Odesa'));
    });
    it('1 source', () => {
        expect(generateExcerptIduText({ ...frame, geoLocations: [geo('ORIGIN', 'Beira, Mozambique')], sources: gov }))
            .toBe(line('in Beira'));
    });
    it('3 sources (oxford comma)', () => {
        expect(generateExcerptIduText({ ...frame, geoLocations: [geo('ORIGIN', 'Beira, Mozambique')], sources: threeNamed }))
            .toBe('According to the Red Cross, UNHCR, and IOM, at least 100 households were displaced in Beira due to flooding on July 4, 2025.');
    });
});

describe('formatSource', () => {
    it('empty -> reported sources', () => expect(formatSource([])).toBe('reported sources'));
    it('single authority -> national', () => expect(formatSource(gov)).toBe('national authorities'));
    it('two authorities -> local', () => expect(formatSource(gov2)).toBe('local authorities'));
    it('media -> media sources', () => expect(formatSource(media)).toBe('media sources'));
    it('one named', () => expect(formatSource(iom)).toBe('International Organization for Migration (IOM)'));
    it('two named', () => expect(formatSource(twoNamed)).toBe('the Red Cross and UNHCR'));
    it('three named (oxford comma)', () => expect(formatSource(threeNamed)).toBe('the Red Cross, UNHCR, and IOM'));
    it('non-empty but no usable name/kind -> reported sources', () => expect(formatSource([{ organizationKind: { name: 'Academia' } }])).toBe('reported sources'));
});

describe('formatDateRange', () => {
    it('no start -> undefined', () => expect(formatDateRange(undefined, undefined)).toBeUndefined());
    it('start only', () => expect(formatDateRange('2025-06-12')).toBe('on June 12, 2025'));
    it('same day (start === end)', () => expect(formatDateRange('2025-06-12', '2025-06-12')).toBe('on June 12, 2025'));
    it('same month', () => expect(formatDateRange('2025-12-01', '2025-12-16')).toBe('between the 1st and 16th of December 2025'));
    it('same year, different month', () => expect(formatDateRange('2025-01-31', '2025-03-10')).toBe('between January 31 and March 10, 2025'));
    it('different years', () => expect(formatDateRange('2024-11-06', '2025-02-01')).toBe('between November 2024 and February 2025'));
    it('same-weekday range is not collapsed', () => expect(formatDateRange('2025-10-01', '2025-10-08')).toBe('between the 1st and 8th of October 2025'));
    it('11th-13th ordinal special case', () => expect(formatDateRange('2025-11-11', '2025-11-13')).toBe('between the 11th and 13th of November 2025'));
});

describe('getQuantifierText', () => {
    it('undefined -> placeholder', () => expect(getQuantifierText(undefined)).toBe('(Quantifier)'));
    it('EXACT -> no text', () => expect(getQuantifierText('EXACT')).toBeUndefined());
    it('APPROXIMATELY', () => expect(getQuantifierText('APPROXIMATELY')).toBe('around'));
    it('MORE_THAN_OR_EQUAL', () => expect(getQuantifierText('MORE_THAN_OR_EQUAL')).toBe('at least'));
    it('LESS_THAN_OR_EQUAL', () => expect(getQuantifierText('LESS_THAN_OR_EQUAL')).toBe('up to'));
});

describe('numberToWordsLessThanTen', () => {
    it('undefined -> undefined', () => expect(numberToWordsLessThanTen(undefined)).toBeUndefined());
    it('null -> undefined', () => expect(numberToWordsLessThanTen(null as unknown as number)).toBeUndefined());
    it('below ten -> word', () => expect(numberToWordsLessThanTen(5)).toBe('five'));
    it('ten -> numeral', () => expect(numberToWordsLessThanTen(10)).toBe('10'));
    it('thousands separator', () => expect(numberToWordsLessThanTen(1500)).toBe('1,500'));
});

describe('getLowestAdminLevel', () => {
    it('undefined -> undefined', () => expect(getLowestAdminLevel(undefined)).toBeUndefined());
    it('empty -> undefined', () => expect(getLowestAdminLevel('')).toBeUndefined());
    it('no comma', () => expect(getLowestAdminLevel('Ukraine')).toBe('Ukraine'));
    it('takes first, trims', () => expect(getLowestAdminLevel(' Kyiv , Ukraine ')).toBe('Kyiv'));
});

describe('generateIduText (placeholders + verb)', () => {
    it('all placeholders including (Source Type)', () => {
        expect(generateIduText()).toBe('According to (Source Type), (Figure) (People or Household) were (Term) (Location) due to (Main trigger) (Date of Event DD/MM/YYY).');
    });
    it('singular verb was', () => {
        expect(generateIduText('flooding', undefined, 1, 'household', 'displaced', 'in X', 'on May 1, 2025', 'IOM')).toContain('one household was displaced');
    });
    it('omitVerb drops was/were', () => {
        expect(generateIduText('flooding', undefined, 3, 'people', 'returned', 'in X', 'on May 1, 2025', 'IOM', true)).toContain('three people returned in X');
    });
});
