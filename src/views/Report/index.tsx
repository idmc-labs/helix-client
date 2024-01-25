import React, { useMemo, useCallback, useContext, useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { getOperationName } from 'apollo-link';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';
import {
    Button,
    Modal,
    PopupButton,
    Switch,
} from '@togglecorp/toggle-ui';
import { removeNull } from '@togglecorp/toggle-form';
import { IoCreateOutline } from 'react-icons/io5';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import { PurgeNull } from '#types';
import FiguresFilterOutput from '#components/rawTables/useFigureTable/FiguresFilterOutput';
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
    ExportReportMutation,
    ExportReportMutationVariables,
    SetPfaVisibleInGiddMutation,
    SetPfaVisibleInGiddMutationVariables,
    ReportAggregationsQuery,
    ReportAggregationsQueryVariables,
    ExtractionEntryListFiltersQueryVariables,
} from '#generated/types';
import { mergeBbox, getDateFromDateString } from '#utils/common';
import Message from '#components/Message';
import useOptions from '#hooks/useOptions';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import UserItem from '#components/UserItem';
import { MarkdownPreview } from '#components/MarkdownEditor';
import ReportSelectInput from '#components/selections/ReportSelectInput';
import { reverseRoute } from '#hooks/useRouteMatching';
import route from '#config/routes';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import QuickActionButton from '#components/QuickActionButton';
import useModalState from '#hooks/useModalState';
import TextBlock from '#components/TextBlock';
import CountriesMap, { Bounds } from '#components/CountriesMap';
import NdChart from '#components/NdChart';
import IdpChart from '#components/IdpChart';
import useCombinedChartData from '#hooks/useCombinedChartData';

import GenerationItem from './GenerationItem';
import MasterFactInfo from './MasterFactInfo';
import AnalysisUpdateForm from './Analysis/AnalysisUpdateForm';
import MethodologyUpdateForm from './Methodology/MethodologyUpdateForm';
import SummaryUpdateForm from './Summary/SummaryUpdateForm';
import PublicFigureAnalysisForm from './PublicFigureAnalysis/PublicFigureUpdateForm';
import ChallengesUpdateForm from './Challenges/ChallengesUpdateForm';
import SignificateUpdateForm from './Significant/SignificantUpdatesForm';
import ReportComments from './ReportComments';
import CountriesCrisesEventsEntriesFiguresTable from './CountriesCrisesEventsEntriesFiguresTable';

import styles from './styles.css';

function getYesNo(value: boolean | null | undefined) {
    if (value === false) {
        return 'No';
    }
    if (value === true) {
        return 'Yes';
    }
    return undefined;
}

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
            isPfaVisibleInGidd
            generatedFrom

            publicFigureAnalysis
            analysis
            challenges
            methodology
            summary
            significantUpdates

            generated
            totalFigures

            filterFigureCountries {
                id
                idmcShortName
                # Adding these information to shwo map
                boundingBox
                geojsonUrl
            }
            filterFigureCrises {
                id
                name
            }
            filterFigureStartAfter
            filterFigureEndBefore
            filterFigureCategories
            filterFigureCategoryTypes
            filterFigureTags {
                id
                name
            }
            filterFigureRoles
            filterFigureRegions {
                id
                name
            }
            filterFigureGeographicalGroups {
                id
                name
            }
            filterFigureSources {
                id
                name
                countries {
                    id
                    idmcShortName
                }
            }
            filterEntryPublishers {
                id
                name
                countries {
                    id
                    idmcShortName
                }
            }
            filterEntryArticleTitle
            filterFigureCrisisTypes
            filterFigureHasDisaggregatedData
            filterFigureEvents {
                id
                name
            }
            filterFigureCreatedBy {
                id
                fullName
                isActive
            }
            filterFigureTerms
            createdAt
            createdBy {
                fullName
                id
            }
            filterFigureReviewStatus
            filterFigureHasExcerptIdu
            filterFigureHasHousingDestruction
            filterFigureContextOfViolence {
                id
                name
            }
            filterFigureDisasterSubTypes {
                id
                name
            }
            filterFigureViolenceSubTypes {
                id
                name
            }

            ...Status
        }
    }
