// IDU (Internal Displacement Update) text generation.
// Extracted from FigureInput so the logic is unit-testable in isolation.
import { isDefined } from '@togglecorp/fujs';

import type { Figure_Terms as FigureTerms, Quantifier } from '#generated/types';

// Deterministic English number formatting (mirrors utils/common formatNumber for
// the no-options case) so this module stays self-contained and testable.
function formatNumber(n: number): string {
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: Math.abs(n) >= 1000 ? 0 : 2,
    }).format(n);
}

// Joins a list into English prose with an Oxford comma: [] -> "", [a] -> "a",
// [a, b] -> "a and b", [a, b, c] -> "a, b, and c". Used for both source names
// and locations so they read consistently.
function joinWithAnd(items: string[]): string {
    if (items.length === 0) {
        return '';
    }
    if (items.length === 1) {
        return items[0];
    }
    if (items.length === 2) {
        return `${items[0]} and ${items[1]}`;
    }
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

const quantifierMapping: Record<Quantifier, string | undefined> = {
    EXACT: undefined,
    APPROXIMATELY: 'around',
    MORE_THAN_OR_EQUAL: 'at least',
    LESS_THAN_OR_EQUAL: 'up to',
};

export function getQuantifierText(q: Quantifier | undefined) {
    // NOTE: When no quantifier is selected yet, show a placeholder (matching
    // the other field placeholders). EXACT intentionally emits no quantifier text.
    if (!q) {
        return '(Quantifier)';
    }
    return quantifierMapping[q];
}

function toOrdinal(n: number): string {
    const mod100 = n % 100;

    if (mod100 >= 11 && mod100 <= 13) {
        return `${n}th`;
    }
    if (n % 10 === 1) {
        return `${n}st`;
    }
    if (n % 10 === 2) {
        return `${n}nd`;
    }
    if (n % 10 === 3) {
        return `${n}rd`;
    }
    return `${n}th`;
}
export function formatDateRange(start?: string, end?: string) {
    if (!start) {
        return undefined;
    }

    const locale = 'en-US';
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : undefined;

    // NOTE: date-only strings ("YYYY-MM-DD") parse as UTC midnight, so all
    // component reads and formatting must use UTC to avoid a day-shift for
    // users in negative-offset timezones.
    const sameYear = isDefined(endDate) && startDate.getUTCFullYear() === endDate.getUTCFullYear();
    const sameMonth = isDefined(endDate) && sameYear
        && startDate.getUTCMonth() === endDate.getUTCMonth();
    const sameDay = isDefined(endDate) && sameYear && sameMonth
        && startDate.getUTCDate() === endDate.getUTCDate();

    const formatDay = (d: Date) => toOrdinal(d.getUTCDate());

    if (!endDate || sameDay) {
        return `on ${startDate.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
        })}`;
    }

    if (sameMonth) {
        return `between the ${formatDay(startDate)} and ${formatDay(endDate)} of ${startDate.toLocaleDateString(locale, {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
        })}`;
    }

    if (sameYear) {
        return `between ${startDate.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            timeZone: 'UTC',
        })} and ${endDate.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
        })}`;
    }

    // Cross-year: show full day, month, and year on both ends so the year is
    // unambiguous.
    return `between ${startDate.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    })} and ${endDate.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    })}`;
}
export function formatSource(sources: readonly {
    name?: string | null;
    organizationKind?: { name?: string | null } | null;
}[]) {
    const hasKind = (kind: string) => sources.some((s) => s.organizationKind?.name === kind);

    // Each source kind maps to one label; distinct labels are joined in a fixed
    // order (local, national, media, then named orgs) so the output is
    // deterministic regardless of how sources were entered.
    const labels: string[] = [];
    if (hasKind('Local Authority')) {
        labels.push('local authorities');
    }
    if (hasKind('Government')) {
        labels.push('national authorities');
    }
    if (hasKind('Media')) {
        labels.push('media sources');
    }

    // Any other kind (UN, NGOs, Disaster Authority, etc.) keeps its own name.
    const namedSources = sources
        .filter((s) => {
            const kind = s.organizationKind?.name;
            return kind !== 'Local Authority' && kind !== 'Government' && kind !== 'Media';
        })
        .map((s) => s.name)
        .filter(isDefined);
    labels.push(...new Set(namedSources));

    if (labels.length === 0) {
        return '(Source)';
    }
    return joinWithAnd(labels);
}

const hazardMapById: Record<string, {label: string; iduText: string}> = {
    1: {
        label: 'earthquake',
        iduText: 'an earthquake',
    },
    2: {
        label: 'tsunami',
        iduText: 'a tsunami',
    },
    3: {
        label: 'dry mass movement',
        iduText: 'dry mass movement',
    },
    4: {
        label: 'sinkhole',
        iduText: 'a sinkhole',
    },
    5: {
        label: 'volcanic activity',
        iduText: 'volcanic activity',
    },
    6: {
        label: 'desertification',
        iduText: 'desertification',
    },
    7: {
        label: 'drought',
        iduText: 'a drought',
    },
    8: {
        label: 'erosion',
        iduText: 'erosion',
    },
    9: {
        label: 'salinization',
        iduText: 'salinization',
    },
    10: {
        label: 'sea level rise',
        iduText: 'sea level rise',
    },
    11: {
        label: 'wildfire',
        iduText: 'a wildfire',
    },
    12: {
        label: 'dam release flood',
        iduText: 'flooding caused by a dam release',
    },
    13: {
        label: 'flood',
        iduText: 'flooding',
    },
    14: {
        label: 'avalanche',
        iduText: 'an avalanche',
    },
    15: {
        label: 'landslide/wet mass movement',
        iduText: 'a landslide',
    },
    16: {
        label: 'rogue wave',
        iduText: 'a rogue wave',
    },
    17: {
        label: 'cold wave',
        iduText: 'a cold wave',
    },
    18: {
        label: 'heat wave',
        iduText: 'a heat wave',
    },
    19: {
        label: 'hailstorm',
        iduText: 'a hailstorm',
    },
    20: {
        label: 'sand/dust storm',
        iduText: 'a sandstorm',
    },
    21: {
        label: 'storm',
        iduText: 'a storm',
    },
    22: {
        label: 'storm surge',
        iduText: 'storm surge',
    },
    23: {
        label: 'tornado',
        iduText: 'a tornado',
    },
    24: {
        label: 'typhoon/hurricane/cyclone',
        iduText: 'a tropical cyclone',
    },
    25: {
        label: 'winter storm/blizzard',
        iduText: 'a winter storm',
    },
    26: {
        label: 'mixed disasters',
        iduText: 'mixed disasters',
    },
};

const conflictMapById: Record<string, {label: string; iduText: string}> = {
    2: {
        label: 'International armed conflict',
        iduText: 'international armed conflict',
    },
    7: {
        label: 'Non-international armed conflict',
        iduText: 'non-international armed conflict',
    },
    11: {
        label: 'Civilian state violence',
        iduText: 'civilian state violence',
    },
    12: {
        label: 'Crime-related violence',
        iduText: 'crime-related violence',
    },
    13: {
        label: 'Communal violence',
        iduText: 'communal violence',
    },
    14: {
        label: 'Other',
        iduText: 'conflict',
    },
    17: {
        label: 'Unclear or unknown',
        iduText: 'conflict',
    },
};

const otherCrisisById : Record<string, {label: string; iduText: string}> = {
    1: {
        label: 'Development',
        iduText: 'development',
    },
    2: {
        label: 'Eviction',
        iduText: 'eviction',
    },
    3: {
        label: 'Technical Disaster',
        iduText: 'a technical disaster',
    },
};

// Housing-condition terms share one condition word across units: households read
// "houses were <condition>"; persons read "the housing of ... people were <condition>".
const housingConditionText: Partial<Record<FigureTerms, string>> = {
    DESTROYED_HOUSING: 'destroyed',
    PARTIALLY_DESTROYED_HOUSING: 'partially destroyed',
    UNINHABITABLE_HOUSING: 'rendered uninhabitable',
};

const termTextOverrides: Partial<Record<FigureTerms, string>> = {
    RETURNS: 'returned',
    IN_RELIEF_CAMP: 'in a relief camp',
    MULTIPLE_OR_OTHER: 'displaced',
    HOMELESS: 'rendered homeless',
};

export function numberToWordsLessThanTen(num?: number): string | undefined {
    if (num === undefined || num === null) {
        return undefined;
    }

    const words = [
        'zero', 'one', 'two', 'three', 'four',
        'five', 'six', 'seven', 'eight', 'nine',
    ];

    if (num >= 0 && num < 10) {
        return words[num];
    }

    return formatNumber(num);
}

export function getLowestAdminLevel(displayName: string | null | undefined) {
    if (!displayName) {
        return undefined;
    }
    return displayName.split(',')[0].trim();
}

export function generateIduText(
    mainTriggerInfo?: string | undefined | null,
    quantifierInfo?: string | undefined | null,
    totalFigure?: number | undefined,
    unitInfo?: string | undefined | null,
    termInfo?: string | undefined | null,
    locationInfo?: string | undefined | null,
    dateRangeInfo?: string | undefined | null,
    sourceTypeInfo?: string | undefined | null,
    // NOTE: some terms (e.g. Returns) carry their own verb, so the auxiliary
    // was/were must be dropped to avoid the passive "were returned".
    omitVerb?: boolean,
    // NOTE: person + housing terms prepend a subject, e.g. "the housing of".
    subjectPrefix?: string | undefined | null,
    // NOTE: Returns reads "... following <cause>"; everything else "... due to <cause>".
    causeConnector?: string,
) {
    const causeField = mainTriggerInfo || '(Main trigger)';
    const figureField = numberToWordsLessThanTen(totalFigure) ?? '(Figure)';
    const unitField = unitInfo || '(People or Household)';
    const termField = termInfo || '(Term)';
    const locationField = locationInfo || '(Location)';
    const dateRange = dateRangeInfo || '(Date of Event DD/MM/YYY)';
    const connector = causeConnector || 'due to';

    // With a subject prefix ("the housing of ...") the grammatical subject is
    // singular ("the housing"), so the verb is always "was" regardless of figure.
    const verb = subjectPrefix || totalFigure === 1 ? 'was' : 'were';
    // Same placeholder string as formatSource's no-source fallback, so an unset
    // source reads identically however this helper is reached.
    const sourceType = sourceTypeInfo || '(Source)';

    const body = [
        subjectPrefix,
        quantifierInfo,
        figureField,
        unitField,
        omitVerb ? undefined : verb,
        termField,
        locationField,
    ].filter(isDefined).join(' ');

    return `According to ${sourceType}, ${body} ${connector} ${causeField} ${dateRange}.`;
}

export interface GenerateIduTextInput {
    geoLocations?: readonly {
        identifier?: string | null;
        displayName?: string | null;
    }[] | null;
    reported?: number | null;
    figureCause?: string | null;
    disasterSubType?: string | null;
    violenceSubType?: string | null;
    otherSubType?: string | null;
    term?: string | null;
    unit?: string | null;
    quantifier?: Quantifier | null;
    startDate?: string | null;
    endDate?: string | null;
    termOptions?: readonly { name: string; description?: string | null }[] | null;
    sources?: readonly {
        name?: string | null;
        organizationKind?: { name?: string | null } | null;
    }[] | null;
}

export function generateExcerptIduText(input: GenerateIduTextInput): string {
    const geoLocations = input.geoLocations ?? [];

    // Reduce each location to its lowest admin level and de-duplicate, because
    // multiple locations can collapse to the same name (e.g. "Springfield, IL"
    // and "Springfield, OH").
    const lowestAdminLevels = (
        locs: NonNullable<GenerateIduTextInput['geoLocations']>,
    ) => [...new Set(
        locs.map((loc) => getLowestAdminLevel(loc.displayName)).filter(isDefined),
    )];

    const originLevels = lowestAdminLevels(
        geoLocations.filter((loc) => loc.identifier === 'ORIGIN'),
    );
    const destinationLevels = lowestAdminLevels(
        geoLocations.filter((loc) => loc.identifier === 'DESTINATION'),
    );
    const originAndDestinationLevels = lowestAdminLevels(
        geoLocations.filter((loc) => loc.identifier === 'ORIGIN_AND_DESTINATION'),
    );

    // Separate origin and destination entries that resolve to the same place(s)
    // read as "in", the same as an explicit origin-and-destination.
    const sameOriginAndDestination = originLevels.length > 0
        && originLevels.length === destinationLevels.length
        && originLevels.every((loc) => destinationLevels.includes(loc));

    let locationText: string | undefined;
    if (sameOriginAndDestination) {
        locationText = `in ${joinWithAnd(originLevels)}`;
    } else if (originLevels.length > 0 && destinationLevels.length > 0) {
        locationText = `from ${joinWithAnd(originLevels)} to ${joinWithAnd(destinationLevels)}`;
    } else if (input.term === 'RETURNS' && destinationLevels.length > 0) {
        // Returns tagged with only a destination read "returned to <place>". A
        // recorded area, origin-only, or return-in-place figure reads "in" (below);
        // a single geolocation is the area returns were recorded in, not a vector.
        locationText = `to ${joinWithAnd(destinationLevels)}`;
    } else if (originAndDestinationLevels.length > 0) {
        locationText = `in ${joinWithAnd(originAndDestinationLevels)}`;
    } else {
        const allLocations = joinWithAnd(lowestAdminLevels(geoLocations));
        locationText = allLocations ? `in ${allLocations}` : undefined;
    }

    const totalFigure = input.reported ?? undefined;

    // NOTE: the cause maps are keyed by backend subtype ids; guard the lookup so an
    // unmapped id (a new backend subtype, or PK divergence) degrades to the
    // "(Main trigger)" placeholder instead of throwing.
    let causeText: string | undefined;
    if (input.figureCause === 'DISASTER' && isDefined(input.disasterSubType)) {
        causeText = hazardMapById[input.disasterSubType]?.iduText;
    } else if (input.figureCause === 'CONFLICT' && isDefined(input.violenceSubType)) {
        causeText = conflictMapById[input.violenceSubType]?.iduText;
    } else if (input.figureCause === 'OTHER' && isDefined(input.otherSubType)) {
        causeText = otherCrisisById[input.otherSubType]?.iduText;
    }

    const termValue = input.term as (FigureTerms | undefined);
    const housingCondition = termValue ? housingConditionText[termValue] : undefined;

    let unitText: string | undefined;
    if (isDefined(input.reported)) {
        const isPlural = input.reported !== 1;
        if (input.unit === 'PERSON') {
            unitText = isPlural ? 'people' : 'person';
        } else if (input.unit === 'HOUSEHOLD' && housingCondition) {
            unitText = isPlural ? 'houses' : 'house';
        } else if (input.unit === 'HOUSEHOLD') {
            unitText = isPlural ? 'households' : 'household';
        }
    }

    const termDesc = input.termOptions?.find((term) => term.name === input.term)?.description;
    let termText: string | undefined;
    if (housingCondition) {
        termText = housingCondition;
    } else if (termValue && termTextOverrides[termValue]) {
        termText = termTextOverrides[termValue];
    } else {
        termText = termDesc?.toLowerCase();
    }

    // Person + housing reads "the housing of {figure} people were <condition>".
    const subjectPrefix = housingCondition && input.unit === 'PERSON' ? 'the housing of' : undefined;

    // Drop an inexact quantifier ("up to" / "around") when the figure is exactly one.
    const dropQuantifierForOne = input.reported === 1
        && (input.quantifier === 'LESS_THAN_OR_EQUAL' || input.quantifier === 'APPROXIMATELY');
    const quantifierField = dropQuantifierForOne
        ? undefined
        : getQuantifierText(input.quantifier ?? undefined);

    // NOTE: Returns provides its own past-tense verb ("returned"), so the
    // auxiliary was/were is omitted to read "... households returned ...".
    const termHasOwnVerb = termValue === 'RETURNS';
    // Returns reads "... following <cause>"; every other term reads "... due to <cause>".
    const causeConnector = termValue === 'RETURNS' ? 'following' : 'due to';

    return generateIduText(
        causeText,
        quantifierField,
        totalFigure,
        unitText,
        termText,
        locationText,
        formatDateRange(input.startDate ?? undefined, input.endDate ?? undefined),
        formatSource(input.sources ?? []),
        termHasOwnVerb,
        subjectPrefix,
        causeConnector,
    );
}
