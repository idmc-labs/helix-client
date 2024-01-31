import ReactDOMServer from 'react-dom/server';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import combine from '@turf/combine';
import featureCollection from 'turf-featurecollection';
import {
    isFalsyString,
    caseInsensitiveSubmatch,
    compareStringSearch,
    isList,
    isObject,
    isNaN,
    isDefined,
    isNotDefined,
    isTruthyString,
    sum,
} from '@togglecorp/fujs';
import { v4 as uuidv4 } from 'uuid';
import {
    BasicEntity,
    EnumEntity,
} from '#types';

export type UnsafeNumberList = Maybe<Maybe<number>[]>;

function getNumberListSafe(list: UnsafeNumberList) {
    if (isNotDefined(list)) {
        return undefined;
    }

    const safeList = list.filter(isDefined);

    if (safeList.length === 0) {
        return undefined;
    }

    return safeList;
}

export function sumSafe(list: UnsafeNumberList) {
    const safeList = getNumberListSafe(list);
    if (isNotDefined(safeList)) {
        return undefined;
    }

    return sum(safeList);
}

export function maxSafe(list: UnsafeNumberList) {
    const safeList = getNumberListSafe(list);
    if (isNotDefined(safeList)) {
        return undefined;
    }

    return Math.max(...safeList);
}

export function minSafe(list: UnsafeNumberList) {
    const safeList = getNumberListSafe(list);
    if (isNotDefined(safeList)) {
        return undefined;
    }

    return Math.min(...safeList);
}

// NOTE: we need to append T00:00:00 to get date on current user's timezone
export function getDateFromDateString(value: string) {
    // NOTE: date format YYYY-MM-DD has 10 characters
    return new Date(`${value.slice(0, 10)}T00:00:00`);
}

export function getDateFromTimestamp(value: number) {
    return new Date(value);
}

export function getDateFromDateStringOrTimestamp(value: string | number) {
    return typeof value === 'string'
        ? getDateFromDateString(value)
        : getDateFromTimestamp(value);
}

export function getNow() {
    return new Date();
}

export function getDateFromYmd(year: number, month: number, day: number) {
    return new Date(year, month, day);
}

export const basicEntityKeySelector = (d: BasicEntity): string => d.id;
export const basicEntityLabelSelector = (d: BasicEntity) => d.name;

export const enumKeySelector = <T extends string | number>(d: EnumEntity<T>) => (
    d.name
);
export const enumLabelSelector = <T extends string | number>(d: EnumEntity<T>) => (
    d.description ?? String(d.name)
);

export function isLocalUrl(url: string) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname === 'localhost';
    } catch (ex) {
        return false;
    }
}

export function isValidUrl(url: string | undefined): url is string {
    if (!url) {
        return false;
    }
    try {
        // eslint-disable-next-line no-new
        new URL(url);
        return true;
    } catch (ex) {
        return false;
    }
}

export function formatDate(dateValue: string | undefined) {
    const dateInfo = dateValue ? getDateFromDateString(dateValue) : undefined;
    if (!dateInfo) {
        return undefined;
    }
    const dd = dateInfo.getDate();
    const mm = dateInfo.toLocaleString(
        'default',
        { month: 'long' },
    );
    return `${dd} ${mm}`;
}

