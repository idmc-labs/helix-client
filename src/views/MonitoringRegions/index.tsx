import React, { useMemo, useContext, useCallback } from 'react';
import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    Modal,
    SortContext,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import { getOperationName } from '@apollo/client/utilities';

import TableMessage from '#components/TableMessage';
import Loading from '#components/Loading';
import {
    createTextColumn,
    createNumberColumn,
    createCustomActionColumn,
} from '#components/tableHelpers';
import useFilterState from '#hooks/useFilterState';
import DomainContext from '#components/DomainContext';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import useModalState from '#hooks/useModalState';
import {
    ExportMonitoringRegionsMutation,
    ExportMonitoringRegionsMutationVariables,
    MonitoringRegionsQuery,
    MonitoringRegionsQueryVariables,
} from '#generated/types';
import { hasNoData } from '#utils/common';
import NotificationContext from '#components/NotificationContext';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';

import ActionCell, { ActionProps } from './Action';
import RegionalCoordinatorForm from './RegionalCoordinatorForm';
import MonitoringExpertForm from './MonitoringExpertForm';
import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

type RegionFields = NonNullable<NonNullable<MonitoringRegionsQuery['monitoringSubRegionList']>['results']>[number];

const REGION_LIST = gql`
    query monitoringRegions(
        $name: String,
        $ordering: String,
    ) {
        monitoringSubRegionList(
            ordering: $ordering,
            filters: { name: $name },
        ) {
            pageSize
            page
            totalCount
            results {
                id
                name
                monitoringExpertsCount
                unmonitoredCountriesCount
                unmonitoredCountriesNames
                countriesCount
                regionalCoordinator {
                    id
                    user {
                      fullName
                    }
                }
            }
        }
    }
`;

const MONITORING_REGIONS_DOWNLOAD = gql`
    mutation ExportMonitoringRegions(
        $filters: MonitoringSubRegionFilterDataInputType!,
    ) {
        exportMonitoringSubRegions(
            filters: $filters,
        ) {
            errors
            ok
        }
    }
`;
const keySelector = (item: RegionFields) => item.id;

interface MonitoringRegionProps {
    className?: string;
}

