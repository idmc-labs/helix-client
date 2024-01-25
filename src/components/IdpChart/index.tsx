import React, {
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    compareDate,
    _cs,
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
    getPathData,
    TemporalResolution,
} from '#utils/chart';

import {
    getDateFromDateStringOrTimestamp,
    sumSafe,
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
    combinedIdpsData: CombinedData[];
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

function IdpChart(props: Props) {
    const {
        combinedIdpsData,
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
            const dateGrouped = listToGroupList(
                combinedIdpsData,
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
        [combinedIdpsData],
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
                return getNumberOfDays(chartTemporalDomain.min, date);
            },
            xAxisLabelSelector: (diff) => diff,
            yValueSelector: (datum) => datum.maxDisplacement,
            yAxisStartsFromZero: true,
            numXAxisTicks: numAxisPointsX,
            xDomain: chartDomainX,
        },
    );

    const xAxisTicks = useMemo(
        () => getAxisTicksX(xScaleFn),
        [xScaleFn, getAxisTicksX],
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
