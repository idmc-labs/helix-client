import React, { useMemo, useState, useCallback, useContext, useEffect } from 'react';
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
    PopupButton,
} from '@togglecorp/toggle-ui';
import {
    IoDocumentOutline,
    IoFolderOutline,
    IoInformationCircleSharp,
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
    LastGenerationPollQueryVariables,
    LastGenerationPollQuery,
    Report_Generation_Status as ReportGenerationStatus,
} from '#generated/types';

import ButtonLikeExternalLink from '#components/ButtonLikeExternalLink';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import UserItem from '#components/UserItem';
import NumberBlock from '#components/NumberBlock';
import MarkdownEditor from '#components/MarkdownEditor';
import ReportSelectInput, { ReportOption } from '#components/selections/ReportSelectInput';
import { reverseRoute } from '#hooks/useRouteMatching';
import route from '#config/routes';

import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import { mergeBbox } from '#utils/common';

import ReportComments from './ReportComments';
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
            status
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
                status
            }
        }
    }
`;

const LAST_GENERATION_POLL = gql`
    query LastGenerationPoll($id: ID!) {
        generation(id: $id) {
            id
            snapshot
            status
            fullReport
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
    mutation SignOffReport($id: ID!, $includeHistory: Boolean) {
        signOffReport(id: $id, includeHistory: $includeHistory) {
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

interface Entity {
    id: string;
    name: string;
}

interface MasterFactInfoProps {
    className?: string;
    totalFigures: number | null | undefined;
    roles: string[] | null | undefined;
    countries: Entity[] | null | undefined;
    categories: (Entity & { type: string })[] | null | undefined;
    tags: Entity[] | null | undefined;
}

function MasterFactInfo(props: MasterFactInfoProps) {
    const {
        className,
        totalFigures,
        roles,
        countries,
        categories,
        tags,
    } = props;

    return (
        <Container
            className={className}
            heading="Masterfact"
            footerContent="This report was migrated from masterfacts."
        >
            <div>
                {`Figure: ${totalFigures}`}
            </div>
            <div>
                {`Role: ${roles?.join(', ')}`}
            </div>
            <div>
                {`Country: ${countries?.map((item) => item.name).join(', ')}`}
            </div>
            <div>
                {`Type: ${categories?.map((item) => `${item.name} (${item.type})`).join(', ')}`}
            </div>
            <div>
                {`Tags: ${tags?.map((item) => item.name).join(', ')}`}
            </div>
        </Container>
    );
}

interface StatsProps {
    className?: string;
    flowConflict: number | null | undefined;
    stockConflict: number | null | undefined;
    flowDisaster: number | null | undefined;
    stockDisaster: number | null | undefined;
    countries: number | null | undefined;
    crises: number | null | undefined;
    events: number | null | undefined;
    entries: number | null | undefined;
}

function Stats(props: StatsProps) {
    const {
        className,
        flowConflict,
        stockConflict,
        flowDisaster,
        stockDisaster,
        countries,
        crises,
        events,
        entries,
    } = props;

    return (
        <div className={className}>
            <NumberBlock
                label="New Displacements (Conflict)"
                value={flowConflict}
            />
            <NumberBlock
                label="No. of IDPs (Conflict)"
                value={stockConflict}
            />
            <NumberBlock
                label="New Displacements (Disaster)"
                value={flowDisaster}
            />
            <NumberBlock
                label="No. of IDPs (Disaster)"
                value={stockDisaster}
            />
            <NumberBlock
                label="Countries"
                value={countries}
            />
            <NumberBlock
                label="Crises"
                value={crises}
            />
            <NumberBlock
                label="Events"
                value={events}
            />
            <NumberBlock
                label="Entries"
                value={entries}
            />
        </div>
    );
}

interface GenerationItemProps {
    className?: string;
    user: { id: string; fullName?: string; } | null | undefined;
    date: string | null | undefined;
    fullReport: string | null | undefined;
    snapshot: string | null | undefined;
    status: ReportGenerationStatus;
}

function GenerationItem(props: GenerationItemProps) {
    const {
        user,
        date,
        className,
        fullReport,
        snapshot,
        status,
    } = props;

    const statusText: {
        [key in Exclude<ReportGenerationStatus, 'COMPLETED'>]: string;
    } = {
        PENDING: 'The export will start soon.',
        IN_PROGRESS: 'The export has started.',
        FAILED: 'The export has failed.',
    };

    return (
        <div
            className={_cs(styles.generationItem, className)}
        >
            <div className={styles.exportItem}>
                <span className={styles.name}>
                    {user?.fullName ?? 'Anon'}
                </span>
                <span>
                    signed off this report on
                </span>
                <DateTime
                    value={date}
                    format="datetime"
                />
            </div>
            {status === 'COMPLETED' && (
                <div className={styles.actions}>
                    {fullReport && (
                        <ButtonLikeExternalLink
                            title="export.xlsx"
                            link={fullReport}
                            icons={<IoDocumentOutline />}
                            transparent
                        />
                    )}
                    {snapshot && (
                        <ButtonLikeExternalLink
                            title="snapshot.xlsx"
                            link={snapshot}
                            icons={<IoFolderOutline />}
                            transparent
                        />
                    )}
                </div>
            )}
            {status !== 'COMPLETED' && (
                <div className={styles.status}>
                    <IoInformationCircleSharp className={styles.icon} />
                    <div className={styles.text}>
                        {statusText[status]}
                    </div>
                </div>
            )}
        </div>
    );
}
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

    const generationId = reportData?.report?.lastGeneration?.id;

    const lastGenerationVariables = useMemo(
        (): LastGenerationPollQueryVariables | undefined => (
            generationId ? ({ id: generationId }) : undefined
        ),
        [generationId],
    );

    const {
        data: reportWithLastGeneration,
        stopPolling,
    } = useQuery<LastGenerationPollQuery, LastGenerationPollQueryVariables>(LAST_GENERATION_POLL, {
        skip: !lastGenerationVariables,
        pollInterval: 8_000,
        variables: lastGenerationVariables,
        // NOTE: onCompleted is only called once if the following option is not set
        // https://github.com/apollographql/apollo-client/issues/5531
        notifyOnNetworkStatusChange: true,
    });

    const lastGenerationStatus = reportWithLastGeneration?.generation?.status;

    // FIXME: get a better way to stop polling
    useEffect(
        () => {
            if (lastGenerationStatus === 'COMPLETED' || lastGenerationStatus === 'FAILED') {
                stopPolling();
            }
        },
        [lastGenerationStatus, stopPolling],
    );

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

    const handleSignOffReport = useCallback(
        () => {
            signOffReport({
                variables: {
                    id: reportId,
                    includeHistory: true,
                },
            });
        },
        [reportId, signOffReport],
    );

    const handleSignOffReportWithoutHistory = useCallback(
        () => {
            signOffReport({
                variables: {
                    id: reportId,
                    includeHistory: false,
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

    const actions = !reportDataLoading && (
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
                <PopupButton
                    name={undefined}
                    label="Sign off"
                    variant="primary"
                >
                    <Button
                        className={styles.popupItemButton}
                        name={undefined}
                        onClick={handleSignOffReportWithoutHistory}
                        disabled={loading}
                        transparent
                    >
                        without history
                    </Button>
                    <Button
                        className={styles.popupItemButton}
                        name={undefined}
                        onClick={handleSignOffReport}
                        disabled={loading}
                        transparent
                    >
                        with history
                    </Button>
                </PopupButton>
            )}
        </>
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
                actions={actions}
            />
            <div className={styles.mainContent}>
                <div className={styles.leftContent}>
                    <div className={styles.top}>
                        <Container
                            className={styles.extraLargeContainer}
                            heading="IDP Map"
                            contentClassName={styles.idpMap}
                        >
                            <Stats
                                className={styles.stats}
                                flowConflict={report?.totalDisaggregation?.totalFlowConflictSum}
                                flowDisaster={report?.totalDisaggregation?.totalFlowDisasterSum}
                                stockConflict={report?.totalDisaggregation?.totalStockConflictSum}
                                stockDisaster={report?.totalDisaggregation?.totalStockDisasterSum}
                                countries={report?.countriesReport?.totalCount}
                                crises={report?.crisesReport?.totalCount}
                                events={report?.eventsReport?.totalCount}
                                entries={report?.entriesReport?.totalCount}
                            />
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
                            contentClassName={styles.content}
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
                            contentClassName={styles.content}
                            heading="History"
                        >
                            {generations.map((item) => (
                                <GenerationItem
                                    key={item.id}
                                    user={item.isSignedOffBy}
                                    date={item.isSignedOffOn}
                                    fullReport={item.fullReport}
                                    snapshot={item.snapshot}
                                    status={item.status}
                                />
                            ))}
                        </Container>
                    )}
                    {!report?.generated && (report?.filterFigureCategories?.length ?? 0) > 0 && (
                        <MasterFactInfo
                            className={styles.container}
                            totalFigures={report?.totalFigures}
                            roles={report?.filterFigureRoles}
                            countries={report?.filterFigureCountries}
                            categories={report?.filterFigureCategories}
                            tags={report?.filterEntryTags}
                        />
                    )}
                    <Container
                        className={styles.largeContainer}
                        contentClassName={styles.content}
                        heading="Comments"
                    >
                        <ReportComments
                            className={styles.comments}
                            reportId={reportId}
                        />
                    </Container>
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
