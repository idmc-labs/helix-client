import React, { useContext, useCallback, useState, useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import {
    DateRangeDualInput,
    SegmentInput,
    Pager,
    TableHeaderCell,
    TableHeaderCellProps,
    TableColumn,
    Table,
    useSortState,
} from '@togglecorp/toggle-ui';

import {
    NotificationsQuery,
    NotificationsQueryVariables,
    ToggleNotificationReadStatusMutation,
    ToggleNotificationReadStatusMutationVariables,
} from '#generated/types';
import route from '#config/routes';
import {
    createTextColumn,
    createDateTimeColumn,
    createCustomActionColumn,
    getWidthFromSize,
} from '#components/tableHelpers';
import NotificationContext from '#components/NotificationContext';
import SmartLink from '#components/SmartLink';
import DomainContext from '#components/DomainContext';
import Loading from '#components/Loading';
import Message from '#components/Message';
import PageHeader from '#components/PageHeader';
import Container from '#components/Container';
import useDebouncedValue from '#hooks/useDebouncedValue';

import NotificationContent, { Props as NotificationContentProps } from './NotificationContent';
import ActionCell, { ActionProps } from './Action';
import styles from './styles.css';

const TOGGLE_NOTIFICATION_READ_STATUS = gql`
    mutation ToggleNotificationReadStatus($id: ID!) {
        toggleNotificationRead(id: $id) {
            result {
                id
                isRead
            }
            errors
        }
    }
`;

const NOTIFICATIONS = gql`
    query Notifications(
        $recipient: ID!,
        $types: [String!],
        $page: Int,
        $pageSize: Int,
        $isRead: Boolean,
        $createdAtBefore: Date,
        $createdAtAfter: Date,
        $ordering: String,
    ) {
        notifications(
            recipient: $recipient,
            types: $types,
            page: $page,
            pageSize: $pageSize,
            isRead: $isRead,
            createdAtBefore: $createdAtBefore,
            createdAtAfter: $createdAtAfter,
            ordering: $ordering,
        ) {
            totalCount
            results {
                id
                isRead
                figure {
                    id
                    entry {
                        id
                        articleTitle
                    }
                }
                createdAt
                type
                event {
                    id
                    name
                }
                actor {
                    id
                    fullName
                }
            }
        }
    }
`;

interface BasicEntity {
    id: 'all' | 'unread',
    name: string;
}

const filterOptions: BasicEntity[] = [
    {
        id: 'all',
        name: 'All',
    },
    {
        id: 'unread',
        name: 'Unread',
    },
];

const readStateKeySelector = (item: BasicEntity) => item.id;
const readStateLabelSelector = (item: BasicEntity) => item.name;

type NotificationType = NonNullable<NonNullable<NotificationsQuery['notifications']>['results']>[number];

const keySelector = (item: NotificationType) => item.id;
const notificationDefaultSorting = {
    name: 'created_at',
    direction: 'dsc',
};

interface NotificationsProps {
    className?: string;
}

function Notifications(props: NotificationsProps) {
    const { className } = props;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [readState, setReadState] = useState<'all' | 'unread'>('unread');
    const [createdAtFrom, setCreatedAtFrom] = useState<string | undefined>(undefined);
    const [createdAtTo, setCreatedAtTo] = useState<string | undefined>(undefined);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const { user } = useContext(DomainContext);
    const userId = user?.id;

    const debouncedPage = useDebouncedValue(page);
    const sortState = useSortState();
    const { sorting } = sortState;

    const validNotificationSorting = sorting || notificationDefaultSorting;

    const notificationOrdering = validNotificationSorting.direction === 'asc'
        ? validNotificationSorting.name
        : `-${validNotificationSorting.name}`;
    const notificationsVariables = useMemo(
        (): NotificationsQueryVariables | undefined => (
            userId ? {
                recipient: userId,
                page: debouncedPage,
                pageSize,
                isRead: readState === 'all'
                    ? undefined
                    : (readState !== 'unread'),
                createdAtAfter: createdAtFrom,
                createdAtBefore: createdAtTo,
                ordering: notificationOrdering,
            } : undefined
        ),
        [
            debouncedPage,
            createdAtFrom,
            createdAtTo,
            pageSize,
            readState,
            userId,
            notificationOrdering,
        ],
    );

    const {
        previousData,
        data: notificationsData = previousData,
        loading: loadingNotifications,
    } = useQuery<NotificationsQuery, NotificationsQueryVariables>(NOTIFICATIONS, {
        skip: !notificationsVariables,
        variables: notificationsVariables,
    });

    const [
        toggleNotificationReadStatus,
        { loading: toggleNotificationReadStatusPending },
    ] = useMutation<
        ToggleNotificationReadStatusMutation,
        ToggleNotificationReadStatusMutationVariables
    >(
        TOGGLE_NOTIFICATION_READ_STATUS,
        {
            onCompleted: (response) => {
                const {
                    toggleNotificationRead: toggleNotificationReadResponse,
                } = response;
                if (!toggleNotificationReadResponse) {
                    return;
                }
                const { errors } = toggleNotificationReadResponse;
                if (errors) {
                    notifyGQLError(errors);
                    return;
                }
                notify({
                    children: 'Assignee updated successfully!',
                    variant: 'success',
                });
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
            },
        },
    );

    const handleMarkRead = useCallback((id: string) => {
        toggleNotificationReadStatus({
            variables: {
                id,
            },
        });
    }, [toggleNotificationReadStatus]);

    const handleMarkUnread = useCallback((id: string) => {
        toggleNotificationReadStatus({
            variables: {
                id,
            },
        });
    }, [toggleNotificationReadStatus]);

    const notificationListColumn = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const notificationContentColumn: TableColumn<NotificationType, string, NotificationContentProps, TableHeaderCellProps> = {
                id: 'type',
                title: 'Description',
                columnWidth: getWidthFromSize('large'),
                columnStretch: true,
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                    filterType: undefined,
                    orderable: false,
                    hideable: false,
                },
                cellRenderer: NotificationContent,
                cellRendererParams: (_, datum: NotificationType): NotificationContentProps => ({
                    notification: datum,
                }),
            };
            return [
                notificationContentColumn,
                createTextColumn<NotificationType, string>(
                    'actor__full_name',
                    '',
                    (item) => item.actor?.fullName,
                ),
                createDateTimeColumn<NotificationType, string>(
                    'date_created',
                    '',
                    (item) => item.createdAt,
                ),
                createCustomActionColumn<NotificationType, string, ActionProps>(
                    ActionCell,
                    (_, datum) => ({
                        id: datum.id,
                        onMarkRead: datum.isRead ? undefined : handleMarkRead,
                        onMarkUnread: datum.isRead ? handleMarkUnread : undefined,
                        disabled: toggleNotificationReadStatusPending,
                    }),
                    'action',
                    '',
                    undefined,
                    'small',
                ),
            ];
        },
        [handleMarkRead, handleMarkUnread, toggleNotificationReadStatusPending],
    );

    const handleReadStateChange = useCallback((value: 'all' | 'unread') => {
        setReadState(value);
        setPage(1);
    }, []);

    const handleCreatedAtFromChange = useCallback((value: string | undefined) => {
        setCreatedAtFrom(value);
        setPage(1);
    }, []);

    const handleCreatedAtToChange = useCallback((value: string | undefined) => {
        setCreatedAtTo(value);
        setPage(1);
    }, []);

    const handlePageSizeChange = useCallback(
        (value: number) => {
            setPageSize(value);
            setPage(1);
        },
        [],
    );

    const notifications = notificationsData?.notifications?.results;
    const totalNotificationsCount = notificationsData?.notifications?.totalCount ?? 0;

    return (
        <div className={_cs(className, styles.notificationsWrapper)}>
            <div className={styles.sideContent}>
                <Container
                    className={styles.stickyContainer}
                    contentClassName={styles.content}
                    heading="Categories"
                >
                    <div className={styles.itemRow}>
                        {/* FIXME: handle this */}
                        <SmartLink
                            className={styles.categoryName}
                            route={route.notifications}
                        >
                            All
                        </SmartLink>
                        <SmartLink
                            className={styles.categoryName}
                            route={route.notifications}
                        >
                            Important
                        </SmartLink>
                    </div>
                </Container>
            </div>
            <div className={styles.mainContent}>
                <PageHeader
                    title="Notifications"
                />
                <Container
                    contentClassName={styles.notificationsContent}
                    compactContent
                    description={(
                        <div className={styles.filters}>
                            <SegmentInput
                                className={styles.input}
                                keySelector={readStateKeySelector}
                                listContainerClassName={styles.listContainer}
                                label=""
                                labelSelector={readStateLabelSelector}
                                name="filterOption"
                                onChange={handleReadStateChange}
                                options={filterOptions}
                                value={readState}
                            />
                            <DateRangeDualInput
                                className={styles.input}
                                fromName="date"
                                toName="date"
                                fromValue={createdAtFrom}
                                toValue={createdAtTo}
                                fromOnChange={handleCreatedAtFromChange}
                                toOnChange={handleCreatedAtToChange}
                            />
                        </div>
                    )}
                    footerContent={(
                        <Pager
                            activePage={page}
                            itemsCount={totalNotificationsCount}
                            maxItemsPerPage={pageSize}
                            onActivePageChange={setPage}
                            onItemsPerPageChange={handlePageSizeChange}
                        />
                    )}
                >
                    <Table
                        className={styles.table}
                        data={notifications}
                        keySelector={keySelector}
                        columns={notificationListColumn}
                        // FIXME:
                        rowClassName={(_, val) => (!val.isRead ? styles.read : undefined)}
                    />
                    {loadingNotifications && <Loading absolute />}
                    {!loadingNotifications && totalNotificationsCount <= 0 && (
                        <Message
                            message="No notifications found."
                        />
                    )}
                </Container>
            </div>
        </div>
    );
}

export default Notifications;
