import React, { useMemo, useState, useCallback, useContext } from 'react';
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
    Button,
    Tabs,
    Tab,
    TabPanel,
    TabList,
    DateTimeRange,
    DateTime,
} from '@togglecorp/toggle-ui';
import {
    IoDocumentOutline,
    IoFolderOutline,
} from 'react-icons/io5';

import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import {
    ReportQuery,
    ReportQueryVariables,
    StartReportMutation,
    StartReportMutationVariables,
    ApproveReportMutation,
    ApproveReportMutationVariables,
    SignOffReportMutation,
    SignOffReportMutationVariables,
} from '#generated/types';

import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import UserItem from '#components/UserItem';
import NumberBlock from '#components/NumberBlock';
import MarkdownEditor from '#components/MarkdownEditor';
import ReportSelectInput, { ReportOption } from '#components/selections/ReportSelectInput';
import { reverseRoute } from '#hooks/useRouteMatching';
import route from '#config/routes';

import Wip from '#components/Wip';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import { mergeBbox } from '#utils/common';

import ReportCountryTable from './ReportCountryTable';
import ReportCrisisTable from './ReportCrisisTable';
import ReportEventTable from './ReportEventTable';
import ReportEntryTable from './ReportEntryTable';
import styles from './styles.css';

const REPORT_STATUS = gql`
    fragment Status on ReportType {
        id
        lastGeneration {
            id
            isApproved
            isSignedOff
            isSignedOffBy {
                id
                fullName
            }
            isSignedOffOn
            snapshot
            fullReport
            approvals {
                results {
                    id
                    isApproved
                    createdAt
                    createdBy {
                        id
                        fullName
                    }
                }
            }
        }
        generations {
            results {
                id
                isApproved
                isSignedOff
                isSignedOffBy {
                    id
                    fullName
                }
                isSignedOffOn
                snapshot
                fullReport
            }
        }
    }
`;

const REPORT = gql`
    ${REPORT_STATUS}
    query Report($id: ID!) {
        report(id: $id) {
            id
            name
            filterFigureStartAfter
            filterFigureEndBefore

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
            filterFigureCategories {
                id
                name
                type
            }
            reported
            totalFigures
            filterFigureRoles
            filterEntryTags {
                id
                name
            }
            filterFigureCountries {
                id
                name
                boundingBox
            }

            ...Status
        }
    }
`;

const START_REPORT = gql`
    ${REPORT_STATUS}
    mutation StartReport($id: ID!) {
        startReportGeneration(id: $id) {
            errors
            result {
                id
                ...Status
            }
        }
    }
`;

const SIGN_OFF_REPORT = gql`
    ${REPORT_STATUS}
    mutation SignOffReport($id: ID!) {
        signOffReport(id: $id) {
            errors
            result {
                id
                ...Status
            }
        }
    }
`;

