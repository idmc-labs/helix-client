import { isNotDefined, isDefined } from '@togglecorp/fujs';
import {
    maxSafe,
    minSafe,
    getDateFromTimestamp,
    UnsafeNumberList, // Type
} from '#utils/common';

export interface Size {
    width: number;
    height: number;
}

export interface Rect {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface Bounds {
    min: number;
    max: number;
}

export type ChartScale = 'linear' | 'exponential' | 'log10' | 'sqrt' | 'cbrt';

function scaleNormalizedValue(normalizedValue: number, type: ChartScale) {
    if (type === 'exponential') {
        return Math.exp(normalizedValue) / Math.exp(1);
    }

    if (type === 'log10') {
        if (normalizedValue === 0) {
            return 0;
        }

        return normalizedValue * Math.log10(normalizedValue * 10);
    }

    if (type === 'sqrt') {
        return Math.sqrt(normalizedValue);
    }

    if (type === 'cbrt') {
        return Math.cbrt(normalizedValue);
    }

    return normalizedValue;
}

export function getScaleFunction(
    domain: Bounds,
    range: Bounds,
    offset: {
        start: number,
        end: number,
    },
    inverted = false,
    scale: ChartScale = 'linear',
) {
    const rangeSize = (range.max - range.min) - (offset.start + offset.end);
    const domainSize = domain.max - domain.min;

    return (value: number) => {
        if (domainSize === 0) {
            return domain.min;
        }

        const normalizedValue = (value - domain.min) / domainSize;
        const scaledValue = scaleNormalizedValue(normalizedValue, scale);

        if (inverted) {
            return (rangeSize + offset.start) - (rangeSize * scaledValue);
        }

        return offset.start + rangeSize * scaledValue;
    };
}

export function getBounds(numList: UnsafeNumberList, bounds?: Bounds) {
    const DEFAULT_BOUNDS_DIFF = 5;

    if (isNotDefined(numList) || numList.length === 0) {
        const min = bounds?.min ?? 0;
        const max = bounds?.max ?? (min + DEFAULT_BOUNDS_DIFF);

        return {
            min,
            max,
        };
    }

    let newList = numList;
    if (isDefined(bounds)) {
        newList = [...numList, bounds.min, bounds.max];
    }

    const min = minSafe(newList) ?? 0;
    const max = maxSafe(newList) ?? (min + DEFAULT_BOUNDS_DIFF);

    return {
        min,
        max: max === min
            ? min + DEFAULT_BOUNDS_DIFF
            : max,
    };
}

export function getPathData(pointList: undefined): undefined;
export function getPathData(pointList: Point[]): string;
export function getPathData(pointList: Point[] | undefined) {
    if (isNotDefined(pointList) || pointList.length < 2) {
        return undefined;
    }

    return pointList.map((point, i) => {
        if (i === 0) {
            return `M${point.x} ${point.y}`;
        }

        return `L${point.x} ${point.y}`;
    }).join(' ');
}

export function incrementDate(date: Date, days = 1) {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}

export function incrementMonth(date: Date, months = 1) {
    const newDate = new Date(date);
    newDate.setDate(1);
    newDate.setMonth(date.getMonth() + months);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}

export function getNumberOfDays(start: Date, end: Date) {
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    let numDays = 0;
    for (let i = startDate; i < endDate; i = incrementDate(i)) {
        numDays += 1;
    }

    return numDays;
}

export function getNumberOfMonths(start: Date, end: Date) {
    const monthDiff = Math.abs(
        ((12 * end.getFullYear()) + end.getMonth())
        - ((12 * start.getFullYear()) + start.getMonth()),
    );
    return monthDiff;
}

function getNumberOfYear(start: Date, end: Date) {
    return Math.abs(end.getFullYear() - start.getFullYear());
}

export type TemporalResolution = 'year' | 'month' | 'day';

export function getSuitableTemporalResolution(
    bounds: Bounds,
    numPoints: number,
): TemporalResolution {
    const minDiff = numPoints / 2;

    const minDate = getDateFromTimestamp(bounds.min);
    const maxDate = getDateFromTimestamp(bounds.max);

    const yearDiff = getNumberOfYear(minDate, maxDate);
    if (yearDiff >= minDiff) {
        return 'year';
    }

    const monthDiff = getNumberOfMonths(minDate, maxDate);
    if (monthDiff >= minDiff) {
        return 'month';
    }

    return 'day';
}

export function getIntervals(bounds: Bounds, numPoints: number) {
    // FIXME: Add check that numPoints is not zero
    const diff = (bounds.max - bounds.min) / (numPoints - 1);
    const ticks = bounds.max === 0
        ? []
        : Array.from(Array(numPoints).keys()).map(
            (key) => bounds.min + diff * key,
        );

    return ticks;
}

export const defaultChartMargin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
};

export const defaultChartPadding = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10,
};
