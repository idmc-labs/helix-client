import React, {
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    bound,
    compareDate,
    _cs,
    isDefined,
    isNotDefined,
    listToGroupList,
    mapToList,
} from '@togglecorp/fujs';
import { SegmentInput } from '@togglecorp/toggle-ui';

import ChartAxes from '#components/ChartAxes';
import useChartData from '#hooks/useChartData';
import {
    defaultChartMargin,
    defaultChartPadding,
    getNumberOfDays,
    getNumberOfMonths,
    getPathData,
    getSuitableTemporalResolution,
    TemporalResolution,
} from '#utils/chart';

import {
    getDateFromYmd,
    getDateFromDateStringOrTimestamp,
    getDateFromTimestamp,
    getNow,
    sumSafe,
} from '#utils/common';
import Tooltip from '#components/Tooltip';
import NumberBlock from '#components/NumberBlock';
import Container from '#components/Container';

import styles from './styles.css';

const X_AXIS_HEIGHT = 16;
const Y_AXIS_WIDTH = 40;

const chartOffset = {
    left: Y_AXIS_WIDTH,
    top: 0,
    right: 0,
    bottom: X_AXIS_HEIGHT,
};

const NUM_X_AXIS_POINTS_MAX = 7;
const NUM_X_AXIS_POINTS_MIN = 3;

const chartPadding = defaultChartPadding;
const chartMargin = defaultChartMargin;

interface Data {
    date: string;
    value: number;
}

interface Props {
    conflictData: Data[] | undefined | null;
    disasterData: Data[] | undefined | null;
}

