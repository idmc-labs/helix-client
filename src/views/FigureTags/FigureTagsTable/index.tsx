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
import { PurgeNull } from '#types';
import {
    createTextColumn,
    createActionColumn,
    createDateColumn,
} from '#components/tableHelpers';

import Message from '#components/Message';
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

import FigureTagForm from './FigureTagForm';
import TagsFilter from '../TagsFilter';
import styles from './styles.css';

type FigureTagFields = NonNullable<NonNullable<FigureTagListQuery['figureTagList']>['results']>[number];

const FIGURE_TAG_LIST = gql`
    query FigureTagList($ordering: String, $page: Int, $pageSize: Int, $name: String) {
        figureTagList(ordering: $ordering, page: $page, pageSize: $pageSize, name_Unaccent_Icontains: $name) {
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

        // rawFilter,
        filter,
        setFilter,

        rawPageSize,
        pageSize,
        setPageSize,
    } = useFilterState<PurgeNull<FigureTagListQueryVariables>>({
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
        () => ({
            ordering,
            page,
            pageSize,
            ...filter,
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
            {(loadingFigureTags || deletingFigureTag) && <Loading absolute />}
            {!loadingFigureTags && totalFigureTagsCount <= 0 && (
                <Message
                    message="No tag found."
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
