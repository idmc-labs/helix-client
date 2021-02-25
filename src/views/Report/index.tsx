import React, { useMemo, useState, useCallback } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';
import Map, {
    MapContainer,
    MapBounds,
} from '@togglecorp/re-map';

import {
    gql,
    useQuery,
} from '@apollo/client';

import {
    ReportQuery,
    ReportQueryVariables,
} from '#generated/types';

import ReportCountryTable from '#components/ReportCountryTable';
import ReportEventTable from '#components/ReportEventTable';
import MarkdownEditor from '#components/MarkdownEditor';
import DateCell from '#components/tableHelpers/Date';
import ReportSelectInput, { ReportOption } from '#components/ReportSelectInput';
import { reverseRoute } from '#hooks/useRouteMatching';
import route from '#config/routes';

import Wip from '#components/Wip';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import { mergeBbox } from '#utils/common';

import styles from './styles.css';

const REPORT = gql`
    query Report($id: ID!) {
        report(id: $id) {
            id
            name
            analysis
            challenges
            methodology
            summary
            significantUpdates

            figureStartAfter
            figureEndBefore
            eventCountries {
                id
                name
                boundingBox
            }
        }
    }
`;

const lightStyle = 'mapbox://styles/mapbox/light-v10';

interface ReportProps {
    className?: string;
}

function Report(props: ReportProps) {
    const { className } = props;

    const { reportId } = useParams<{ reportId: string }>();
    const { replace: historyReplace } = useHistory();

    const handleReportChange = useCallback(
        (value?: string) => {
            if (isDefined(value)) {
                const reportRoute = reverseRoute(route.report.path, { reportId: value });
                historyReplace(reportRoute);
            } else {
                const reportsRoute = reverseRoute(route.reports.path);
                historyReplace(reportsRoute);
            }
        },
        [historyReplace],
    );

    const reportVariables = useMemo(
        (): ReportQueryVariables | undefined => ({ id: reportId }),
        [reportId],
    );
    const [reportOptions, setReportOptions] = useState<ReportOption[] | undefined | null>();

    const {
        data: reportData,
        // loading: reportDataLoading,
        // error: reportDataLoadingError,
    } = useQuery<ReportQuery>(REPORT, {
        variables: reportVariables,
        skip: !reportVariables,
        onCompleted: (response) => {
            if (response.report) {
                const { id, name } = response.report;
                setReportOptions([{ id, name }]);
            }
        },
    });

    /*
    const loading = reportDataLoading;
    const errored = !!reportDataLoadingError;
    const disabled = loading || errored;
    */

    let bounds;
    const bboxes = reportData?.report?.eventCountries.map((item) => item.boundingBox);
    if (bboxes && bboxes.length > 0) {
        bounds = mergeBbox(bboxes as GeoJSON.BBox[]);
    }

    const analysis = reportData?.report?.analysis;
    const methodology = reportData?.report?.methodology;
    const challenges = reportData?.report?.challenges;
    const significantUpdates = reportData?.report?.significantUpdates;
    const summary = reportData?.report?.summary;

    return (
        <div className={_cs(className, styles.reports)}>
            <PageHeader
                title={(
                    <ReportSelectInput
                        name="report"
                        value={reportId}
                        onChange={handleReportChange}
                        options={reportOptions}
                        onOptionsChange={setReportOptions}
                        placeholder="Select a report"
                        nonClearable
                    />
                )}
                actions={(
                    <>
                        <DateCell
                            value={reportData?.report?.figureStartAfter}
                        />
                        <span>to</span>
                        <DateCell
                            value={reportData?.report?.figureEndBefore}
                        />
                    </>
                )}
            />
            <div className={styles.content}>
                <div className={styles.leftContent}>
                    <div className={styles.top}>
                        <Container
                            className={styles.extraLargeContainer}
                            heading="IDP Map"
                        >
                            <Map
                                mapStyle={lightStyle}
                                mapOptions={{
                                    logoPosition: 'bottom-left',
                                }}
                                scaleControlShown
                                navControlShown
                            >
                                <MapContainer className={styles.mapContainer} />
                                <MapBounds
                                    bounds={bounds}
                                    padding={50}
                                />
                            </Map>
                        </Container>
                    </div>
                </div>
                <div className={styles.sideContent}>
                    <Wip>
                        <Container
                            className={styles.container}
                            heading="Recent Activity"
                        />
                    </Wip>
                </div>
            </div>
            <div className={styles.fullWidth}>
                {analysis && (
                    <Container
                        className={styles.container}
                        heading="Figure Analysis"
                    >
                        <MarkdownEditor
                            value={analysis}
                            name="analysis"
                            readOnly
                        />
                    </Container>
                )}
                {methodology && (
                    <Container
                        className={styles.container}
                        heading="Methodology"
                    >
                        <MarkdownEditor
                            value={methodology}
                            name="methodology"
                            readOnly
                        />
                    </Container>
                )}
                {challenges && (
                    <Container
                        className={styles.container}
                        heading="Challenges"
                    >
                        <MarkdownEditor
                            value={challenges}
                            name="challenges"
                            readOnly
                        />
                    </Container>
                )}
                {significantUpdates && (
                    <Container
                        className={styles.container}
                        heading="Significant Updates"
                    >
                        <MarkdownEditor
                            value={significantUpdates}
                            name="significantUpdates"
                            readOnly
                        />
                    </Container>
                )}
                {summary && (
                    <Container
                        className={styles.container}
                        heading="Summary"
                    >
                        <MarkdownEditor
                            value={summary}
                            name="summary"
                            readOnly
                        />
                    </Container>
                )}
                <ReportCountryTable
                    className={styles.largeContainer}
                    report={reportId}
                />
                <ReportEventTable
                    className={styles.largeContainer}
                    report={reportId}
                />
            </div>
        </div>
    );
}

export default Report;
