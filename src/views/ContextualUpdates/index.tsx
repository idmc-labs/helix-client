import React, { useMemo, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    Pager,
    SortContext,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createLinkColumn,
    createActionColumn,
    createDateColumn,
} from '#components/tableHelpers';
import { PurgeNull } from '#types';
import useFilterState from '#hooks/useFilterState';

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
    query ContextualUpdates(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $filters: ContextualUpdateFilterDataInputType,
    ) {
        contextualUpdateList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            filters: $filters,
        ) {
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
                oldId
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

const keySelector = (item: ContextualUpdateFields) => item.id;

interface ContextualUpdatesProps {
    className?: string;
}

function ContextualUpdates(props: ContextualUpdatesProps) {
    const { className } = props;

    const {
        page,
        rawPage,
        setPage,

        ordering,
        sortState,

        rawFilter,
        initialFilter,
        filter,
        setFilter,

        rawPageSize,
        pageSize,
        setPageSize,
    } = useFilterState<PurgeNull<NonNullable<ContextualUpdatesQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const contextualUpdatesVariables = useMemo(
        (): ContextualUpdatesQueryVariables => ({
            ordering,
            page,
            pageSize,
            filters: filter,
        }),
        [
            ordering,
            page,
            pageSize,
            filter,
        ],
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
                    notify({
                        children: 'ContextualUpdate deleted successfully!',
                        variant: 'success',
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
                'article_title',
                'Name',
                (item) => ({
                    title: item.articleTitle,
                    attrs: { contextualUpdateId: item.id },
                    ext: item.oldId
                        ? `/documents/${item.oldId}`
                        : undefined,
                }),
                route.contextualUpdateView,
                { sortable: true },
            ),
            createTextColumn<ContextualUpdateFields, string>(
                'countries__idmc_short_name',
                'Countries',
                (item) => item.countries.map((c) => c.idmcShortName).join(', '),
                { sortable: true },
                'large',
            ),
            createDateColumn<ContextualUpdateFields, string>(
                'publish_date',
                'Publish Date',
                (item) => item.publishDate,
                { sortable: true },
            ),
            createTextColumn<ContextualUpdateFields, string>(
                'publishers__name',
                'Publishers',
                (item) => item.publishers?.results?.map((p) => p.name).join(', '),
                { sortable: true },
            ),
            createTextColumn<ContextualUpdateFields, string>(
                'sources__name',
                'Sources',
                (item) => item.sources?.results?.map((s) => s.name).join(', '),
                { sortable: true },
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
                undefined,
                1,
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
                compactContent
                heading="Contextual Updates"
                className={styles.container}
                contentClassName={styles.content}
                description={(
                    <ContextualUpdateFilter
                        currentFilter={rawFilter}
                        initialFilter={initialFilter}
                        onFilterChange={setFilter}
                    />
                )}
                footerContent={(
                    <Pager
                        activePage={rawPage}
                        itemsCount={totalContextualUpdatesCount}
                        maxItemsPerPage={rawPageSize}
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
                            resizableColumn
                            fixedColumnWidth
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