function MonitoringRegions(props: MonitoringRegionProps) {
    const { className } = props;
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const {
        ordering,
        sortState,

        filter,
    } = useFilterState<MonitoringRegionsQueryVariables>({
        filter: {},
        ordering: {
            name: 'name',
            direction: 'asc',
        },
    });

    const [
        shouldShowRegionCoordinatorForm,
        editableCoordinatorId,
        showRegionCoordinatorModal,
        hideRegionCoordinatorModal,
    ] = useModalState();

    const [
        shouldShowMonitoringExpertForm,
        editableMonitoringId,
        showMonitoringExpertModal,
        hideMonitoringExpertModal,
    ] = useModalState();

    const regionsVariables = useMemo(
        (): MonitoringRegionsQueryVariables => ({
            ordering,
        }),
        [ordering],
    );

    const {
        previousData,
        data: regionsData = previousData,
        loading: loadingRegions,
        error: regionsError,
    } = useQuery<MonitoringRegionsQuery, MonitoringRegionsQueryVariables>(REGION_LIST, {
        variables: regionsVariables,
    });

    const [
        exportMonitoringRegions,
        { loading: exportingMonitoringRegions },
    ] = useMutation<ExportMonitoringRegionsMutation, ExportMonitoringRegionsMutationVariables>(
        MONITORING_REGIONS_DOWNLOAD,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportMonitoringSubRegions: exportMonitoringRegionsResponse } = response;
                if (!exportMonitoringRegionsResponse) {
                    return;
                }
                const { errors, ok } = exportMonitoringRegionsResponse;
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

    const handleExportTableData = useCallback(
        () => {
            exportMonitoringRegions({
                variables: {
                    filters: filter ?? {},
                },
            });
        },
        [exportMonitoringRegions, filter],
    );

    const { user } = useContext(DomainContext);
    const portfolioPermissions = user?.permissions?.portfolio;

    const columns = useMemo(
        () => {
            const action = createCustomActionColumn<RegionFields, string, ActionProps>(
                ActionCell,
                (_, datum) => ({
                    id: datum.id,
                    onRegionalCoordinatorEdit: portfolioPermissions?.change
                        ? showRegionCoordinatorModal
                        : undefined,
                    onMonitoringExpertEdit: portfolioPermissions?.change
                        ? showMonitoringExpertModal
                        : undefined,
                    actionsHidden: false,
                }),
                'action',
                '',
                undefined,
                2,
            );

            return [
                createTextColumn<RegionFields, string>(
                    'name',
                    'Region Name',
                    (item) => item.name,
                    { sortable: true },
                    'large',
                ),
                createTextColumn<RegionFields, string>(
                    'regional_coordinator__user__full_name',
                    'Regional Coordinator',
                    (item) => item.regionalCoordinator?.user.fullName,
                    undefined,
                    'large',
                ),
                createNumberColumn<RegionFields, string>(
                    'monitoring_experts_count',
                    'No. of Monitoring Experts',
                    (item) => item.monitoringExpertsCount,
                ),
                createNumberColumn<RegionFields, string>(
                    'countries_count',
                    'No. of Countries',
                    (item) => item.countriesCount,
                ),
                createNumberColumn<RegionFields, string>(
                    'unmonitored_countries_count',
                    'No. of Unmonitored Countries',
                    (item) => item.unmonitoredCountriesCount,
                ),
                createTextColumn<RegionFields, string>(
                    'unmonitored_countries',
                    'Unmonitored Countries',
                    (item) => item.unmonitoredCountriesNames,
                ),
                action,
            ];
        }, [showMonitoringExpertModal, showRegionCoordinatorModal, portfolioPermissions],
    );

    const totalRegionsCount = regionsData?.monitoringSubRegionList?.totalCount ?? 0;

    return (
        <div className={_cs(styles.regions, className)}>
            <PageHeader
                title="Monitoring Regions"
            />
            <Container
                compactContent
                heading="Monitoring Regions"
                className={styles.container}
                contentClassName={styles.content}
                headerActions={(
                    <ConfirmButton
                        confirmationHeader="Confirm Export"
                        confirmationMessage="Are you sure you want to export this table data?"
                        name={undefined}
                        onConfirm={handleExportTableData}
                        disabled={exportingMonitoringRegions}
                    >
                        Export
                    </ConfirmButton>
                )}
            >
                {loadingRegions && <Loading absolute />}
                {totalRegionsCount > 0 && (
                    <SortContext.Provider value={sortState}>
                        <Table
                            className={styles.table}
                            data={regionsData?.monitoringSubRegionList?.results}
                            keySelector={keySelector}
                            columns={columns}
                            resizableColumn
                            fixedColumnWidth
                        />
                    </SortContext.Provider>
                )}
                {!loadingRegions && totalRegionsCount <= 0 && (
                    <TableMessage
                        errored={!!regionsError}
                        filtered={!hasNoData(filter)}
                        totalItems={totalRegionsCount}
                        emptyMessage="No monitoring regions found"
                        emptyMessageWithFilters="No monitoring regions found with applied filters"
                        errorMessage="Could not fetch monitoring regions"
                    />
                )}
                {shouldShowRegionCoordinatorForm && (
                    <Modal
                        onClose={hideRegionCoordinatorModal}
                        heading="Manage Regional Coordinator"
                        size="medium"
                        freeHeight
                    >
                        <RegionalCoordinatorForm
                            id={editableCoordinatorId}
                            onCoordinatorFormCancel={hideRegionCoordinatorModal}
                        />
                    </Modal>
                )}
                {shouldShowMonitoringExpertForm && (
                    <Modal
                        onClose={hideMonitoringExpertModal}
                        heading="Manage Monitoring Expert"
                        size="medium"
                    >
                        <MonitoringExpertForm
                            id={editableMonitoringId}
                            onMonitorFormCancel={hideMonitoringExpertModal}
                        />
                    </Modal>
                )}
            </Container>
        </div>
    );
}

export default MonitoringRegions;