function IdpChart(props: Props) {
    const { conflictData, disasterData } = props;
    const chartContainerRef = useRef<HTMLDivElement>(null);

    const CONFLICT_TYPE = 'conflict';
    const DISASTER_TYPE = 'disaster';

    const data = useMemo(
        () => {
            const combinedData = [
                conflictData?.map(
                    (datum) => ({ type: CONFLICT_TYPE, ...datum }),
                ),
                disasterData?.map(
                    (datum) => ({ type: DISASTER_TYPE, ...datum }),
                ),
            ].filter(isDefined).flat();

            const dateGrouped = listToGroupList(
                combinedData,
                (datum) => datum.date,
            );

            return mapToList(
                dateGrouped,
                (value, date) => {
                    // Note: there should only be one data of each type
                    const conflictSum = sumSafe(
                        value.filter(({ type }) => type === CONFLICT_TYPE).map(
                            (conflict) => conflict.value,
                        ),
                    );
                    const disasterSum = sumSafe(
                        value.filter(({ type }) => type === DISASTER_TYPE).map(
                            (disaster) => disaster.value,
                        ),
                    );

                    return {
                        date,
                        // Note: There will be at least one type present
                        maxDisplacement: Math.max((conflictSum ?? 0), (disasterSum ?? 0)),
                        sum: (conflictSum ?? 0) + (disasterSum ?? 0),
                        conflict: conflictSum,
                        disaster: disasterSum,
                    };
                },
            ).sort(
                (a, b) => compareDate(a.date, b.date),
            );
        },
        [conflictData, disasterData],
    );

    // const numAxisPointsX = bound(data?.length, NUM_X_AXIS_POINTS_MIN, NUM_X_AXIS_POINTS_MAX);
    const numDataPoints = (data?.length ?? 0);

    const numAxisPointsX = useMemo(
        () => {
            const tickRange = NUM_X_AXIS_POINTS_MAX - NUM_X_AXIS_POINTS_MIN;
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
                    };
                },
            );

            const tickWithLowestOffset = [...potentialTicks].sort(
                (a, b) => (
                    (b.numTicks - a.numTicks) * 0.75 + (a.offset - b.offset)
                ),
            )[0];

            return bound(
                tickWithLowestOffset.numTicks,
                NUM_X_AXIS_POINTS_MIN,
                NUM_X_AXIS_POINTS_MAX,
            );
        },
        [numDataPoints],
    );

    const temporalDomain = useMemo(
        () => {
            if (!data || data.length === 0) {
                const now = getNow();
                return {
                    min: getDateFromYmd(now.getFullYear() - numAxisPointsX + 1, 0, 1),
                    max: getDateFromYmd(now.getFullYear(), 0, 1),
                };
            }

            const timestampList = data.map(({ date }) => (
                getDateFromDateStringOrTimestamp(date).getTime()
            ));
            const minTimestamp = Math.min(...timestampList);
            const maxTimestamp = Math.max(...timestampList);

            const minDate = getDateFromTimestamp(minTimestamp);
            const maxDate = getDateFromTimestamp(maxTimestamp);

            return {
                min: minDate,
                max: maxDate,
            };
        },
        [data, numAxisPointsX],
    );

    const suggestedTemporalResolution = getSuitableTemporalResolution(
        {
            min: temporalDomain.min.getTime(),
            max: temporalDomain.max.getTime(),
        },
        numAxisPointsX,
    );
    const [
        temporalResolution = suggestedTemporalResolution,
        setTemporalResolution,
    ] = useState<TemporalResolution>();

    const dateRange = useMemo(
        () => {
            const minYear = temporalDomain.min.getFullYear();
            const maxYear = temporalDomain.max.getFullYear();

            if (temporalResolution === 'year') {
                const diff = maxYear - minYear;
                const remainder = diff % (numAxisPointsX - 1);
                const additional = remainder === 0
                    ? 0
                    : numAxisPointsX - remainder - 1;

                return {
                    min: getDateFromYmd(minYear, 0, 1),
                    // NOTE: this should be the last day of the year
                    max: getDateFromYmd(maxYear + additional + 1, 0, -1),
                };
            }

            if (temporalResolution === 'month') {
                const maxMonth = temporalDomain.max.getFullYear() * 12
                    + temporalDomain.max.getMonth();
                const minMonth = temporalDomain.min.getFullYear() * 12
                    + temporalDomain.min.getMonth();
                const diff = maxMonth - minMonth;
                const remainder = diff % (numAxisPointsX - 1);
                const additional = remainder === 0
                    ? 0
                    : numAxisPointsX - remainder - 1;

                return {
                    min: getDateFromYmd(
                        minYear,
                        temporalDomain.min.getMonth(),
                        1,
                    ),
                    // NOTE: this should be the last day of the month
                    max: getDateFromYmd(
                        maxYear,
                        temporalDomain.max.getMonth() + additional + 1,
                        -1,
                    ),
                };
            }

            const diff = Math.max(
                numAxisPointsX,
                getNumberOfDays(temporalDomain.min, temporalDomain.max),
            );

            const remainder = diff % (numAxisPointsX - 1);
            const additional = remainder === 0
                ? 0
                : numAxisPointsX - remainder - 1;

            return {
                min: getDateFromYmd(
                    minYear,
                    temporalDomain.min.getMonth(),
                    temporalDomain.min.getDate(),
                ),
                max: getDateFromYmd(
                    maxYear,
                    temporalDomain.max.getMonth(),
                    temporalDomain.max.getDate() + additional,
                ),
            };
        },
        [numAxisPointsX, temporalDomain, temporalResolution],
    );

    const xDomain = useMemo(
        () => ({
            min: 0,
            max: getNumberOfDays(dateRange.min, dateRange.max),
        }),
        [dateRange],
    );

    const lastPointWithData = useMemo(
        () => {
            const lastDataPoint = [...data].reverse().find(
                (datum) => isDefined(datum.conflict) || isDefined(datum.disaster),
            );

            return lastDataPoint;
        },
        [data],
    );

    const {
        dataPoints,
        chartSize,
        // xAxisTicks,
        yAxisTicks,
        yScaleFn,
        xScaleFn,
        renderableHeight,
    } = useChartData(
        data,
        {
            containerRef: chartContainerRef,
            chartOffset,
            chartMargin,
            chartPadding,
            type: 'numeric',
            keySelector: (datum) => datum.date,
            xValueSelector: (datum) => {
                const date = getDateFromDateStringOrTimestamp(datum.date);
                return getNumberOfDays(dateRange.min, date);
            },
            xAxisLabelSelector: (diff) => diff,
            yValueSelector: (datum) => datum.maxDisplacement,
            yAxisStartsFromZero: true,
            numXAxisTicks: numAxisPointsX,
            xDomain,
        },
    );

    const xAxisTicks = useMemo(
        () => {
            let diff = 0;
            if (temporalResolution === 'year') {
                diff = dateRange.max.getFullYear() - dateRange.min.getFullYear();
            } else if (temporalResolution === 'month') {
                diff = getNumberOfMonths(dateRange.min, dateRange.max);
            } else {
                diff = getNumberOfDays(dateRange.min, dateRange.max);
            }

            // NOTE: We want at least one tick
            diff = Math.max(diff, 1);

            const step = Math.ceil(diff / (numAxisPointsX - 1));
            const ticks = Array.from(Array(step * numAxisPointsX).keys()).map(
                (key) => key * step,
            );

            if (temporalResolution === 'year') {
                return ticks.map(
                    (tick) => {
                        const date = getDateFromYmd(dateRange.min.getFullYear() + tick, 0, 1);
                        const numDays = getNumberOfDays(dateRange.min, date);

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
                            dateRange.min.getFullYear(),
                            dateRange.min.getMonth() + tick,
                            1,
                        );
                        const numDays = getNumberOfDays(dateRange.min, date);

                        return {
                            key: tick,
                            x: xScaleFn(numDays),
                            label: date.toLocaleString(
                                navigator.language,
                                {
                                    year: 'numeric',
                                    month: 'short',
                                },
                            ),
                        };
                    },
                );
            }

            return ticks.map(
                (tick) => {
                    const date = getDateFromYmd(
                        dateRange.min.getFullYear(),
                        dateRange.min.getMonth(),
                        dateRange.min.getDate() + tick,
                    );

                    return {
                        key: tick,
                        x: xScaleFn(tick),
                        label: date.toLocaleString(
                            navigator.language,
                            {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                            },
                        ),
                    };
                },
            );
        },
        [xScaleFn, dateRange, numAxisPointsX, temporalResolution],
    );

    const hoverOutTimeoutRef = useRef<number | undefined>();
    const [hoveredKey, setHoveredKey] = useState<string | number | undefined>();

    const getMouseOverHandler = useCallback(
        (key: number | string) => () => {
            window.clearTimeout(hoverOutTimeoutRef.current);
            setHoveredKey(key);
        },
        [],
    );

    const handleMouseOut = useCallback(
        () => {
            window.clearTimeout(hoverOutTimeoutRef.current);
            hoverOutTimeoutRef.current = window.setTimeout(
                () => {
                    setHoveredKey(undefined);
                },
                200,
            );
        },
        [],
    );

    const conflictDataPoints = dataPoints.map(
        (dataPoint) => {
            if (isNotDefined(dataPoint.originalData.conflict)) {
                return undefined;
            }

            return {
                ...dataPoint,
                y: yScaleFn(dataPoint.originalData.conflict),
            };
        },
    ).filter(isDefined);

    const disasterDataPoints = dataPoints.map(
        (dataPoint) => {
            if (isNotDefined(dataPoint.originalData.disaster)) {
                return undefined;
            }

            return {
                ...dataPoint,
                y: yScaleFn(dataPoint.originalData.disaster),
            };
        },
    ).filter(isDefined);

    const renderableMinX = chartOffset.left + chartMargin.left + chartPadding.left;
    const renderableMaxX = chartSize.width
        - (chartOffset.right + chartMargin.right + chartPadding.right);

    return (
        <Container
            heading="Internally Displaced People (IDPs)"
            className={styles.idpChart}
            contentClassName={styles.content}
            headerActions={(
                <SegmentInput
                    name="temporalResolution"
                    value={temporalResolution}
                    options={[
                        {
                            name: 'Year',
                            value: 'year' as const,
                        },
                        {
                            name: 'Month',
                            value: 'month' as const,
                        },
                        {
                            name: 'Day',
                            value: 'day' as const,
                        },
                    ]}
                    keySelector={(item) => item.value}
                    labelSelector={(item) => item.name}
                    onChange={setTemporalResolution}
                />
            )}
        >
            <div className={styles.stats}>
                <NumberBlock
                    label="Total"
                    value={lastPointWithData?.sum}
                    description={`as of ${lastPointWithData?.date ?? '--'}`}
                />
                <NumberBlock
                    className={styles.conflictBlock}
                    label="Conflict"
                    value={lastPointWithData?.conflict}
                    description={`as of ${lastPointWithData?.date ?? '--'}`}
                />
                <NumberBlock
                    className={styles.disasterBlock}
                    label="Disaster"
                    value={lastPointWithData?.disaster}
                    description={`as of ${lastPointWithData?.date ?? '--'}`}
                />
            </div>
            <div
                className={styles.chartContainer}
                ref={chartContainerRef}
            >
                <svg className={styles.svg}>
                    <ChartAxes
                        xAxisPoints={xAxisTicks}
                        yAxisPoints={yAxisTicks}
                        xAxisHeight={X_AXIS_HEIGHT}
                        yAxisWidth={Y_AXIS_WIDTH}
                        chartSize={chartSize}
                        chartMargin={chartMargin}
                    />
                    <g className={styles.backgroundBars}>
                        {dataPoints.map(
                            (point, i) => {
                                const prevPoint = dataPoints[i - 1];
                                const nextPoint = dataPoints[i + 1];

                                const startX = isDefined(prevPoint)
                                    ? (prevPoint.x + point.x) / 2
                                    : renderableMinX;
                                const endX = isDefined(nextPoint)
                                    ? (nextPoint.x + point.x) / 2
                                    : renderableMaxX;

                                return (
                                    <rect
                                        key={point.key}
                                        className={styles.rect}
                                        x={startX}
                                        y={0}
                                        width={endX - startX}
                                        height={renderableHeight}
                                        onMouseOver={getMouseOverHandler(point.key)}
                                        onMouseOut={handleMouseOut}
                                    >
                                        <Tooltip
                                            title={point.originalData.date}
                                            // title={resolveDomainLabelX(point.originalData.date)}
                                            description={(
                                                <div className={styles.tooltipContent}>
                                                    <NumberBlock
                                                        label="Disaster"
                                                        value={point.originalData.disaster}
                                                    />
                                                    <NumberBlock
                                                        label="Conflict"
                                                        value={point.originalData.conflict}
                                                    />
                                                </div>
                                            )}
                                        />
                                    </rect>
                                );
                            },
                        )}
                    </g>
                    <g className={styles.totalDisplacement}>
                        <path
                            className={styles.path}
                            d={getPathData(disasterDataPoints)}
                        />
                        {disasterDataPoints.map(
                            (point) => (
                                <circle
                                    key={point.key}
                                    className={_cs(
                                        styles.circle,
                                        hoveredKey === point.key && styles.hovered,
                                    )}
                                    cx={point.x}
                                    cy={point.y}
                                />
                            ),
                        )}
                    </g>
                    <g className={styles.conflict}>
                        <path
                            className={styles.path}
                            d={getPathData(conflictDataPoints)}
                        />
                        {conflictDataPoints.map(
                            (point) => (
                                <circle
                                    key={point.key}
                                    className={_cs(
                                        styles.circle,
                                        hoveredKey === point.key && styles.hovered,
                                    )}
                                    cx={point.x}
                                    cy={point.y}
                                />
                            ),
                        )}
                    </g>
                </svg>
            </div>
        </Container>
    );
}

export default IdpChart;