const APPROVE_REPORT = gql`
    ${REPORT_STATUS}
    mutation ApproveReport($id: ID!) {
        approveReport(id: $id, approve: true) {
            errors
            result {
                id
                ...Status
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

    const { notify } = useContext(NotificationContext);
    const { reportId } = useParams<{ reportId: string }>();
    const { replace: historyReplace } = useHistory();

    const [selectedTab, setSelectedTab] = useState('entry');

    const reportVariables = useMemo(
        (): ReportQueryVariables | undefined => ({ id: reportId }),
        [reportId],
    );
    const [reportOptions, setReportOptions] = useState<ReportOption[] | undefined | null>();

    const {
        data: reportData,
        loading: reportDataLoading,
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

    const [
        startReport,
        { loading: startReportLoading },
    ] = useMutation<StartReportMutation, StartReportMutationVariables>(
        START_REPORT,
        {
            onCompleted: (response) => {
                const { startReportGeneration: startReportGenerationRes } = response;
                if (!startReportGenerationRes) {
                    return;
                }
                const { errors, result } = startReportGenerationRes;
                if (errors) {
                    notify({ children: 'Failed to start report.' });
                }
                if (result) {
                    notify({ children: 'Report started successfully!' });
                }
            },
            onError: () => {
                notify({ children: 'Failed to start report.' });
            },
        },
    );

    const handleStartReport = useCallback(
        () => {
            startReport({
                variables: {
                    id: reportId,
                },
            });
        },
        [reportId, startReport],
    );

    const [
        approveReport,
        { loading: approveReportLoading },
    ] = useMutation<ApproveReportMutation, ApproveReportMutationVariables>(
        APPROVE_REPORT,
        {
            onCompleted: (response) => {
                const { approveReport: approveReportRes } = response;
                if (!approveReportRes) {
                    return;
                }
                const { errors, result } = approveReportRes;
                if (errors) {
                    notify({ children: 'Failed to approve report.' });
                }
                if (result) {
                    notify({ children: 'Report approved successfully!' });
                }
            },
            onError: () => {
                notify({ children: 'Failed to approve report.' });
            },
        },
    );

    const handleApproveReport = useCallback(
        () => {
            approveReport({
                variables: {
                    id: reportId,
                },
            });
        },
        [reportId, approveReport],
    );

    const [
        signOffReport,
        { loading: signOffReportLoading },
    ] = useMutation<SignOffReportMutation, SignOffReportMutationVariables>(
        SIGN_OFF_REPORT,
        {
            onCompleted: (response) => {
                const { signOffReport: signOffReportRes } = response;
                if (!signOffReportRes) {
                    return;
                }
                const { errors, result } = signOffReportRes;
                if (errors) {
                    notify({ children: 'Failed to sign off report.' });
                }
                if (result) {
                    notify({ children: 'Report sign off successfully!' });
                }
            },
            onError: () => {
                notify({ children: 'Failed to sign off report.' });
            },
        },
    );

    const handleSignOffReport = useCallback(
        () => {
            signOffReport({
                variables: {
                    id: reportId,
                },
            });
        },
        [reportId, signOffReport],
    );

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

    const loading = startReportLoading || approveReportLoading || signOffReportLoading;

    let bounds;
    const bboxes = reportData?.report?.filterFigureCountries.map((item) => item.boundingBox);
    if (bboxes && bboxes.length > 0) {
        bounds = mergeBbox(bboxes as GeoJSON.BBox[]);
    }

    const { user } = useContext(DomainContext);
    const reportPermissions = user?.permissions?.report;

    const report = reportData?.report;

    const analysis = report?.analysis;
    const methodology = report?.methodology;
    const challenges = report?.challenges;
    const significantUpdates = report?.significantUpdates;
    const summary = report?.summary;

    const lastGeneration = report?.lastGeneration;
    const generations = report?.generations?.results?.filter((item) => item.isSignedOff);

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
                actions={!reportDataLoading && (
                    <>
                        <DateTimeRange
                            from={report?.filterFigureStartAfter}
                            to={report?.filterFigureEndBefore}
                        />
                        {reportPermissions?.sign_off
                            && (!lastGeneration || lastGeneration.isSignedOff)
                            && (
                                <Button
                                    name={undefined}
                                    onClick={handleStartReport}
                                    disabled={loading}
                                    variant="primary"
                                >
                                    Start
                                </Button>
                            )}
                        {reportPermissions?.approve
                            && lastGeneration && !lastGeneration.isSignedOff
                            && user
                            && !lastGeneration.approvals?.results?.find(
                                (item) => item.createdBy.id === user.id,
                            ) && (
                            <Button
                                name={undefined}
                                onClick={handleApproveReport}
                                disabled={loading}
                            >
                                Approve
                            </Button>
                        )}
                        {reportPermissions?.sign_off
                            && lastGeneration
                            && !lastGeneration.isSignedOff && (
                            <Button
                                name={undefined}
                                onClick={handleSignOffReport}
                                disabled={loading}
                                variant="primary"
                            >
                                Sign Off
                            </Button>
                        )}
                    </>
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
                                    label="Events"
                                    value={report?.eventsReport?.totalCount}
                                />
                                <NumberBlock
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
                </div>
                <div className={styles.sideContent}>
                    {lastGeneration && (lastGeneration.isApproved || lastGeneration.isSignedOff) && ( // eslint-disable-line max-len
                        <Container
                            className={styles.container}
                            heading="Status"
                        >
                            {lastGeneration.approvals?.results
                                && lastGeneration.approvals.results.length > 0
                                && (
                                    <>
                                        <h4>
                                            Approvals
                                        </h4>
                                        {lastGeneration.approvals.results.map((item) => (
                                            <UserItem
                                                name={item.createdBy.fullName}
                                                date={item.createdAt}
                                            />
                                        ))}
                                    </>
                                )}
                            {lastGeneration.isSignedOffBy && (
                                <>
                                    <h4>
                                        Signed Off
                                    </h4>
                                    <UserItem
                                        name={lastGeneration.isSignedOffBy.fullName}
                                        date={lastGeneration.isSignedOffOn}
                                    />
                                </>
                            )}
                        </Container>
                    )}
                    {generations && generations.length > 0 && (
                        <Container
                            className={styles.container}
                            heading="History"
                        >
                            {generations.map((item) => (
                                <div>
                                    <div className={styles.exportItem}>
                                        <span className={styles.name}>
                                            {item.isSignedOffBy?.fullName ?? 'Anon'}
                                        </span>
                                        <span>
                                            signed off this report on
                                        </span>
                                        <DateTime
                                            value={item.isSignedOffOn}
                                            format="datetime"
                                        />
                                    </div>
                                    <div className={styles.actions}>
                                        <Button
                                            name={undefined}
                                            disabled
                                            className={styles.button}
                                            icons={<IoDocumentOutline />}
                                        >
                                            export.xlsx
                                        </Button>
                                        <Button
                                            name={undefined}
                                            disabled
                                            className={styles.button}
                                            icons={<IoFolderOutline />}
                                        >
                                            snapshot.xlsx
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </Container>
                    )}
                    {!report?.generated && (report?.filterFigureCategories?.length ?? 0) > 0 && (
                        <Container
                            className={styles.container}
                            heading="Masterfact"
                            footerContent="This report was migrated from masterfacts."
                        >
                            <div>
                                {`Figure: ${report?.totalFigures}`}
                            </div>
                            <div>
                                {`Role: ${report?.filterFigureRoles?.join(', ')}`}
                            </div>
                            <div>
                                {`Country: ${report?.filterFigureCountries?.map((item) => item.name).join(', ')}`}
                            </div>
                            <div>
                                {`Type: ${report?.filterFigureCategories?.map((item) => `${item.name} (${item.type})`).join(', ')}`}
                            </div>
                            <div>
                                {`Tags: ${report?.filterEntryTags?.map((item) => item.name).join(', ')}`}
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