`;

const REPORT_AGGREGATIONS = gql`
    query ReportAggregations($filters: FigureExtractionFilterDataInputType!) {
        figureAggregations(filters: $filters) {
            idpsConflictFigures {
                date
                value
            }
            idpsDisasterFigures {
                date
                value
            }
            ndsConflictFigures {
                date
                value
            }
            ndsDisasterFigures {
                date
                value
            }
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

interface ReportProps {
    className?: string;
}

function Report(props: ReportProps) {
    const { className } = props;

    const [reportFilters, setReportFilters] = useState<
        PurgeNull<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>
    >({});

    const { reportId } = useParams<{ reportId: string }>();
    const { replace: historyReplace } = useHistory();
    const [, setReportOptions] = useOptions('report');
    const [, setCountries] = useOptions('country');
    const [, setCreatedByOptions] = useOptions('user');
    const [, setRegions] = useOptions('region');
    const [, setGeographicGroups] = useOptions('geographicGroup');
    const [, setCrises] = useOptions('crisis');
    const [, setTags] = useOptions('tag');
    const [, setOrganizations] = useOptions('organization');
    const [, setEventOptions] = useOptions('event');
    const [, setViolenceContextOptions] = useOptions('contextOfViolence');
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);
    const { user } = useContext(DomainContext);

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

    const reportVariables = useMemo(
        (): ReportQueryVariables | undefined => ({ id: reportId }),
        [reportId],
    );

    const reportAggregationsVariables = useMemo(
        (): ReportAggregationsQueryVariables | undefined => ({
            filters: {
                reportId,
            },
        }),
        [reportId],
    );

    const {
        data: reportData,
        loading: reportDataLoading,
        // error: reportDataLoadingError,
    } = useQuery<ReportQuery>(REPORT, {
        variables: reportVariables,
        skip: !reportVariables,
        onCompleted: (response) => {
            const { report: reportRes } = response;
            if (!reportRes) {
                return;
            }
            // NOTE: we are setting this options so that we can use report
            // option when adding report on the report page
            const { id, name } = reportRes;
            setReportOptions([{ id, name }]);

            if (reportRes.filterFigureRegions) {
                setRegions(reportRes.filterFigureRegions);
            }
            if (reportRes.filterFigureGeographicalGroups) {
                setGeographicGroups(reportRes.filterFigureGeographicalGroups);
            }
            if (reportRes.filterFigureCountries) {
                setCountries(reportRes.filterFigureCountries);
            }
            if (reportRes.filterFigureCrises) {
                setCrises(reportRes.filterFigureCrises);
            }
            if (reportRes.filterFigureTags) {
                setTags(reportRes.filterFigureTags);
            }
            if (reportRes.filterFigureSources) {
                setOrganizations(reportRes.filterFigureSources);
            }
            if (reportRes.filterEntryPublishers) {
                setOrganizations(reportRes.filterEntryPublishers);
            }
            if (reportRes.filterFigureEvents) {
                setEventOptions(reportRes.filterFigureEvents);
            }
            if (reportRes.filterFigureCreatedBy) {
                setCreatedByOptions(reportRes.filterFigureCreatedBy);
            }
            if (reportRes.filterFigureContextOfViolence) {
                setViolenceContextOptions(reportRes.filterFigureContextOfViolence);
            }

            setReportFilters(removeNull({
                filterFigureRegions: reportRes.filterFigureRegions?.map((r) => r.id),
                filterFigureGeographicalGroups: reportRes.filterFigureGeographicalGroups
                    ?.map((r) => r.id),
                filterFigureCreatedBy: reportRes.filterFigureCreatedBy?.map((u) => u.id),
                filterFigureCountries: reportRes.filterFigureCountries?.map((c) => c.id),
                filterFigureCrises: reportRes.filterFigureCrises?.map((cr) => cr.id),
                filterFigureCategories: reportRes.filterFigureCategories,
                // FIXME: this should not be null in the array
                filterFigureCategoryTypes: reportRes.filterFigureCategoryTypes?.filter(isDefined),
                filterFigureTags: reportRes.filterFigureTags?.map((ft) => ft.id),
                filterFigureTerms: reportRes.filterFigureTerms,
                filterFigureRoles: reportRes.filterFigureRoles,
                filterFigureStartAfter: reportRes.filterFigureStartAfter,
                filterFigureEndBefore: reportRes.filterFigureEndBefore,
                filterEntryArticleTitle: reportRes.filterEntryArticleTitle,
                filterFigureCrisisTypes: reportRes.filterFigureCrisisTypes,
                filterEntryPublishers: reportRes.filterEntryPublishers?.map((fp) => fp.id),
                filterFigureSources: reportRes.filterFigureSources?.map((fp) => fp.id),
                filterFigureEvents: reportRes.filterFigureEvents?.map((e) => e.id),
                filterFigureReviewStatus: reportRes.filterFigureReviewStatus,
                filterFigureHasDisaggregatedData: reportRes.filterFigureHasDisaggregatedData,
                filterFigureHasHousingDestruction: reportRes.filterFigureHasHousingDestruction,
                filterFigureHasExcerptIdu: reportRes.filterFigureHasExcerptIdu,
                // eslint-disable-next-line max-len
                filterFigureContextOfViolence: reportRes.filterFigureContextOfViolence?.map((e) => e.id),
                // eslint-disable-next-line max-len
                filterFigureDisasterSubTypes: reportRes.filterFigureDisasterSubTypes?.map((e) => e.id),
                // eslint-disable-next-line max-len
                filterFigureViolenceSubTypes: reportRes.filterFigureViolenceSubTypes?.map((e) => e.id),
            }));
        },
    });

    const {
        data: reportAggregations,
        loading: reportAggregationsLoading,
        // error: reportAggregationsError,
    } = useQuery<ReportAggregationsQuery>(REPORT_AGGREGATIONS, {
        variables: reportAggregationsVariables,
        skip: !reportAggregationsVariables,
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

    const loading = (
        reportDataLoading
        || reportAggregationsLoading
        || startReportLoading
        || approveReportLoading
        || signOffReportLoading
        || exportReportLoading
    );
    // const errored = !!reportDataLoadingError || !!reportAggregationsError;
    // const disabled = loading || errored;

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

    const bounds = mergeBbox(
        report?.filterFigureCountries
            ?.map((country) => country.boundingBox as (GeoJSON.BBox | null | undefined))
            .filter(isDefined),
    );

    const {
        getAxisTicksX,
        chartDomainX,
        combinedNdsData,
        combinedIdpsData,
        temporalResolution,
        setTemporalResolution,
        chartTemporalDomain,
        numAxisPointsX,
    } = useCombinedChartData({
        ndsConflictData: reportAggregations?.figureAggregations?.ndsConflictFigures,
        ndsDisasterData: reportAggregations?.figureAggregations?.ndsDisasterFigures,
        idpsConflictData: reportAggregations?.figureAggregations?.idpsConflictFigures,
        idpsDisasterData: reportAggregations?.figureAggregations?.idpsDisasterFigures,
    });

    const isPfaValid = useMemo(
        () => {
            const countries = report?.filterFigureCountries;
            const categories = report?.filterFigureCategories;
            const isPublic = report?.isPublic;

            const endDate = report?.filterFigureEndBefore
                ? getDateFromDateString(report.filterFigureEndBefore)
                : undefined;
            const startDate = report?.filterFigureStartAfter
                ? getDateFromDateString(report.filterFigureStartAfter)
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

    return (
        <div className={_cs(styles.report, className)}>
            <div className={styles.pageContent}>
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
                    actions={(
                        <>
                            <Button
                                name={undefined}
                                onClick={handleExportReport}
                                disabled={loading}
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
                    )}
                />
                <div className={styles.stats}>
                    <TextBlock
                        label="Public Report"
                        value={getYesNo(report?.isPublic)}
                    />
                    <TextBlock
                        label="GIDD Report"
                        value={getYesNo(report?.isGiddReport)}
                    />
                </div>
                <div className={styles.mainContent}>
                    <FiguresFilterOutput
                        className={styles.filterOutputs}
                        filterState={reportFilters}
                    />
                    <Container
                        className={styles.mapSection}
                        compact
                    >
                        <CountriesMap
                            className={styles.mapContainer}
                            bounds={bounds as Bounds | undefined}
                            countries={report?.filterFigureCountries}
                        />
                    </Container>
                    <div className={styles.charts}>
                        <NdChart
                            combinedNdsData={combinedNdsData}
                            numAxisPointsX={numAxisPointsX}
                            chartTemporalDomain={chartTemporalDomain}
                            chartDomainX={chartDomainX}
                            getAxisTicksX={getAxisTicksX}
                            temporalResolution={temporalResolution}
                            setTemporalResolution={setTemporalResolution}
                        />
                        <IdpChart
                            combinedIdpsData={combinedIdpsData}
                            numAxisPointsX={numAxisPointsX}
                            chartTemporalDomain={chartTemporalDomain}
                            chartDomainX={chartDomainX}
                            getAxisTicksX={getAxisTicksX}
                            temporalResolution={temporalResolution}
                            setTemporalResolution={setTemporalResolution}
                        />
                    </div>
                    <Container className={styles.overview}>
                        <Container
                            heading="Figure Analysis"
                            borderless
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
                            {analysis ? (
                                <MarkdownPreview
                                    markdown={analysis}
                                />
                            ) : (
                                <Message
                                    message="No figure analysis found."
                                />
                            )}
                        </Container>
                        <Container
                            heading="Methodology"
                            borderless
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
                            {methodology ? (
                                <MarkdownPreview
                                    markdown={methodology}
                                />
                            ) : (
                                <Message
                                    message="No methodology found."
                                />
                            )}
                        </Container>
                        <Container
                            heading="Challenges"
                            borderless
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
                            {challenges ? (
                                <MarkdownPreview
                                    markdown={challenges}
                                />
                            ) : (
                                <Message
                                    message="No challenges found."
                                />
                            )}
                        </Container>
                        <Container
                            heading="Significant Changes"
                            borderless
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
                            {significantUpdates ? (
                                <MarkdownPreview
                                    markdown={significantUpdates}
                                />
                            ) : (
                                <Message
                                    message="No significant changes found."
                                />
                            )}
                        </Container>
                        <Container
                            heading="Summary"
                            borderless
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
                            {summary ? (
                                <MarkdownPreview
                                    markdown={summary}
                                />
                            ) : (
                                <Message
                                    message="No summary found."
                                />
                            )}
                        </Container>
                        <Container
                            heading="Public Figure Analysis"
                            borderless
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
                            {publicFigureAnalysis ? (
                                <MarkdownPreview
                                    markdown={publicFigureAnalysis}
                                />
                            ) : (
                                <Message
                                    message="No public figure analysis found."
                                />
                            )}
                        </Container>
                    </Container>
                    <div className={styles.sideContent}>
                        {lastGeneration && (lastGeneration.isApproved || lastGeneration.isSignedOff) && ( // eslint-disable-line max-len
                            <Container
                                className={styles.status}
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
                                className={styles.history}
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
                        {!report?.generated
                            && (report?.filterFigureCategories?.length ?? 0) > 0 && (
                            <MasterFactInfo
                                className={styles.masterFactInfo}
                                totalFigures={report?.totalFigures}
                                roles={report?.filterFigureRoles}
                                countries={report?.filterFigureCountries}
                                categories={report?.filterFigureCategories}
                                tags={report?.filterFigureTags}
                            />
                        )}
                        <Container
                            className={styles.comments}
                            heading="Comments"
                        >
                            <ReportComments
                                // className={styles.comments}
                                reportId={reportId}
                            />
                        </Container>
                    </div>
                    <CountriesCrisesEventsEntriesFiguresTable
                        className={styles.countriesCrisesEventsEntriesFiguresTable}
                        reportId={reportId}
                    />
                </div>
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
