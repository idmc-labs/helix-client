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
    Tabs,
    Tab,
    TabPanel,
    TabList,
    DateTimeRange,
} from '@togglecorp/toggle-ui';

import {
    gql,
    useQuery,
} from '@apollo/client';

import {
    ReportQuery,
    ReportQueryVariables,
} from '#generated/types';

import NumberBlock from '#components/NumberBlock';
import ReportCountryTable from '#components/ReportCountryTable';
import ReportCrisisTable from '#components/ReportCrisisTable';
import ReportEventTable from '#components/ReportEventTable';
import ReportEntryTable from '#components/ReportEntryTable';
import MarkdownEditor from '#components/MarkdownEditor';
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
            figureStartAfter
            figureEndBefore

            countriesReport {
                totalCount
            }
            crisesReport {
                totalCount
            }
            entriesReport {
                totalCount
            }
            generatedFrom
            totalDisaggregation {
                totalFlowConflictSum
                totalFlowDisasterSum
                totalStockConflictSum
                totalStockDisasterSum
            }
            eventsReport {
                totalCount
            }

            analysis
            challenges
            methodology
            summary
            significantUpdates

            generated
            figureCategories {
                id
                name
                type
            }
            reported
            totalFigures
            figureRoles
            entryTags {
                id
                name
            }
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

    const [selectedTab, setSelectedTab] = useState('entry');

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

    let bounds;
    const bboxes = reportData?.report?.eventCountries.map((item) => item.boundingBox);
    if (bboxes && bboxes.length > 0) {
        bounds = mergeBbox(bboxes as GeoJSON.BBox[]);
    }

    const report = reportData?.report;

    const analysis = report?.analysis;
    const methodology = report?.methodology;
    const challenges = report?.challenges;
    const significantUpdates = report?.significantUpdates;
    const summary = report?.summary;

    const tabs = (
        <TabList>
            <Tab name="country">
                Countries
            </Tab>
            <Tab name="crisis">
                Crises
            </Tab>
            <Tab name="event">
                Events
            </Tab>
            <Tab name="entry">
                Entries
            </Tab>
        </TabList>
    );

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
                    <DateTimeRange
                        from={report?.figureStartAfter}
                        to={report?.figureEndBefore}
                    />
                )}
            />
            <div className={styles.content}>
                <div className={styles.leftContent}>
                    <div className={styles.top}>
                        <Container
                            className={styles.extraLargeContainer}
                            heading="IDP Map"
                            contentClassName={styles.idpMap}
                        >
                            <div className={styles.stats}>
                                <NumberBlock
                                    label="Flow (Conflict)"
                                    value={report?.totalDisaggregation?.totalFlowConflictSum}
                                />
                                <NumberBlock
                                    label="Stock (Conflict)"
                                    value={report?.totalDisaggregation?.totalFlowDisasterSum}
                                />
                                <NumberBlock
                                    label="Flow (Disaster)"
                                    value={report?.totalDisaggregation?.totalStockConflictSum}
                                />
                                <NumberBlock
                                    label="Stock (Disaster)"
                                    value={report?.totalDisaggregation?.totalStockDisasterSum}
                                />
                                <NumberBlock
                                    label="Countries"
                                    value={report?.countriesReport?.totalCount}
                                />
                                <NumberBlock
                                    label="Crises"
                                    value={report?.crisesReport?.totalCount}
                                />
                                <NumberBlock
                                    className={styles.block}
                                    label="Events"
                                    value={report?.eventsReport?.totalCount}
                                />
                                <NumberBlock
                                    className={styles.block}
                                    label="Entries"
                                    value={report?.entriesReport?.totalCount}
                                />
                            </div>
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
                    {!report?.generated && (report?.figureCategories?.length ?? 0) > 0 && (
                        <Container
                            className={styles.container}
                            heading="Masterfact"
                            footerContent="This report was migrated from masterfacts."
                        >
                            <div>
                                {`Figure: ${report?.totalFigures}`}
                            </div>
                            <div>
                                {`Role: ${report?.figureRoles?.join(', ')}`}
                            </div>
                            <div>
                                {`Country: ${report?.eventCountries?.map((item) => item.name).join(', ')}`}
                            </div>
                            <div>
                                {`Type: ${report?.figureCategories?.map((item) => `${item.name} (${item.type})`).join(', ')}`}
                            </div>
                            <div>
                                {`Tags: ${report?.entryTags?.map((item) => item.name).join(', ')}`}
                            </div>
                        </Container>
                    )}
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
                        heading="Significant Changes"
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
                <Tabs
                    value={selectedTab}
                    onChange={setSelectedTab}
                >
                    <TabPanel name="country">
                        <ReportCountryTable
                            heading={tabs}
                            className={styles.largeContainer}
                            report={reportId}
                        />
                    </TabPanel>
                    <TabPanel name="crisis">
                        <ReportCrisisTable
                            heading={tabs}
                            className={styles.largeContainer}
                            report={reportId}
                        />
                    </TabPanel>
                    <TabPanel name="event">
                        <ReportEventTable
                            heading={tabs}
                            className={styles.largeContainer}
                            report={reportId}
                        />
                    </TabPanel>
                    <TabPanel name="entry">
                        <ReportEntryTable
                            heading={tabs}
                            className={styles.largeContainer}
                            report={reportId}
                        />
                    </TabPanel>
                </Tabs>
            </div>
        </div>
    );
}

export default Report;
