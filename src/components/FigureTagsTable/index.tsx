import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { isDefined } from '@togglecorp/fujs';
import {
    IoIosSearch,
} from 'react-icons/io';
import {
    TextInput,
    Table,
    TableColumn,
    createColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    TableSortDirection,
    Pager,
    Modal,
    Button,
} from '@togglecorp/toggle-ui';

import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import FigureTagForm from '#components/FigureTagForm';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import StringCell, { StringCellProps } from '#components/tableHelpers/StringCell';
import DateCell from '#components/tableHelpers/Date';

import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import useModalState from '#hooks/useModalState';

import { ExtractKeys } from '#types';

import {
    FigureTagListQuery,
    FigureTagListQueryVariables,
    DeleteFigureTagMutation,
    DeleteFigureTagMutationVariables,
} from '#generated/types';

import styles from './styles.css';

type FigureTagFields = NonNullable<NonNullable<FigureTagListQuery['figureTagList']>['results']>[number];

const FIGURE_TAG_LIST = gql`
    query FigureTagList($ordering: String, $page: Int, $pageSize: Int, $name_Icontains: String) {
        figureTagList(ordering: $ordering, page: $page, pageSize: $pageSize, name_Icontains: $name_Icontains) {
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

const defaultSortState = {
    name: 'createdAt',
    direction: TableSortDirection.dsc,
};

const keySelector = (item: FigureTagFields) => item.id;

interface FigureTagsProps {
    className?: string;
}

function FigureTagsTable(props: FigureTagsProps) {
    const {
        className,
    } = props;

    const { sortState, setSortState } = useSortState();
    const validSortState = sortState || defaultSortState;
    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState<string | undefined>();
    const [pageSize, setPageSize] = useState(10);

    const { notify } = useContext(NotificationContext);

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
            name_Icontains: search,
        }),
        [ordering, page, pageSize, search],
    );

    const {
        data: figureTagsData,
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
                    notify({ children: 'Sorry, tag could not be deleted !' });
                }
                if (result) {
                    refetchFigureTags(variables);
                    notify({ children: 'Tag deleted successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

    const handleFigureTagCreate = React.useCallback(() => {
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
    const figureTagPermissions = user?.permissions?.figure;

    const columns = useMemo(
        () => {
            type stringKeys = ExtractKeys<FigureTagFields, string>;

            // Generic columns
            const stringColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellAsHeader: true,
                cellRenderer: StringCell,
                cellRendererParams: (_: string, datum: FigureTagFields) => ({
                    value: datum[colName],
                }),
            });

            const dateColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: DateCell,
                cellRendererParams: (_: string, datum: FigureTagFields) => ({
                    value: datum[colName],
                }),
            });

            // Specific columns
            // eslint-disable-next-line max-len
            const createdByColumn: TableColumn<FigureTagFields, string, StringCellProps, TableHeaderCellProps> = {
                id: 'createdBy',
                title: 'Created By',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: StringCell,
                cellRendererParams: (_, datum) => ({
                    value: datum.createdBy?.fullName,
                }),
            };
            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<FigureTagFields, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    onDelete: figureTagPermissions?.delete ? handleFigureTagDelete : undefined,
                    onEdit: figureTagPermissions?.change ? showAddFigureTagModal : undefined,
                }),
            };

            return [
                createColumn(dateColumn, 'createdAt', 'Created At'),
                createdByColumn,
                createColumn(stringColumn, 'name', 'Name', true),
                actionColumn,
            ].filter(isDefined);
        },
        [
            showAddFigureTagModal,
            setSortState,
            validSortState,
            handleFigureTagDelete,
            figureTagPermissions?.delete,
            figureTagPermissions?.change,
        ],
    );
    const totalFigureTagsCount = figureTagsData?.figureTagList?.totalCount ?? 0;

    return (
        <Container
            className={className}
            contentClassName={styles.content}
            heading="Tags"
            headerActions={(
                <>
                    <TextInput
                        icons={<IoIosSearch />}
                        name="search"
                        value={search}
                        placeholder="Search"
                        onChange={setSearch}
                    />
                    {figureTagPermissions?.add && (
                        <Button
                            name={undefined}
                            onClick={showAddFigureTagModal}
                            disabled={loadingFigureTags}
                        >
                            Add Tag
                        </Button>
                    )}
                </>
            )}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalFigureTagsCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {totalFigureTagsCount > 0 && (
                <Table
                    className={styles.table}
                    data={figureTagsData?.figureTagList?.results}
                    keySelector={keySelector}
                    columns={columns}
                />
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
