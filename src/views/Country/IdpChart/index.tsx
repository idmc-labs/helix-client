import React, { useCallback, useMemo, useRef, useState } from 'react';
import { compareDate, isDefined, isNotDefined, listToGroupList, mapToList, _cs } from '@togglecorp/fujs';

import ChartAxes from '#components/ChartAxes';
import useChartData from '#hooks/useChartData';
import { defaultChartMargin, defaultChartPadding, getPathData } from '#utils/chart';

import styles from './styles.css';
import { sumSafe } from '#utils/common';
import Tooltip from '#components/Tooltip';
import NumberBlock from '#components/NumberBlock';
import Container from '#components/Container';

const X_AXIS_HEIGHT = 16;
const Y_AXIS_WIDTH = 40;

const chartOffset = {
    left: Y_AXIS_WIDTH,
    top: 0,
    right: 0,
    bottom: X_AXIS_HEIGHT,
};
const chartPadding = defaultChartPadding;
const chartMargin = defaultChartMargin;

const NUM_X_AXIS_POINTS = 8;

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

    const lastPointWithData = useMemo(
        () => {
            const lastDataPoint = [...data].reverse().find(
                (datum) => isDefined(datum.conflict) || isDefined(datum.disaster),
            );

            return lastDataPoint;
        },
        [data],
    );

    const dateRange = useMemo(
        () => {
            const now = new Date();
            if (!data || data.length === 0) {
                return {
                    min: new Date(now.getFullYear() - NUM_X_AXIS_POINTS + 1, 0, 1),
                    max: new Date(now.getFullYear(), 11, 31),
                };
            }

            const yearList = data.map(({ date }) => new Date(date).getFullYear());
            const minYear = Math.min(...yearList);
            const maxYear = Math.max(...yearList);

            const diff = maxYear - minYear;
            const remainder = diff % (NUM_X_AXIS_POINTS - 1);
            const additional = remainder === 0
                ? 0
                : NUM_X_AXIS_POINTS - remainder - 1;

            return {
                min: new Date(minYear - Math.ceil(additional / 2), 0, 1),
                max: new Date(maxYear + Math.floor(additional / 2), 11, 31),
            };
        },
        [data],
    );

    const {
        dataPoints,
        chartSize,
        xAxisTicks,
        yAxisTicks,
        yScaleFn,
        renderableHeight,
    } = useChartData(
        data,
        {
            containerRef: chartContainerRef,
            chartOffset,
            chartMargin,
            chartPadding,
            type: 'temporal',
            keySelector: (datum) => datum.date,
            xValueSelector: (datum) => {
                const date = new Date(datum.date);
                return date.getTime();
            },
            xAxisLabelSelector: (timestamp) => {
                const date = new Date(timestamp);
                return date.getFullYear();
            },
            yValueSelector: (datum) => datum.maxDisplacement,
            yAxisStartsFromZero: true,
            numXAxisTicks: NUM_X_AXIS_POINTS,
            xDomain: { min: dateRange.min.getTime(), max: dateRange.max.getTime() },
        },
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
