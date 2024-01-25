import React, {
    useCallback,
    useMemo,
    useRef,
} from 'react';
import {
    bound,
    isDefined,
    isNotDefined,
    listToGroupList,
    mapToList,
} from '@togglecorp/fujs';
import { SegmentInput } from '@togglecorp/toggle-ui';

import ChartAxes, { TickX } from '#components/ChartAxes';
import useChartData from '#hooks/useChartData';
import {
    Bounds,
    defaultChartMargin,
    defaultChartPadding,
    getNumberOfDays,
    getNumberOfMonths,
    incrementDate,
    incrementMonth,
    TemporalResolution,
} from '#utils/chart';

import {
    sumSafe,
    getDateFromDateString,
    getDateFromYmd,
} from '#utils/common';
import Tooltip from '#components/Tooltip';
import NumberBlock from '#components/NumberBlock';
import Container from '#components/Container';
import {
    CombinedData,
    CONFLICT_TYPE,
    DISASTER_TYPE,
    resolutionOptions,
    resolutionOptionKeySelector,
    resolutionOptionLabelSelector,
} from '#hooks/useCombinedChartData';

import styles from './styles.css';

const X_AXIS_HEIGHT = 32;
const Y_AXIS_WIDTH = 40;

const chartOffset = {
    left: Y_AXIS_WIDTH,
    top: 0,
    right: 0,
    bottom: X_AXIS_HEIGHT,
};

const chartPadding = defaultChartPadding;
const chartMargin = defaultChartMargin;

interface Props {
    combinedNdsData: CombinedData[];
    numAxisPointsX: number;
    chartTemporalDomain: {
        min: Date,
        max: Date,
    };
    chartDomainX: Bounds;
    getAxisTicksX: (xScaleFn: (value: number) => number) => TickX[];
    temporalResolution: TemporalResolution;
    setTemporalResolution: React.Dispatch<React.SetStateAction<TemporalResolution | undefined>>;
}

