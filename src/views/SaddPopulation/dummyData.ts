// FIXME: dummy data until the SADD population API exists in helix-server
export type Sex = 'BOTH' | 'MALE' | 'FEMALE';
export type PopulationStatus = 'ACTIVE' | 'ARCHIVED' | 'ALL';

export interface SaddPopulation {
    id: string;
    iso3: string;
    countryName: string;
    year: number;
    sex: Sex;
    age0To4: number;
    age5To11: number;
    age12To17: number;
    age18To59: number;
    age60Plus: number;
    total: number;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
}

export const sexLabel: Record<Sex, string> = {
    BOTH: 'Both',
    MALE: 'Male',
    FEMALE: 'Female',
};

const countries = [
    { iso3: 'AFG', name: 'Afghanistan', base: 42_000_000 },
    { iso3: 'COD', name: 'Democratic Republic of the Congo', base: 102_000_000 },
    { iso3: 'NPL', name: 'Nepal', base: 30_000_000 },
    { iso3: 'SDN', name: 'Sudan', base: 48_000_000 },
    { iso3: 'UKR', name: 'Ukraine', base: 37_000_000 },
];
const years = [2021, 2022, 2023];
// Rough share of population per age group: 0-4, 5-11, 12-17, 18-59, 60+
const shares = [0.13, 0.17, 0.12, 0.5, 0.08];

function makeRow(
    country: typeof countries[number],
    year: number,
    sex: Sex,
    isActive: boolean,
    drift: number,
): SaddPopulation {
    const factor = (sex === 'BOTH' ? 1 : 0.5) * (1 + (year - 2021) * 0.02) * drift;
    const groups = shares.map((share) => Math.round(country.base * share * factor));
    return {
        id: `${country.iso3}-${year}-${sex}-${isActive ? 'active' : 'archived'}`,
        iso3: country.iso3,
        countryName: country.name,
        year,
        sex,
        age0To4: groups[0],
        age5To11: groups[1],
        age12To17: groups[2],
        age18To59: groups[3],
        age60Plus: groups[4],
        total: groups.reduce((acc, v) => acc + v, 0),
        isActive,
        createdBy: isActive ? 'Admin User' : 'Previous Admin',
        createdAt: isActive ? '2026-10-20T09:30:00Z' : '2025-11-02T14:10:00Z',
    };
}

const sexes: Sex[] = ['BOTH', 'MALE', 'FEMALE'];

export const dummyPopulations: SaddPopulation[] = [
    ...countries.flatMap((country) => years.flatMap((year) => sexes.map(
        (sex) => makeRow(country, year, sex, true, 1),
    ))),
    // Superseded values for a couple of rows, to show history
    ...sexes.map((sex) => makeRow(countries[0], 2023, sex, false, 0.97)),
    ...sexes.map((sex) => makeRow(countries[3], 2022, sex, false, 1.04)),
];
