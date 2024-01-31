import { useCallback, useMemo, useState } from 'react';
import { bound, compareNumber, isDefined } from '@togglecorp/fujs';
import { getDateFromDateString, getDateFromTimestamp, getDateFromYmd, getNow } from '#utils/common';
import { getNumberOfDays, getNumberOfMonths, getSuitableTemporalResolution, TemporalResolution } from '#utils/chart';
import { formatDateLong, formatYearMonthLong } from '#components/DateTime';

export const CONFLICT_TYPE = 'conflict' as const;
export const DISASTER_TYPE = 'disaster' as const;

const NUM_X_AXIS_POINTS_MAX = 6;
const NUM_X_AXIS_POINTS_MIN = 2;

interface ResolutionOption {
    label: string;
    value: TemporalResolution;
}

export const resolutionOptions: Array<ResolutionOption> = [
    {
        label: 'Y',
        value: 'year',
    },
    {
        label: 'M',
        value: 'month',
    },
    {
        label: 'D',
        value: 'day',
    },
];

export function resolutionOptionKeySelector(option: ResolutionOption) {
    return option.value;
}

export function resolutionOptionLabelSelector(option: ResolutionOption) {
    return option.label;
}

function calculateEvenDistribution(min: number, max: number, distribution: number) {
    const diff = max - min;

    if (diff === 0) {
        return {
            left: Math.floor(distribution / 2),
            right: Math.ceil(distribution / 2),
        };
    }

    const remainder = diff % distribution;

    const additional = remainder === 0
        ? 0
        : distribution - remainder;

    return {
        left: Math.floor(additional / 2),
        right: Math.ceil(additional / 2),
    };
}

interface Data {
    date: string;
    value: number;
}

export interface CombinedData extends Data {
    type: typeof CONFLICT_TYPE | typeof DISASTER_TYPE;
}

interface Props {
    ndsConflictData: Data[] | undefined | null;
    ndsDisasterData: Data[] | undefined | null;
    idpsConflictData: Data[] | undefined | null;
    idpsDisasterData: Data[] | undefined | null;
}

