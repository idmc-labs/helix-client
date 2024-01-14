import React, { useMemo, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { isDefined } from '@togglecorp/fujs';
import {
    Table,
    Pager,
    Modal,
    Button,
    SortContext,
} from '@togglecorp/toggle-ui';

import TableMessage from '#components/TableMessage';
import { PurgeNull } from '#types';
import {
    createTextColumn,
    createActionColumn,
    createDateColumn,
} from '#components/tableHelpers';
import Loading from '#components/Loading';
import Container from '#components/Container';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import useModalState from '#hooks/useModalState';
import {
    FigureTagListQuery,
    FigureTagListQueryVariables,
    DeleteFigureTagMutation,
    DeleteFigureTagMutationVariables,
} from '#generated/types';
import useFilterState from '#hooks/useFilterState';
import { hasNoData } from '#utils/common';

import FigureTagForm from './FigureTagForm';
import TagsFilter from '../TagsFilter';
import styles from './styles.css';

type FigureTagFields = NonNullable<NonNullable<FigureTagListQuery['figureTagList']>['results']>[number];

const FIGURE_TAG_LIST = gql`
    query FigureTagList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $filters: FigureTagFilterDataInputType,
    ) {
        figureTagList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            filters: $filters,
        ) {
            totalCount
            page
            pageSize
            results {
                id
                name
                createdAt
                createdBy {
                    id
                    fullName
                }
            }
        }
    }
`;

const FIGURE_TAG_DELETE = gql`
    mutation DeleteFigureTag($id: ID!) {
        deleteFigureTag(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;

const keySelector = (item: FigureTagFields) => item.id;

interface FigureTagsProps {
    className?: string;
}

function FigureTagsTable(props: FigureTagsProps) {
    const {
        className,
    } = props;

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
    } = useFilterState<PurgeNull<NonNullable<FigureTagListQueryVariables['filters']>>>({
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

    const [
        shouldShowAddFigureTagModal,
        editableFigureTagId,
        showAddFigureTagModal,
        hideAddFigureTagModal,
    ] = useModalState();

    const variables = useMemo(
        (): FigureTagListQueryVariables => ({
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
        data: figureTagsData = previousData,
        loading: loadingFigureTags,
        refetch: refetchFigureTags,
        error: figureTagsError,
    } = useQuery<FigureTagListQuery, FigureTagListQueryVariables>(FIGURE_TAG_LIST, {
        variables,
    });

    const [
        deleteFigureTag,
        { loading: deletingFigureTag },
    ] = useMutation<DeleteFigureTagMutation, DeleteFigureTagMutationVariables>(
        FIGURE_TAG_DELETE,
        {
            onCompleted: (response) => {
                const { deleteFigureTag: deleteFigureTagRes } = response;
                if (!deleteFigureTagRes) {
                    return;
                }
                const { errors, result } = deleteFigureTagRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    refetchFigureTags(variables);
                    notify({
                        children: 'Tag deleted successfully!',
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

    const handleFigureTagCreate = useCallback(() => {
        refetchFigureTags(variables);
        hideAddFigureTagModal();
    }, [refetchFigureTags, variables, hideAddFigureTagModal]);

    const handleFigureTagDelete = useCallback(
        (id: string) => {
            deleteFigureTag({
                variables: { id },
            });
        },
        [deleteFigureTag],
    );

    const { user } = useContext(DomainContext);
    const figureTagPermissions = user?.permissions?.figuretag;

    const columns = useMemo(
        () => ([
            createDateColumn<FigureTagFields, string>(
                'created_at',
                'Date Created',
                (item) => item.createdAt,
                { sortable: true },
            ),
            createTextColumn<FigureTagFields, string>(
                'created_by__full_name',
                'Created by',
                (item) => item.createdBy?.fullName,
                { sortable: true },
            ),
            createTextColumn<FigureTagFields, string>(
                'name',
                'Name',
                (item) => item.name,
                { sortable: true },
                'large',
            ),
            createActionColumn<FigureTagFields, string>(
                'action',
                '',
                (item) => ({
                    id: item.id,
                    onDelete: figureTagPermissions?.delete ? handleFigureTagDelete : undefined,
                    onEdit: figureTagPermissions?.change ? showAddFigureTagModal : undefined,
                }),
                undefined,
                2,
            ),
        ].filter(isDefined)),
        [
            showAddFigureTagModal,
            handleFigureTagDelete,
            figureTagPermissions?.delete,
            figureTagPermissions?.change,
        ],
    );
    const totalFigureTagsCount = figureTagsData?.figureTagList?.totalCount ?? 0;

    return (
        <Container
            compactContent
            className={className}
            contentClassName={styles.content}
            heading="Tags"
            headerActions={figureTagPermissions?.add && (
                <Button
                    name={undefined}
                    onClick={showAddFigureTagModal}
                    disabled={loadingFigureTags}
                >
                    Add Tag
                </Button>
            )}
            description={(
                <TagsFilter
                    currentFilter={rawFilter}
                    initialFilter={initialFilter}
                    onFilterChange={setFilter}
                />
            )}
            footerContent={(
                <Pager
                    activePage={rawPage}
                    itemsCount={totalFigureTagsCount}
                    maxItemsPerPage={rawPageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {(loadingFigureTags || deletingFigureTag) && <Loading absolute />}
            {totalFigureTagsCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={figureTagsData?.figureTagList?.results}
                        keySelector={keySelector}
                        columns={columns}
                        resizableColumn
                        fixedColumnWidth
                    />
                </SortContext.Provider>
            )}
            {!loadingFigureTags && (
                <TableMessage
                    errored={!!figureTagsError}
                    filtered={!hasNoData(filter)}
                    totalItems={totalFigureTagsCount}
                    emptyMessage="No tags found"
                    emptyMessageWithFilters="No tags found with applied filters"
                    errorMessage="Could not fetch tags"
                />
            )}
            {shouldShowAddFigureTagModal && (
                <Modal
                    onClose={hideAddFigureTagModal}
                    heading={editableFigureTagId ? 'Edit Tag' : 'Add Tag'}
                    size="large"
                    freeHeight
                >
                    <FigureTagForm
                        id={editableFigureTagId}
                        onCreate={handleFigureTagCreate}
                        onFormCancel={hideAddFigureTagModal}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default FigureTagsTable;
