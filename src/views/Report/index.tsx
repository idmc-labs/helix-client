import React, { useMemo, useCallback, useContext, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { getOperationName } from 'apollo-link';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';
import {
    Button,
    DateTimeRange,
    DateTime,
    Modal,
    PopupButton,
    Switch,
} from '@togglecorp/toggle-ui';
import {
    IoDocumentOutline,
    IoFolderOutline,
    IoInformationCircleOutline,
    IoCreateOutline,
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
    ExportReportMutation,
    ExportReportMutationVariables,
    Figure_Category_Types as FigureCategoryTypes,
    SetPfaVisibleInGiddMutation,
    SetPfaVisibleInGiddMutationVariables,
} from '#generated/types';
import useOptions from '#hooks/useOptions';
import ButtonLikeExternalLink from '#components/ButtonLikeExternalLink';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import UserItem from '#components/UserItem';
import NumberBlock from '#components/NumberBlock';
import { MarkdownPreview } from '#components/MarkdownEditor';
import ReportSelectInput from '#components/selections/ReportSelectInput';
import { reverseRoute } from '#hooks/useRouteMatching';
import route from '#config/routes';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import QuickActionButton from '#components/QuickActionButton';
import useModalState from '#hooks/useModalState';

import AnalysisUpdateForm from './Analysis/AnalysisUpdateForm';
import MethodologyUpdateForm from './Methodology/MethodologyUpdateForm';
import SummaryUpdateForm from './Summary/SummaryUpdateForm';
import PublicFigureAnalysisForm from './PublicFigureAnalysis/PublicFigureUpdateForm';
import ChallengesUpdateForm from './Challenges/ChallengesUpdateForm';
import SignificateUpdateForm from './Significant/SignificantUpdatesForm';
import ReportComments from './ReportComments';
import CountriesCrisesEventsEntriesFiguresTable from './CountriesCrisesEventsEntriesFiguresTable';

import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

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
        generations(ordering: "-id") {
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
            isPublic
            isGiddReport
            filterFigureStartAfter
            filterFigureEndBefore
            filterFigureCrisisTypes
            publicFigureAnalysis

            generatedFrom
            isPfaVisibleInGidd
            totalDisaggregation {
                totalFlowConflictSum
                totalFlowDisasterSum
                totalStockConflictSum
                totalStockDisasterSum
            }
            analysis
            challenges
            methodology
            summary
            significantUpdates

            generated
            filterFigureCategories
            totalFigures
            filterFigureRoles
            filterFigureTags {
                id
                name
            }
            filterFigureCountries {
                id
                idmcShortName
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

const REPORT_DOWNLOAD = gql`
    mutation ExportReport(
        $report: ID!,
    ) {
        exportReport(
            id: $report,
        ) {
            errors
            ok
        }
    }
`;

const SET_PUBLIC_FIGURE_ANALYSIS_VISIBLE = gql`
    mutation SetPfaVisibleInGidd(
        $reportId: ID!,
        $isPfaVisibleInGidd: Boolean!,
    ) {
        setPfaVisibleInGidd(
            reportId: $reportId,
            isPfaVisibleInGidd: $isPfaVisibleInGidd,
        ) {
            errors
            ok
            result {
                id
                isPfaVisibleInGidd
            }
        }
    }
`;

interface Entity {
    id: string;
    name: string;
}
interface Country {
    id: string;
    idmcShortName: string;
}

interface MasterFactInfoProps {
    className?: string;
    totalFigures: number | null | undefined;
    roles: string[] | null | undefined;
    countries: Country[] | null | undefined;
    categories: FigureCategoryTypes[] | null | undefined;
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
                {`Country: ${countries?.map((item) => item.idmcShortName).join(', ')}`}
            </div>
            <div>
                {`Type: ${categories?.join(', ')}`}
            </div>
            <div>
                {`Tags: ${tags?.map((item) => item.name).join(', ')}`}
            </div>
        </Container>
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
        KILLED: 'The export has been aborted.',
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
                    <IoInformationCircleOutline className={styles.icon} />
                    <div className={styles.text}>
                        {statusText[status]}
                    </div>
                </div>
            )}
        </div>
    );
}
interface ReportProps {
    className?: string;
}

