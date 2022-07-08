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
} from '@togglecorp/fujs';
import {
    BasicEntity,
    EnumEntity,
} from '#types';

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
    const dateInfo = dateValue && new Date(dateValue);
    if (!dateInfo) {
        return undefined;
    }
    const dd = dateInfo.getDate();
    const mm = dateInfo.toLocaleString('default', { month: 'long' });
    const convertedDate = `${dd} ${mm}`;
    return convertedDate;
}

export function formatDateYmd(dateValue: string | undefined) {
    const dateInfo = dateValue && new Date(dateValue);
    if (!dateInfo) {
        return undefined;
    }
    const dd = (dateInfo.getDate() < 10 ? '0' : '') + dateInfo.getDate();
    const mm = ((dateInfo.getMonth() + 1) < 10 ? '0' : '') + (dateInfo.getMonth() + 1);
    const yyyy = dateInfo.getFullYear();
    const convertedDate = `${dd}/${mm}/${yyyy}`;
    return convertedDate;
}

export function listToMap<T, K extends string | number, V>(
    items: T[],
    keySelector: (val: T, index: number) => K,
    valueSelector: (val: T, index: number) => V,
) {
    const val: Partial<Record<K, V>> = items.reduce(
        (acc, item, index) => {
            const key = keySelector(item, index);
            const value = valueSelector(item, index);
            return {
                ...acc,
                [key]: value,
            };
        },
        {},
    );
    return val;
}

type Bounds = [number, number, number, number];
export function mergeBbox(bboxes: GeoJSON.BBox[]) {
    const boundsFeatures = bboxes.map((b) => bboxPolygon(b));
    const boundsFeatureCollection = featureCollection(boundsFeatures);
    const combinedPolygons = combine(boundsFeatureCollection);
    const maxBounds = bbox(combinedPolygons);
    return maxBounds as Bounds;
}

// FIXME: use NonNullableRec
// FIXME: move this to types/index.tsx
// NOTE: converts enum to string
type Check<T> = T extends string[] ? string[] : T extends string ? string : undefined;

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
