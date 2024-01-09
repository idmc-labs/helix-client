import React, { useMemo, useRef } from 'react';
import { isDefined, isNotDefined, listToGroupList, mapToList } from '@togglecorp/fujs';

import ChartAxes from '#components/ChartAxes';
import useChartData from '#hooks/useChartData';
import { defaultChartMargin, defaultChartPadding } from '#utils/chart';

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

const NUM_X_AXIS_POINTS = 8;

interface Data {
    date: string;
    value: number;
}

interface Props {
    conflictData: Data[] | undefined | null;
    disasterData: Data[] | undefined | null;
}

function NdChart(props: Props) {
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

            const yearGrouped = listToGroupList(
                combinedData,
                (datum) => new Date(datum.date).getFullYear(),
            );

            return mapToList(
                yearGrouped,
                (value, year) => {
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
                        year: +year,
                        // Note: There will be at least one type present
                        totalDisplacement: (conflictSum ?? 0) + (disasterSum ?? 0),
                        conflict: conflictSum,
                        disaster: disasterSum,
                    };
                },
            );
        },
        [conflictData, disasterData],
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

    const yearRange = useMemo(
        () => {
            const now = new Date();
            if (!data || data.length === 0) {
                return { min: now.getFullYear() - NUM_X_AXIS_POINTS + 1, max: now.getFullYear() };
            }

            const yearList = data.map(({ year }) => year);
            const minYear = Math.min(...yearList);
            const maxYear = Math.max(...yearList);

            const diff = maxYear - minYear;
            const remainder = diff % (NUM_X_AXIS_POINTS - 1);
            const additional = remainder === 0
                ? 0
                : NUM_X_AXIS_POINTS - remainder - 1;

            return {
                min: minYear - Math.ceil(additional / 2),
                max: maxYear + Math.floor(additional / 2),
            };
        },
        [data],
    );

    const xAxisCompression = data.length === 0
        ? 1
        : (yearRange.max - yearRange.min) / NUM_X_AXIS_POINTS;

    const {
        dataPoints,
        chartSize,
        xAxisTicks,
        yAxisTicks,
        yScaleFn,
        xAxisTickWidth,
        renderableHeight,
    } = useChartData(
        data,
        {
            containerRef: chartContainerRef,
            chartOffset,
            chartMargin: defaultChartMargin,
            chartPadding: defaultChartPadding,
            type: 'numeric',
            keySelector: (datum) => datum.year,
            xValueSelector: (datum) => datum.year,
            xAxisLabelSelector: (year) => year,
            yValueSelector: (datum) => datum.totalDisplacement,
            yAxisStartsFromZero: true,
            numXAxisTicks: NUM_X_AXIS_POINTS,
            xDomain: yearRange,
        },
    );

    const barWidth = 10;

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

    return (
        <Container
            heading="Internal Displacements"
            className={styles.ndChart}
            contentClassName={styles.content}
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
                        chartMargin={defaultChartMargin}
                    />
                    <g className={styles.backgroundBars}>
                        {dataPoints.map(
                            (point) => (
                                <rect
                                    key={point.key}
                                    className={styles.rect}
                                    x={point.x - xAxisTickWidth / (2 * xAxisCompression)}
                                    y={0}
                                    width={xAxisTickWidth / xAxisCompression}
                                    height={renderableHeight}
                                >
                                    <Tooltip
                                        title={point.originalData.year}
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
                            (point) => (
                                <rect
                                    key={point.key}
                                    className={styles.rect}
                                    x={point.x - barWidth / 2}
                                    y={point.y}
                                    width={barWidth}
                                    height={
                                        Math.max(
                                            renderableHeight - point.y,
                                            0,
                                        )
                                    }
                                />
                            ),
                        )}
                    </g>
                    <g className={styles.disaster}>
                        {disasterDataPoints.map(
                            (point) => (
                                <rect
                                    key={point.key}
                                    className={styles.rect}
                                    x={point.x - barWidth / 2}
                                    y={point.y}
                                    width={barWidth}
                                    height={
                                        Math.max(
                                            renderableHeight - point.y,
                                            0,
                                        )
                                    }
                                />
                            ),
                        )}
                    </g>
                </svg>
            </div>
        </Container>
    );
}

export default NdChart;