function Report(props: ReportProps) {
    const {
        className,
    } = props;

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);
    const { reportId } = useParams<{ reportId: string }>();
    const { replace: historyReplace } = useHistory();

    const reportVariables = useMemo(
        (): ReportQueryVariables | undefined => ({ id: reportId }),
        [reportId],
    );
    const [, setReportOptions] = useOptions('report');

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

    // TODO: get a better way to stop polling
    // refer to source preview poll mechanism
    useEffect(
        () => {
            if (
                lastGenerationStatus === 'COMPLETED'
                || lastGenerationStatus === 'FAILED'
                || lastGenerationStatus === 'KILLED'
            ) {
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
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: 'Report started successfully!',
                        variant: 'success',
                    });
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
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
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: 'Report approved successfully!',
                        variant: 'success',
                    });
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
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
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: 'Report sign off successfully!',
                        variant: 'success',
                    });
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
            },
        },
    );

    const [
        exportReport,
        { loading: exportReportLoading },
    ] = useMutation<ExportReportMutation, ExportReportMutationVariables>(
        REPORT_DOWNLOAD,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportReport: exportReportResponse } = response;
                if (!exportReportResponse) {
                    return;
                }
                const { errors, ok } = exportReportResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (ok) {
                    notify({
                        children: 'Export started successfully!',
                    });
                }
            },
            onError: (error) => {
                notify({
                    children: error.message,
                    variant: 'error',
                });
            },
        },
    );

    const [
        setPfaVisibleInGidd,
        { loading: publicFigureVisibleLoading },
    ] = useMutation<SetPfaVisibleInGiddMutation, SetPfaVisibleInGiddMutationVariables>(
        SET_PUBLIC_FIGURE_ANALYSIS_VISIBLE,
        {
            onCompleted: (response) => {
                const { setPfaVisibleInGidd: publicFigureVisibleRes } = response;
                if (!publicFigureVisibleRes) {
                    return;
                }
                const { errors, result } = publicFigureVisibleRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: 'Visibility set successfully!',
                        variant: 'success',
                    });
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
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

    const handleExportReport = useCallback(
        () => {
            exportReport({
                variables: {
                    report: reportId,
                },
            });
        },
        [reportId, exportReport],
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

    const showPublicFigureInGidd = useCallback(
        (value: boolean) => {
            setPfaVisibleInGidd({
                variables: {
                    reportId,
                    isPfaVisibleInGidd: value,
                },
            });
        },
        [
            reportId,
            setPfaVisibleInGidd,
        ],
    );

    const loading = startReportLoading || approveReportLoading || signOffReportLoading;

    const { user } = useContext(DomainContext);
    const reportPermissions = user?.permissions?.report;
    const report = reportData?.report;
    const analysis = report?.analysis;
    const methodology = report?.methodology;
    const challenges = report?.challenges;
    const significantUpdates = report?.significantUpdates;
    const summary = report?.summary;
    const publicFigureAnalysis = report?.publicFigureAnalysis;
    const lastGeneration = report?.lastGeneration;
    const generations = report?.generations?.results?.filter((item) => item.isSignedOff);
    const reportTypes = report?.filterFigureCrisisTypes;

    const isPfaValid = useMemo(
        () => {
            const countries = report?.filterFigureCountries;
            const categories = report?.filterFigureCategories;
            const isPublic = report?.isPublic;

            const endDate = report?.filterFigureEndBefore
                ? new Date(`${report.filterFigureEndBefore}T00:00:00`)
                : undefined;
            const startDate = report?.filterFigureStartAfter
                ? new Date(`${report.filterFigureStartAfter}T00:00:00`)
                : undefined;

            return (
                // Should be public
                isPublic
                // Should have one country
                && countries
                && countries.length === 1
                // Should cover a full year
                && startDate
                && endDate
                && startDate.getFullYear() === endDate.getFullYear()
                && startDate.getMonth() === 0
                && startDate.getDate() === 1
                && endDate.getMonth() === 11
                && endDate.getDate() === 31
                // Should either be Conflict or Disaster type
                && reportTypes
                && reportTypes.length === 1
                && (reportTypes[0] === 'CONFLICT' || reportTypes[0] === 'DISASTER')
                // Should either be Idps or Internal Displacements
                && categories
                && categories.length === 1
                && (categories[0] === 'IDPS' || categories[0] === 'NEW_DISPLACEMENT')
            );
        },
        [report, reportTypes],
    );

    const status = !reportDataLoading && (
        <>
            {report?.isGiddReport && (
                <div>
                    GRID report
                </div>
            )}
            <DateTimeRange
                from={report?.filterFigureStartAfter}
                to={report?.filterFigureEndBefore}
            />
        </>
    );

    const actions = !reportDataLoading && (
        <>
            <Button
                name={undefined}
                onClick={handleExportReport}
                disabled={exportReportLoading}
            >
                Export
            </Button>
            {reportPermissions?.sign_off
                && (!lastGeneration || lastGeneration.isSignedOff)
                && (
                    <Button
                        name={undefined}
                        onClick={handleStartReport}
                        disabled={loading}
                        variant="primary"
                    >
                        Start QA
                    </Button>
                )}
            {reportPermissions?.approve
                && lastGeneration && !lastGeneration.isSignedOff
                && user
                && !lastGeneration.approvals?.results?.find(
                    (item) => item.createdBy.id === user.id,
                )
                && (
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
                && !lastGeneration.isSignedOff
                && (
                    <PopupButton
                        name={undefined}
                        label="Sign off"
                        variant="primary"
                        persistent={false}
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

    const [
        shouldShowUpdateAnalysisModal, ,
        showUpdateAnalysisModal,
        hideUpdateAnalysisModal,
    ] = useModalState();

    const [
        shouldShowUpdateMethodologyModal, ,
        showUpdateMethodologyModal,
        hideUpdateMethodologyModal,
    ] = useModalState();
    const [
        shouldShowUpdateSummaryModal, ,
        showUpdateSummaryModal,
        hideUpdateSummaryModal,
    ] = useModalState();
    const [
        shouldShowPublicFigureAnalysisModal, ,
        showPublicFigureAnalysisModal,
        hidePublicFigureAnalysisModal,
    ] = useModalState();
    const [
        shouldShowUpdateChallengesModal, ,
        showUpdateChallengesModal,
        hideUpdateChallengesModal,
    ] = useModalState();
    const [
        shouldShowUpdateSignificantModal, ,
        showUpdateSignificantModal,
        hideUpdateSignificantModal,
    ] = useModalState();

    return (
        <div className={_cs(className, styles.reports)}>
            <PageHeader
                title={(
                    <ReportSelectInput
                        name="report"
                        value={reportId}
                        onChange={handleReportChange}
                        placeholder="Select a report"
                        nonClearable
                    />
                )}
                actions={actions}
                status={status}
            />
            <div className={styles.mainContent}>
                <div className={styles.leftContent}>
                    <Container
                        className={styles.extraLargeContainer}
                        heading="Details"
                        contentClassName={styles.idpMap}
                    >
                        <div className={styles.stats}>
                            {(!reportTypes || reportTypes.length <= 0 || reportTypes.includes('CONFLICT')) && (
                                <NumberBlock
                                    label={(
                                        <>
                                            Internal Displacements
                                            <br />
                                            (Conflict)
                                        </>
                                    )}
                                    value={report?.totalDisaggregation?.totalFlowConflictSum}
                                />
                            )}
                            {(!reportTypes || reportTypes.length <= 0 || reportTypes.includes('DISASTER')) && (
                                <NumberBlock
                                    label={(
                                        <>
                                            Internal Displacements
                                            <br />
                                            (Disaster)
                                        </>
                                    )}
                                    value={report?.totalDisaggregation?.totalFlowDisasterSum}
                                />
                            )}
                            {(!reportTypes || reportTypes.length <= 0 || reportTypes.includes('CONFLICT')) && (
                                <NumberBlock
                                    label={(
                                        <>
                                            No. of IDPs
                                            <br />
                                            (Conflict)
                                        </>
                                    )}
                                    value={report?.totalDisaggregation?.totalStockConflictSum}
                                />
                            )}
                            {(!reportTypes || reportTypes.length <= 0 || reportTypes.includes('DISASTER')) && (
                                <NumberBlock
                                    label={(
                                        <>
                                            No. of IDPs
                                            <br />
                                            (Disaster)
                                        </>
                                    )}
                                    value={report?.totalDisaggregation?.totalStockDisasterSum}
                                />
                            )}
                            {/*
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
                            <NumberBlock
                                label="Figures"
                                value={report?.figuresReport?.totalCount}
                            />
                            */}
                        </div>
                    </Container>
                    <Container
                        heading="Figure Analysis"
                        headerActions={reportPermissions?.change && (
                            <QuickActionButton
                                name={undefined}
                                disabled={loading}
                                title="Edit Figure Analysis"
                                onClick={showUpdateAnalysisModal}
                                transparent
                            >
                                <IoCreateOutline />
                            </QuickActionButton>
                        )}
                    >
                        <MarkdownPreview
                            markdown={analysis || 'N/a'}
                        />
                    </Container>
                    <Container
                        heading="Methodology"
                        headerActions={reportPermissions?.change && (
                            <QuickActionButton
                                name={undefined}
                                disabled={loading}
                                title="Edit Methodology"
                                onClick={showUpdateMethodologyModal}
                                transparent
                            >
                                <IoCreateOutline />
                            </QuickActionButton>
                        )}
                    >
                        <MarkdownPreview
                            markdown={methodology || 'N/a'}
                        />
                    </Container>
                    <Container
                        heading="Challenges"
                        headerActions={reportPermissions?.change && (
                            <QuickActionButton
                                name={undefined}
                                disabled={loading}
                                title="Edit Challenges"
                                onClick={showUpdateChallengesModal}
                                transparent
                            >
                                <IoCreateOutline />
                            </QuickActionButton>
                        )}
                    >
                        <MarkdownPreview
                            markdown={challenges || 'N/a'}
                        />
                    </Container>
                    <Container
                        heading="Significant Changes"
                        headerActions={reportPermissions?.change && (
                            <QuickActionButton
                                name={undefined}
                                disabled={loading}
                                title="Edit Significant Changes"
                                onClick={showUpdateSignificantModal}
                                transparent
                            >
                                <IoCreateOutline />
                            </QuickActionButton>
                        )}
                    >
                        <MarkdownPreview
                            markdown={significantUpdates || 'N/a'}
                        />
                    </Container>
                    <Container
                        heading="Summary"
                        headerActions={reportPermissions?.change && (
                            <QuickActionButton
                                name={undefined}
                                disabled={loading}
                                title="Edit Summary"
                                onClick={showUpdateSummaryModal}
                                transparent
                            >
                                <IoCreateOutline />
                            </QuickActionButton>
                        )}
                    >
                        <MarkdownPreview
                            markdown={summary || 'N/a'}
                        />
                    </Container>
                    <Container
                        heading="Public Figure Analysis"
                        headerActions={(
                            <>
                                {(reportData?.report?.isPfaVisibleInGidd || isPfaValid) && (
                                    <Switch
                                        label="This is available in GIDD"
                                        name="PublicFigureVisibleinGidd"
                                        value={reportData?.report?.isPfaVisibleInGidd}
                                        onChange={showPublicFigureInGidd}
                                        disabled={publicFigureVisibleLoading}
                                        readOnly={!reportPermissions?.change || !user?.isAdmin}
                                    />
                                )}
                                {reportPermissions?.change && (
                                    <QuickActionButton
                                        name={undefined}
                                        disabled={loading}
                                        title="Edit public figure analysis"
                                        onClick={showPublicFigureAnalysisModal}
                                        transparent
                                    >
                                        <IoCreateOutline />
                                    </QuickActionButton>
                                )}
                            </>
                        )}
                    >
                        <MarkdownPreview
                            markdown={publicFigureAnalysis || 'N/a'}
                        />
                    </Container>
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
                            tags={report?.filterFigureTags}
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
                <CountriesCrisesEventsEntriesFiguresTable
                    className={styles.largeContainer}
                    reportId={reportId}
                />
            </div>
            {shouldShowUpdateAnalysisModal && (
                <Modal
                    onClose={hideUpdateAnalysisModal}
                    heading="Edit Figure Analysis"
                    size="large"
                    freeHeight
                >
                    <AnalysisUpdateForm
                        id={reportId}
                        onFormCancel={hideUpdateAnalysisModal}
                    />
                </Modal>
            )}
            {shouldShowUpdateMethodologyModal && (
                <Modal
                    onClose={hideUpdateMethodologyModal}
                    heading="Edit Methodology"
                    size="large"
                    freeHeight
                >
                    <MethodologyUpdateForm
                        id={reportId}
                        onFormCancel={hideUpdateMethodologyModal}
                    />
                </Modal>
            )}
            {shouldShowUpdateSummaryModal && (
                <Modal
                    onClose={hideUpdateSummaryModal}
                    heading="Edit Summary"
                    size="large"
                    freeHeight
                >
                    <SummaryUpdateForm
                        id={reportId}
                        onFormCancel={hideUpdateSummaryModal}
                    />
                </Modal>
            )}
            {shouldShowUpdateChallengesModal && (
                <Modal
                    onClose={hideUpdateChallengesModal}
                    heading="Edit Challenges"
                    size="large"
                    freeHeight
                >
                    <ChallengesUpdateForm
                        id={reportId}
                        onFormCancel={hideUpdateChallengesModal}
                    />
                </Modal>
            )}
            {shouldShowUpdateSignificantModal && (
                <Modal
                    onClose={hideUpdateSignificantModal}
                    heading="Edit Significant Changes"
                    size="large"
                    freeHeight
                >
                    <SignificateUpdateForm
                        id={reportId}
                        onFormCancel={hideUpdateSignificantModal}
                    />
                </Modal>
            )}
            {shouldShowPublicFigureAnalysisModal && (
                <Modal
                    onClose={hidePublicFigureAnalysisModal}
                    heading="Edit Public Figure Analysis"
                    size="large"
                    freeHeight
                >
                    <PublicFigureAnalysisForm
                        id={reportId}
                        onFormCancel={hidePublicFigureAnalysisModal}
                    />
                </Modal>
            )}
        </div>
    );
}

export default Report;
