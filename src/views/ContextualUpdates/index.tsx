import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    useSortState,
    Pager,
    createDateColumn,
    SortContext,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createLinkColumn,
    createActionColumn,
} from '#components/tableHelpers';
import { PurgeNull } from '#types';

import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import {
    ContextualUpdatesQuery,
    ContextualUpdatesQueryVariables,
    DeleteContextualUpdateMutation,
    DeleteContextualUpdateMutationVariables,
} from '#generated/types';

import route from '#config/routes';
import ContextualUpdateFilter from './ContextualUpdateFilter/index';
import styles from './styles.css';

type ContextualUpdateFields = NonNullable<NonNullable<ContextualUpdatesQuery['contextualUpdateList']>['results']>[number];

const CONTEXTUAL_UPDATE_LIST = gql`
    query ContextualUpdates($ordering: String, $page: Int, $pageSize: Int, $name: String) {
        contextualUpdateList(ordering: $ordering, page: $page, pageSize: $pageSize, articleTitle: $name) {
            totalCount
            pageSize
            page
            results {
                articleTitle
                countries {
                    id
                    idmcShortName
                }
                createdAt
                createdBy {
                    fullName
                    id
                }
                crisisTypes
                id
                publishDate
                publishers {
                    results {
                        id
                        name
                    }
                }
                sources {
                    results {
                        id
                        name
                    }
                }
            }
        }
    }
`;

const CONTEXTUAL_UPDATE_DELETE = gql`
    mutation DeleteContextualUpdate($id: ID!) {
        deleteContextualUpdate(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;

const defaultSorting = {
    name: 'createdAt',
    direction: 'dsc',
};

const keySelector = (item: ContextualUpdateFields) => item.id;

interface ContextualUpdatesProps {
    className?: string;
}

function ContextualUpdates(props: ContextualUpdatesProps) {
    const { className } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;

    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [
        contextualUpdateQueryFilters,
        setContextualUpdateQueryFilters,
    ] = useState<PurgeNull<ContextualUpdatesQueryVariables>>();

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const onFilterChange = React.useCallback(
        (value: PurgeNull<ContextualUpdatesQueryVariables>) => {
            setContextualUpdateQueryFilters(value);
            setPage(1);
        }, [],
    );

    const contextualUpdatesVariables = useMemo(
        (): ContextualUpdatesQueryVariables => ({
            ordering,
            page,
            pageSize,
            ...contextualUpdateQueryFilters,
        }),
        [ordering, page, pageSize, contextualUpdateQueryFilters],
    );

    const {
        previousData,
        data: contextualUpdatesData = previousData,
        loading: loadingContextualUpdates,
        refetch: refetchContextualUpdates,
    } = useQuery<ContextualUpdatesQuery, ContextualUpdatesQueryVariables>(CONTEXTUAL_UPDATE_LIST, {
        variables: contextualUpdatesVariables,
    });

    const [
        deleteContextualUpdate,
        { loading: deletingContextualUpdate },
    ] = useMutation<DeleteContextualUpdateMutation, DeleteContextualUpdateMutationVariables>(
        CONTEXTUAL_UPDATE_DELETE,
        {
            onCompleted: (response) => {
                const { deleteContextualUpdate: deleteContextualUpdateRes } = response;
                if (!deleteContextualUpdateRes) {
                    return;
                }
                const { errors, result } = deleteContextualUpdateRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    refetchContextualUpdates(contextualUpdatesVariables);
                    notify({ children: 'ContextualUpdate deleted successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

    const handleContextualUpdateDelete = useCallback(
        (id: string) => {
            deleteContextualUpdate({
                variables: { id },
            });
        },
        [deleteContextualUpdate],
    );

    const { user } = useContext(DomainContext);
    const contextualUpdatePermissions = user?.permissions?.contextualupdate;

    const columns = useMemo(
        () => ([
            createDateColumn<ContextualUpdateFields, string>(
                'created_at',
                'Date Created',
                (item) => item.createdAt,
                { sortable: true },
            ),
            createLinkColumn<ContextualUpdateFields, string>(
                'articleTitle',
                'Name',
                (item) => ({
                    title: item.articleTitle,
                    attrs: { contextualUpdateId: item.id },
                }),
                route.contextualUpdateView,
                { sortable: true },
            ),
            createTextColumn<ContextualUpdateFields, string>(
                'countries',
                'Countries',
                (item) => item.countries.map((c) => c.idmcShortName).join(', '),
            ),
            createDateColumn<ContextualUpdateFields, string>(
                'publish_date',
                'Publish Date',
                (item) => item.publishDate,
                { sortable: true },
            ),
            createTextColumn<ContextualUpdateFields, string>(
                'publishers',
                'Publishers',
                (item) => item.publishers?.results?.map((p) => p.name).join(', '),
            ),
            createTextColumn<ContextualUpdateFields, string>(
                'sources',
                'Sources',
                (item) => item.sources?.results?.map((s) => s.name).join(', '),
            ),
            createActionColumn<ContextualUpdateFields, string>(
                'action',
                '',
                (item) => ({
                    id: item.id,
                    onEdit: undefined,
                    onDelete: contextualUpdatePermissions?.delete
                        ? handleContextualUpdateDelete
                        : undefined,
                }),
            ),
        ]),
        [
            handleContextualUpdateDelete,
            contextualUpdatePermissions?.delete,
        ],
    );

    // eslint-disable-next-line max-len
    const totalContextualUpdatesCount = contextualUpdatesData?.contextualUpdateList?.totalCount ?? 0;

    return (
        <div className={_cs(styles.contextualUpdates, className)}>
            <PageHeader
                title="Contextual Updates"
            />
            <Container
                heading="Contextual Updates"
                className={styles.container}
                contentClassName={styles.content}
                description={(
                    <ContextualUpdateFilter
                        onFilterChange={onFilterChange}
                    />
                )}
                footerContent={(
                    <Pager
                        activePage={page}
                        itemsCount={totalContextualUpdatesCount}
                        maxItemsPerPage={pageSize}
                        onActivePageChange={setPage}
                        onItemsPerPageChange={setPageSize}
                    />
                )}
            >
                {totalContextualUpdatesCount > 0 && (
                    <SortContext.Provider value={sortState}>
                        <Table
                            className={styles.table}
                            data={contextualUpdatesData?.contextualUpdateList?.results}
                            keySelector={keySelector}
                            columns={columns}
                        />
                    </SortContext.Provider>
                )}
                {(loadingContextualUpdates || deletingContextualUpdate) && <Loading absolute />}
                {!loadingContextualUpdates && totalContextualUpdatesCount <= 0 && (
                    <Message
                        message="No contextual updates found."
                    />
                )}
            </Container>
        </div>
    );
}

export default ContextualUpdates;
