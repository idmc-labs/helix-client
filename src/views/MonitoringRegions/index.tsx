import React, { useMemo, useContext } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    Modal,
    useSortState,
    SortContext,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createNumberColumn,
} from '#components/tableHelpers';

import DomainContext from '#components/DomainContext';
import Message from '#components/Message';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';

import useModalState from '#hooks/useModalState';

import {
    MonitoringRegionsQuery,
    MonitoringRegionsQueryVariables,
} from '#generated/types';

import ActionCell, { ActionProps } from './Action';
import RegionalCoordinatorForm from './RegionalCoordinatorForm';
import MonitoringExpertForm from './MonitoringExpertForm';
import styles from './styles.css';

type RegionFields = NonNullable<NonNullable<MonitoringRegionsQuery['monitoringSubRegionList']>['results']>[number];

const REGION_LIST = gql`
    query monitoringRegions($name: String, $ordering: String) {
        monitoringSubRegionList(name: $name, ordering: $ordering) {
            pageSize
            page
            totalCount
            results {
                id
                name
                monitoringExpertsCount
                unmonitoredCountriesCount
                unmonitoredCountriesNames
                countries {
                  totalCount
                }
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

const defaultSorting = {
    name: 'name',
    direction: 'asc',
};

const keySelector = (item: RegionFields) => item.id;

interface MonitoringRegionProps {
    className?: string;
}

function MonitoringRegions(props: MonitoringRegionProps) {
    const { className } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;
    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;

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
    } = useQuery<MonitoringRegionsQuery, MonitoringRegionsQueryVariables>(REGION_LIST, {
        variables: regionsVariables,
    });

    const { user } = useContext(DomainContext);
    const portfolioPermissions = user?.permissions?.portfolio;

    const columns = useMemo(
        () => {
            const action: TableColumn<
                RegionFields,
                string,
                ActionProps,
                TableHeaderCellProps
            > = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    onRegionalCoordinatorEdit: portfolioPermissions?.change
                        ? showRegionCoordinatorModal
                        : undefined,
                    onMonitoringExpertEdit: portfolioPermissions?.change
                        ? showMonitoringExpertModal
                        : undefined,
                }),
            };

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
                    'countries__totalCount',
                    'No. of Countries',
                    (item) => item.countries?.totalCount,
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
                heading="Monitoring Regions"
                className={styles.container}
                contentClassName={styles.content}
            >
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
                    <Message
                        message="No monitoring regions found."
                    />
                )}
                {shouldShowRegionCoordinatorForm && (
                    <Modal
                        onClose={hideRegionCoordinatorModal}
                        heading="Manage Regional Coordinator"
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