function useCombinedChartData(props: Props) {
    const {
        ndsConflictData,
        ndsDisasterData,
        idpsConflictData,
        idpsDisasterData,
    } = props;

    const combinedIdpsData = useMemo<CombinedData[]>(
        () => (
            [
                idpsConflictData?.map(
                    (datum) => ({ type: CONFLICT_TYPE, ...datum }),
                ),
                idpsDisasterData?.map(
                    (datum) => ({ type: DISASTER_TYPE, ...datum }),
                ),
            ].filter(isDefined).flat()
        ),
        [idpsConflictData, idpsDisasterData],
    );

    const combinedNdsData = useMemo<CombinedData[]>(
        () => (
            [
                ndsConflictData?.map(
                    (datum) => ({ type: CONFLICT_TYPE, ...datum }),
                ),
                ndsDisasterData?.map(
                    (datum) => ({ type: DISASTER_TYPE, ...datum }),
                ),
            ].filter(isDefined).flat()
        ),
        [ndsConflictData, ndsDisasterData],
    );

    const combinedData = useMemo(
        () => ([
            ...combinedIdpsData,
            ...combinedNdsData,
        ]),
        [combinedIdpsData, combinedNdsData],
    );

    const dataTemporalDomain = useMemo(
        () => {
            const timestampList = combinedData.map(
                ({ date }) => getDateFromDateString(date).getTime(),
            );

            const minTimestamp = Math.min(...timestampList);
            const maxTimestamp = Math.max(...timestampList);

            const minDate = getDateFromTimestamp(minTimestamp);
            const maxDate = getDateFromTimestamp(maxTimestamp);

            return {
                min: minDate,
                max: maxDate,
            };
        },
        [combinedData],
    );

    const suggestedTemporalResolution = getSuitableTemporalResolution(
        {
            min: dataTemporalDomain.min.getTime(),
            max: dataTemporalDomain.max.getTime(),
        },
        NUM_X_AXIS_POINTS_MAX,
    );

    const [
        temporalResolution = suggestedTemporalResolution,
        setTemporalResolution,
    ] = useState<TemporalResolution>();

    const numAxisPointsX = useMemo(
        () => {
            const tickRange = NUM_X_AXIS_POINTS_MAX - NUM_X_AXIS_POINTS_MIN;

            let numDataPoints: number;

            if (temporalResolution === 'year') {
                numDataPoints = dataTemporalDomain.max.getFullYear()
                    - dataTemporalDomain.min.getFullYear();
            } else if (temporalResolution === 'month') {
                numDataPoints = getNumberOfMonths(dataTemporalDomain.min, dataTemporalDomain.max);
            } else {
                numDataPoints = getNumberOfDays(dataTemporalDomain.min, dataTemporalDomain.max);
            }

            if (numDataPoints <= NUM_X_AXIS_POINTS_MIN) {
                return NUM_X_AXIS_POINTS_MIN;
            }

            const numTicksList = Array.from(Array(tickRange + 1).keys()).map(
                (key) => NUM_X_AXIS_POINTS_MIN + key,
            );

            const potentialTicks = numTicksList.reverse().map(
                (numTicks) => {
                    const tickDiff = Math.ceil(numDataPoints / numTicks);
                    const offset = numTicks * tickDiff - numDataPoints;

                    return {
                        numTicks,
                        offset,
                        rank: numTicks / (offset + 5),
                    };
                },
            );

            const tickWithLowestOffset = [...potentialTicks].sort(
                (a, b) => compareNumber(a.rank, b.rank, -1),
            )[0];

            return bound(
                tickWithLowestOffset.numTicks,
                NUM_X_AXIS_POINTS_MIN,
                NUM_X_AXIS_POINTS_MAX,
            );
        },
        [dataTemporalDomain, temporalResolution],
    );

    const chartTemporalDomain = useMemo(
        () => {
            if (combinedData.length === 0) {
                const now = getNow();
                return {
                    min: getDateFromYmd(now.getFullYear() - numAxisPointsX + 1, 0, 1),
                    max: getDateFromYmd(now.getFullYear(), 0, 1),
                };
            }

            const minYear = dataTemporalDomain.min.getFullYear();
            const maxYear = dataTemporalDomain.max.getFullYear();

            if (temporalResolution === 'year') {
                const { left, right } = calculateEvenDistribution(
                    minYear,
                    maxYear,
                    numAxisPointsX,
                );

                return {
                    min: getDateFromYmd(minYear - left, 0, 1),
                    max: getDateFromYmd(maxYear + right, 0, 1),
                };
            }

            if (temporalResolution === 'month') {
                const maxMonth = dataTemporalDomain.max.getFullYear() * 12
                    + dataTemporalDomain.max.getMonth();
                const minMonth = dataTemporalDomain.min.getFullYear() * 12
                    + dataTemporalDomain.min.getMonth();

                const { left, right } = calculateEvenDistribution(
                    minMonth,
                    maxMonth,
                    numAxisPointsX,
                );

                return {
                    min: getDateFromYmd(
                        minYear,
                        dataTemporalDomain.min.getMonth() - left,
                        1,
                    ),
                    // NOTE: this should be the last day of the month
                    max: getDateFromYmd(
                        maxYear,
                        dataTemporalDomain.max.getMonth() + right,
                        1,
                    ),
                };
            }

            const { left, right } = calculateEvenDistribution(
                0,
                getNumberOfDays(dataTemporalDomain.min, dataTemporalDomain.max),
                numAxisPointsX,
            );

            return {
                min: getDateFromYmd(
                    minYear,
                    dataTemporalDomain.min.getMonth(),
                    dataTemporalDomain.min.getDate() - left,
                ),
                max: getDateFromYmd(
                    maxYear,
                    dataTemporalDomain.max.getMonth(),
                    dataTemporalDomain.max.getDate() + right,
                ),
            };
        },
        [numAxisPointsX, dataTemporalDomain, temporalResolution, combinedData],
    );

    const chartDomainX = useMemo(
        () => ({
            min: 0,
            max: getNumberOfDays(chartTemporalDomain.min, chartTemporalDomain.max),
        }),
        [chartTemporalDomain],
    );

    const getAxisTicksX = useCallback(
        (xScaleFn: (value: number) => number) => {
            let diff = 0;
            if (temporalResolution === 'year') {
                diff = chartTemporalDomain.max.getFullYear()
                    - chartTemporalDomain.min.getFullYear();
            } else if (temporalResolution === 'month') {
                diff = getNumberOfMonths(chartTemporalDomain.min, chartTemporalDomain.max);
            } else {
                diff = getNumberOfDays(chartTemporalDomain.min, chartTemporalDomain.max);
            }

            const step = Math.max(Math.ceil(diff / numAxisPointsX), 1);

            const ticks = Array.from(Array(numAxisPointsX + 1).keys()).map(
                (key) => key * step,
            );

            if (temporalResolution === 'year') {
                return ticks.map(
                    (tick) => {
                        const date = getDateFromYmd(
                            chartTemporalDomain.min.getFullYear() + tick,
                            0,
                            1,
                        );
                        const numDays = getNumberOfDays(chartTemporalDomain.min, date);

                        return {
                            key: tick,
                            x: xScaleFn(numDays),
                            label: date.getFullYear(),
                        };
                    },
                );
            }

            if (temporalResolution === 'month') {
                return ticks.map(
                    (tick) => {
                        const date = getDateFromYmd(
                            chartTemporalDomain.min.getFullYear(),
                            chartTemporalDomain.min.getMonth() + tick,
                            1,
                        );
                        const numDays = getNumberOfDays(chartTemporalDomain.min, date);

                        return {
                            key: tick,
                            x: xScaleFn(numDays),
                            label: formatYearMonthLong(date),
                        };
                    },
                );
            }

            return ticks.map(
                (tick) => {
                    const date = getDateFromYmd(
                        chartTemporalDomain.min.getFullYear(),
                        chartTemporalDomain.min.getMonth(),
                        chartTemporalDomain.min.getDate() + tick,
                    );

                    return {
                        key: tick,
                        x: xScaleFn(tick),
                        label: formatDateLong(date),
                    };
                },
            );
        },
        [chartTemporalDomain, numAxisPointsX, temporalResolution],
    );

    return useMemo(
        () => ({
            getAxisTicksX,
            chartDomainX,
            chartTemporalDomain,
            combinedNdsData,
            combinedIdpsData,
            temporalResolution,
            setTemporalResolution,
            numAxisPointsX,
        }),
        [
            getAxisTicksX,
            chartDomainX,
            chartTemporalDomain,
            combinedIdpsData,
            combinedNdsData,
            temporalResolution,
            setTemporalResolution,
            numAxisPointsX,
        ],
    );
}

export default useCombinedChartData;