function NdChart(props: Props) {
    const {
        combinedNdsData,
        chartTemporalDomain,
        numAxisPointsX,
        chartDomainX,
        getAxisTicksX,
        temporalResolution,
        setTemporalResolution,
    } = props;
    const chartContainerRef = useRef<HTMLDivElement>(null);

    const data = useMemo(
        () => {
            let groupedData;

            if (temporalResolution === 'year') {
                groupedData = listToGroupList(
                    combinedNdsData,
                    (datum) => getDateFromDateString(datum.date).getFullYear()
                        - chartTemporalDomain.min.getFullYear(),
                );
            } else if (temporalResolution === 'month') {
                groupedData = listToGroupList(
                    combinedNdsData,
                    (datum) => {
                        const date = getDateFromDateString(datum.date);

                        return getNumberOfMonths(
                            chartTemporalDomain.min,
                            date,
                        );
                    },
                );
            } else {
                groupedData = listToGroupList(
                    combinedNdsData,
                    (datum) => {
                        const date = getDateFromDateString(datum.date);

                        return getNumberOfDays(
                            chartTemporalDomain.min,
                            date,
                        );
                    },
                );
            }

            return mapToList(
                groupedData,
                (value, key) => {
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
                        key: Number(key),
                        // Note: There will be at least one type present
                        totalDisplacement: (conflictSum ?? 0) + (disasterSum ?? 0),
                        conflict: conflictSum,
                        disaster: disasterSum,
                    };
                },
            );
        },
        [combinedNdsData, temporalResolution, chartTemporalDomain],
    );

    const displacements = useMemo(
        () => {
            const total = sumSafe(data.map((datum) => datum.totalDisplacement));
            const conflict = sumSafe(data.map((datum) => datum.conflict));
            const disaster = sumSafe(data.map((datum) => datum.disaster));

            return {
                total,
                conflict,
                disaster,
            };
        },
        [data],
    );

    const resolveDomainLabelX = useCallback(
        (diff) => {
            const minDate = chartTemporalDomain.min;
            if (temporalResolution === 'year') {
                return minDate.getFullYear() + diff;
            }

            if (temporalResolution === 'month') {
                const newDate = incrementMonth(minDate, diff);
                return newDate.toLocaleString(
                    navigator.language,
                    {
                        year: 'numeric',
                        month: 'short',
                    },
                );
            }

            const newDate = incrementDate(minDate, diff);
            return newDate.toLocaleString(
                navigator.language,
                {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                },
            );
        },
        [temporalResolution, chartTemporalDomain],
    );

    const {
        dataPoints,
        chartSize,
        // xAxisTicks,
        yAxisTicks,
        yScaleFn,
        xAxisTickWidth,
        renderableHeight,
        xScaleFn,
    } = useChartData(
        data,
        {
            containerRef: chartContainerRef,
            chartOffset,
            chartMargin,
            chartPadding,
            type: 'numeric',
            keySelector: (datum) => datum.key,
            xValueSelector: (datum) => {
                if (temporalResolution === 'year') {
                    const date = getDateFromYmd(
                        chartTemporalDomain.min.getFullYear() + datum.key,
                        chartTemporalDomain.min.getMonth(),
                        chartTemporalDomain.min.getDate(),
                    );

                    const days = getNumberOfDays(chartTemporalDomain.min, date);
                    return days;
                }

                if (temporalResolution === 'month') {
                    const date = getDateFromYmd(
                        chartTemporalDomain.min.getFullYear(),
                        chartTemporalDomain.min.getMonth() + datum.key,
                        chartTemporalDomain.min.getDate(),
                    );

                    return getNumberOfDays(chartTemporalDomain.min, date);
                }

                return datum.key;
            },
            xAxisLabelSelector: (diff) => diff,
            yValueSelector: (datum) => datum.totalDisplacement,
            yAxisStartsFromZero: true,
            numXAxisTicks: numAxisPointsX,
            xDomain: chartDomainX,
        },
    );

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

    const xAxisCompression = useMemo(
        () => {
            if (data.length === 0) {
                return 1;
            }

            let diff = chartDomainX.max - chartDomainX.min;

            if (temporalResolution === 'year') {
                diff = chartTemporalDomain.max.getFullYear()
                    - chartTemporalDomain.min.getFullYear();
            } else if (temporalResolution === 'month') {
                diff = getNumberOfMonths(chartTemporalDomain.min, chartTemporalDomain.max);
            }

            return diff / numAxisPointsX;
        },
        [chartDomainX, temporalResolution, chartTemporalDomain, data, numAxisPointsX],
    );

    const barWidth = bound(
        xAxisTickWidth / xAxisCompression,
        2,
        10,
    );

    const xAxisTicks = useMemo(
        () => getAxisTicksX(xScaleFn),
        [xScaleFn, getAxisTicksX],
    );

    return (
        <Container
            heading="Internal Displacements"
            className={styles.ndChart}
            contentClassName={styles.content}
            headerActions={(
                <SegmentInput
                    name="temporalResolution"
                    value={temporalResolution}
                    options={resolutionOptions}
                    keySelector={resolutionOptionKeySelector}
                    labelSelector={resolutionOptionLabelSelector}
                    onChange={setTemporalResolution}
                />
            )}
        >
            <div className={styles.stats}>
                <NumberBlock
                    label="Total"
                    value={displacements.total}
                />
                <NumberBlock
                    className={styles.conflictBlock}
                    label="Conflict"
                    value={displacements.conflict}
                />
                <NumberBlock
                    className={styles.disasterBlock}
                    label="Disaster"
                    value={displacements.disaster}
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
                            (point) => (
                                <rect
                                    key={point.key}
                                    className={styles.rect}
                                    x={
                                        point.x - Math.max(
                                            xAxisTickWidth / (2 * xAxisCompression),
                                            barWidth / 2,
                                        )
                                    }
                                    y={0}
                                    width={Math.max(barWidth, xAxisTickWidth / xAxisCompression)}
                                    height={renderableHeight}
                                >
                                    <Tooltip
                                        title={resolveDomainLabelX(point.originalData.key)}
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
                            ),
                        )}
                    </g>
                    <g className={styles.totalDisplacement}>
                        {dataPoints.map(
                            (point) => {
                                const initialHeight = renderableHeight - point.y;
                                const minHeight = point.originalData.conflict
                                    && point.originalData.disaster
                                    ? 2
                                    : 1;

                                const y = initialHeight < minHeight
                                    ? point.y - minHeight
                                    : point.y;
                                const height = Math.max(initialHeight, minHeight);

                                return (
                                    <rect
                                        key={point.key}
                                        className={styles.rect}
                                        x={point.x - barWidth / 2}
                                        y={y}
                                        width={barWidth}
                                        height={height}
                                    />
                                );
                            },
                        )}
                    </g>
                    <g className={styles.disaster}>
                        {disasterDataPoints.map(
                            (point) => {
                                const initialHeight = renderableHeight - point.y;
                                const minHeight = 1;

                                const y = initialHeight < minHeight
                                    ? point.y - minHeight
                                    : point.y;
                                const height = Math.max(initialHeight, minHeight);

                                return (
                                    <rect
                                        key={point.key}
                                        className={styles.rect}
                                        x={point.x - barWidth / 2}
                                        y={y}
                                        width={barWidth}
                                        height={height}
                                    />
                                );
                            },
                        )}
                    </g>
                </svg>
            </div>
        </Container>
    );
}

export default NdChart;
