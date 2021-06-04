import React, { useMemo } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    useSortState,
    SortContext,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
} from '#components/tableHelpers';

import Message from '#components/Message';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';

import {
    RegionsQuery,
    RegionsQueryVariables,
} from '#generated/types';
import styles from './styles.css';

type RegionFields = NonNullable<NonNullable<RegionsQuery['geographicalGroupList']>['results']>[number];

const REGION_LIST = gql`
    query Regions($name: String, $ordering: String) {
        geographicalGroupList(name: $name, ordering: $ordering) {
            results {
              id
              name
            }
            page
            pageSize
            totalCount
          }
    }
`;

const defaultSorting = {
    name: 'name',
    direction: 'asc',
};

const keySelector = (item: RegionFields) => item.id;

interface RegionProps {
    className?: string;
}

function Regions(props: RegionProps) {
    const { className } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;
    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;

    const regionsVariables = useMemo(
        (): RegionsQueryVariables => ({
            ordering,
        }),
        [ordering],
    );

    const {
        previousData,
        data: regionsData = previousData,
        loading: loadingRegions,
    } = useQuery<RegionsQuery, RegionsQueryVariables>(REGION_LIST, {
        variables: regionsVariables,
    });

    const columns = useMemo(
        () => ([
            createTextColumn<RegionFields, string>(
                'region__name',
                'Name',
                (item) => item.name,
            ),
        ]),
        [],
    );

    const totalRegionsCount = regionsData?.geographicalGroupList?.totalCount ?? 0;

    return (
        <div className={_cs(styles.regions, className)}>
            <PageHeader
                title="Regions"
            />
            <Container
                heading="Regions"
                className={styles.container}
                contentClassName={styles.content}
            >
                {totalRegionsCount > 0 && (
                    <SortContext.Provider value={sortState}>
                        <Table
                            className={styles.table}
                            data={regionsData?.geographicalGroupList?.results}
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
            </Container>
        </div>
    );
}

export default Regions;
