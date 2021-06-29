import React, { useMemo } from 'react';
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
    createNumberColumn,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
} from '#components/tableHelpers';

import Message from '#components/Message';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';

import useModalState from '#hooks/useModalState';

import {
    MonitoringRegionsQuery,
    MonitoringRegionsQueryVariables,
} from '#generated/types';

import ManageCordinator from '#components/forms/ManageCordinator';
import MonitoringExpertForm from '#components/forms/MonitoringExpertForm';
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

interface MonitoredRegionProps {
    className?: string;
}

function MonitoredRegions(props: MonitoredRegionProps) {
    const { className } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;
    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;

    const [
        shouldShowRegionCordinatorForm,
        editableCordinatorId,
        showRegionCordinatorModal,
        hideRegionCordinatorModal,
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

    const columns = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const regionCordinatorEdit: TableColumn<
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
                    onEdit: showRegionCordinatorModal,
                }),
            };

            const monitoringExpertEdit: TableColumn<
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
                    onEdit: showMonitoringExpertModal,
                }),
            };

            return [
                createTextColumn<RegionFields, string>(
                    'sub__region__name',
                    'Region Name',
                    (item) => item.name,
                ),
                createNumberColumn<RegionFields, string>(
                    'countries__count',
                    'No. of Countries',
                    (item) => item.countries?.totalCount,
                ),
                createTextColumn<RegionFields, string>(
                    'unmonitored__countries',
                    'No. of Unmonitored Countries',
                    (item) => item.unmonitoredCountriesNames,
                ),
                createNumberColumn<RegionFields, string>(
                    'unmonitored__countries__count',
                    'No. of Unmonitored Countries',
                    (item) => item.unmonitoredCountriesCount,
                ),
                createNumberColumn<RegionFields, string>(
                    'monitoring__experts',
                    'No. of Monitoring Experts',
                    (item) => item.monitoringExpertsCount,
                ),
                monitoringExpertEdit,
                createTextColumn<RegionFields, string>(
                    'regional__cordinator',
                    'Regional Cordinators',
                    (item) => item.regionalCoordinator?.user.fullName,
                ),
                regionCordinatorEdit,
            ];
        }, [showMonitoringExpertModal, showRegionCordinatorModal],
    );

    const totalRegionsCount = regionsData?.monitoringSubRegionList?.totalCount ?? 0;

    return (
        <div className={_cs(styles.regions, className)}>
            <PageHeader
                title="Monitored Regions"
            />
            <Container
                heading="Monitored Regions"
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
                        />
                    </SortContext.Provider>
                )}
                {!loadingRegions && totalRegionsCount <= 0 && (
                    <Message
                        message="No regions found."
                    />
                )}
                {shouldShowRegionCordinatorForm && (
                    <Modal
                        onClose={hideRegionCordinatorModal}
                        heading="Manage Regional Cordinator"
                    >
                        <ManageCordinator
                            id={editableCordinatorId}
                            onCordinatorFormCancel={hideRegionCordinatorModal}
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

export default MonitoredRegions;