export function formatDateYmd(dateValue: string | undefined) {
    const dateInfo = dateValue ? getDateFromDateString(dateValue) : undefined;
    if (!dateInfo) {
        return undefined;
    }

    const dd = String(dateInfo.getDate()).padStart(2, '0');
    const mm = String(dateInfo.getMonth() + 1).padStart(2, '0');
    const yyyy = String(dateInfo.getFullYear()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
}

export function capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function calculateHouseHoldSize(
    householdCount: number | undefined,
    householdSize: number | undefined,
) {
    // NOTE: for cases like 835 * 4.1 we get incorrect result because of
    // floating point numbers
    const precision = 100;
    return Math.round(((householdCount ?? 0) * precision * (householdSize ?? 0)) / precision);
}

type Bounds = [number, number, number, number];
export function mergeBbox(bboxes: GeoJSON.BBox[] | undefined) {
    if (!bboxes || bboxes.length <= 0) {
        return undefined;
    }
    const boundsFeatures = bboxes.map((b) => bboxPolygon(b));
    const boundsFeatureCollection = featureCollection(boundsFeatures);
    const combinedPolygons = combine(boundsFeatureCollection);
    const maxBounds = bbox(combinedPolygons);
    return maxBounds as Bounds;
}

// TODO: move this to types/index.tsx
// NOTE: converts enum to string
type Check<T> = T extends string[] ? string[] : T extends string ? string : undefined;

// eslint-disable-next-line @typescript-eslint/ban-types
export type GetEnumOptions<T, F> = T extends object[] ? (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends any[] ? GetEnumOptions<T[number], F>[] : T
) : ({
    [K in keyof T]: K extends 'name' ? F : T[K];
})

// eslint-disable-next-line @typescript-eslint/ban-types
export type EnumFix<T, F> = T extends object[] ? (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends any[] ? EnumFix<T[number], F>[] : T
) : ({
    [K in keyof T]: K extends F ? Check<T[K]> : T[K];
})

// eslint-disable-next-line @typescript-eslint/ban-types
export type WithId<T extends object> = T & { id: string };

// NOTE: this may be slower on the long run
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isChildNull(children: any) {
    return !ReactDOMServer.renderToStaticMarkup(children);
}

export function rankedSearchOnList<T>(
    list: T[],
    searchString: string | undefined,
    labelSelector: (item: T) => string,
) {
    if (isFalsyString(searchString)) {
        return list;
    }

    return list
        .filter((option) => caseInsensitiveSubmatch(labelSelector(option), searchString))
        .sort((a, b) => compareStringSearch(
            labelSelector(a),
            labelSelector(b),
            searchString,
        ));
}

export function hasNoData(obj: unknown): boolean {
    if (obj === undefined || obj === null || isNaN(obj)) {
        return true;
    }

    if (isList(obj)) {
        if (obj.length <= 0) {
            return true;
        }
        return obj.every((e) => hasNoData(e));
    }

    if (isObject(obj)) {
        if (Object.keys(obj).length <= 0) {
            return true;
        }
        return Object.values(obj).every(
            (value) => hasNoData(value),
        );
    }

    return false;
}

type Maybe<T> = T | null | undefined;

interface UrlParams {
    [key: string]: Maybe<string | number | boolean | (string | number | boolean)[]>;
}

export function prepareUrlParams(params: UrlParams): string {
    return Object.keys(params)
        .filter((k) => isDefined(params[k]))
        .map((k) => {
            const param = params[k];
            if (isNotDefined(param)) {
                return undefined;
            }
            let val: string;
            if (Array.isArray(param)) {
                val = param.join(',');
            } else if (typeof param === 'number' || typeof param === 'boolean') {
                val = String(param);
            } else {
                val = param;
            }
            return `${encodeURIComponent(k)}=${encodeURIComponent(val)}`;
        })
        .filter(isDefined)
        .join('&');
}

// NOTE: we do not need to use ymdToDate here as this is datetime string
export function diff(foo: string, bar: string) {
    return Math.ceil((
        new Date(foo).getTime() - new Date(bar).getTime()
    ) / 1000);
}

function mod(foo: number, bar: number) {
    const remainder = foo % bar;
    const dividend = Math.floor(foo / bar);
    return [dividend, remainder];
}

export function formatElapsedTime(seconds: number, depth = 0): string {
    if (depth > 2) {
        return '';
    }
    if (seconds >= 86400) {
        const [days, remainingSeconds] = mod(seconds, 86400);
        return `${days}d${formatElapsedTime(remainingSeconds, depth + 1)}`;
    }
    if (seconds >= 3600) {
        const [hours, remainingSeconds] = mod(seconds, 3600);
        return `${hours}h${formatElapsedTime(remainingSeconds, depth + 1)}`;
    }
    if (seconds >= 60) {
        const [minutes, remainingSeconds] = mod(seconds, 60);
        return `${minutes}m${formatElapsedTime(remainingSeconds, depth + 1)}`;
    }

    // NOTE: let's show 0s only for seconds=0 at initial call
    if (seconds === 0 && depth > 0) {
        return '';
    }

    if (seconds >= 0) {
        return `${seconds}s`;
    }
    return '';
}

// NOTE: used to override filters
export function expandObject<T extends Record<string, unknown>>(
    defaultValue: T | null | undefined,
    overrideValue: T,
) {
    if (!defaultValue) {
        return overrideValue;
    }
    const newValue = {
        ...defaultValue,
    };
    Object.keys(overrideValue).forEach((key) => {
        const safeKey = key as keyof T;
        const value = overrideValue[safeKey];
        if (value !== undefined) {
            newValue[safeKey] = value;
        }
    });
    return newValue;
}

interface FormatNumberOptions {
    currency?: boolean;
    unit?: Intl.NumberFormatOptions['unit'];
    maximumFractionDigits?: Intl.NumberFormatOptions['maximumFractionDigits'];
    compact?: boolean;
    separatorHidden?: boolean,
    language?: string,
}

export function formatNumber(
    value: null | undefined,
    options?: FormatNumberOptions,
): undefined
export function formatNumber(
    value: number | null | undefined,
    options?: FormatNumberOptions,
): undefined
export function formatNumber(
    value: number,
    options?: FormatNumberOptions,
): string
export function formatNumber(
    value: number | null | undefined,
    options?: FormatNumberOptions,
) {
    if (isNotDefined(value)) {
        return undefined;
    }

    const formattingOptions: Intl.NumberFormatOptions = {};

    if (isNotDefined(options)) {
        formattingOptions.maximumFractionDigits = Math.abs(value) >= 1000 ? 0 : 2;
        return new Intl.NumberFormat(undefined, formattingOptions).format(value);
    }

    const {
        currency,
        unit,
        maximumFractionDigits,
        compact,
        separatorHidden,
        language,
    } = options;

    if (isTruthyString(unit)) {
        formattingOptions.unit = unit;
        formattingOptions.unitDisplay = 'short';
    }
    if (currency) {
        formattingOptions.currencyDisplay = 'narrowSymbol';
        formattingOptions.style = 'currency';
    }
    if (compact) {
        formattingOptions.notation = 'compact';
        formattingOptions.compactDisplay = 'short';
    }

    formattingOptions.useGrouping = !separatorHidden;

    if (isDefined(maximumFractionDigits)) {
        formattingOptions.maximumFractionDigits = maximumFractionDigits;
    }

    const newValue = new Intl.NumberFormat(language, formattingOptions)
        .format(value);

    return newValue;
}

// Remove id and generate new uuid
export function ghost<T extends { id?: string; uuid: string }>(value: T): T {
    return {
        ...value,
        id: undefined,
        uuid: uuidv4(),
    };
}
