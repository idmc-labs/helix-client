import React, { useContext, useCallback, useMemo } from 'react';
import { IoEllipse } from 'react-icons/io5';
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
} from '@togglecorp/toggle-ui';

import useFilterState from '#hooks/useFilterState';
import {
    NotificationsQuery,
    NotificationsQueryVariables,
    NotificationCountsQuery,
    NotificationCountsQueryVariables,
    ToggleNotificationReadStatusMutation,
    ToggleNotificationReadStatusMutationVariables,
    NotificationTypeEnum,
} from '#generated/types';
import {
    createTextColumn,
    createDateTimeColumn,
    createCustomActionColumn,
    getWidthFromSize,
} from '#components/tableHelpers';
import BasicItem from '#components/BasicItem';
import NotificationContext from '#components/NotificationContext';
import DomainContext from '#components/DomainContext';
import Loading from '#components/Loading';
import Message from '#components/Message';
import PageHeader from '#components/PageHeader';
import Container from '#components/Container';

import NotificationContent, { Props as NotificationContentProps } from './NotificationContent';
import ActionCell, { ActionProps } from './Action';
import styles from './styles.css';

const NOTIFICATION_COUNTS = gql`
    query NotificationCounts(
        $recipient: ID!,
        $types: [String!],
    ) {
        allNotifications: notifications(
            recipient: $recipient,
            isRead: false,
        ) {
            totalCount
        }
        importantNotifications: notifications(
            recipient: $recipient,
            types: $types,
            isRead: false,
        ) {
            totalCount
        }
    }
`;

interface ReadIndicatorProps {
    isRead: boolean | null | undefined;
}

function ReadIndicator(props: ReadIndicatorProps) {
    const {
        isRead,
    } = props;

    if (isRead) {
        return null;
    }
    return (
        <IoEllipse className={styles.indicator} />
    );
}

interface ClickableItemProps<N, T> {
    children: React.ReactNode;
    className?: string;
    name: N;
    value: T,
    selected?: boolean,
    onClick?: (value: T, name: N) => void;
}

function ClickableItem<N, T>(props: ClickableItemProps<N, T>) {
    const {
        className,
        name,
        value,
        children,
        onClick,
        selected,
    } = props;

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            if (onClick) {
                onClick(value, name);
            }
        },
        [value, name, onClick],
    );

    return (
        <BasicItem
            className={_cs(className)}
            selected={selected}
        >
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a
                // eslint-disable-next-line react/destructuring-assignment
                href="#"
                rel="noreferrer"
                target="_blank"
                onClick={handleClick}
            >
                {children}
            </a>
        </BasicItem>
    );
}

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
                }
                entry {
                    id
                    articleTitle
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
                reviewComment {
                    field
                    id
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

const importantCategories: NotificationTypeEnum[] = [
    'EVENT_ASSIGNED',
    'FIGURE_RE_REQUESTED_REVIEW',
    'FIGURE_UPDATED_IN_APPROVED_EVENT',
    'FIGURE_DELETED_IN_APPROVED_EVENT',
    'FIGURE_UNAPPROVED_IN_APPROVED_EVENT',
    'FIGURE_CREATED_IN_SIGNED_EVENT',
    'FIGURE_UPDATED_IN_SIGNED_EVENT',
    'FIGURE_DELETED_IN_SIGNED_EVENT',
    'FIGURE_UNAPPROVED_IN_SIGNED_EVENT',
    'EVENT_SIGNED_OFF',
    'EVENT_APPROVED',
];

type NotificationType = NonNullable<NonNullable<NotificationsQuery['notifications']>['results']>[number];

const keySelector = (item: NotificationType) => item.id;

interface NotificationsProps {
    className?: string;
}

function Notifications(props: NotificationsProps) {
    const { className } = props;

    interface Filter extends Record<string, unknown> {
        readState: 'all' | 'unread',
        createdAtFrom?: string,
        createdAtTo?: string,
        category: 'all' | 'important',
    }

    const {
        page,
        rawPage,
        setPage,

        ordering,
        // sortState,

        filter,
        rawFilter,
        setFilterField,

        rawPageSize,
        pageSize,
        setPageSize,
    } = useFilterState<Filter>({
        filter: {
            readState: 'unread',
            category: 'all',
        },
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const { user } = useContext(DomainContext);
    const userId = user?.id;

    const notificationCountsVariables = useMemo(
        (): NotificationCountsQueryVariables | undefined => (
            userId ? {
                recipient: userId,
                types: importantCategories ?? undefined,
            } : undefined
        ),
        [userId],
    );

    const {
        previousData: previousNotificationCounts,
        data: notificationCountsData = previousNotificationCounts,
        refetch: refetchNotificationCounts,
    } = useQuery<NotificationCountsQuery, NotificationCountsQueryVariables>(NOTIFICATION_COUNTS, {
        skip: !notificationCountsVariables,
        variables: notificationCountsVariables,
    });

    const handleNotificationsCountRefetch = useCallback(
        () => {
            refetchNotificationCounts(notificationCountsVariables);
        },
        [refetchNotificationCounts, notificationCountsVariables],
    );

    const notificationsVariables = useMemo(
        (): NotificationsQueryVariables | undefined => (
            userId ? {
                recipient: userId,
                page,
                pageSize,
                ordering,
                isRead: filter.readState === 'all'
                    ? undefined
                    : (filter.readState !== 'unread'),
                createdAtAfter: filter.createdAtFrom,
                createdAtBefore: filter.createdAtTo,
                types: filter.category === 'important'
                    ? importantCategories
                    : undefined,
            } : undefined
        ),
        [
            page,
            filter,
            pageSize,
            ordering,
            userId,
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
            update: handleNotificationsCountRefetch,
            onCompleted: (response) => {
                const {
                    toggleNotificationRead: toggleNotificationReadResponse,
                } = response;
                if (!toggleNotificationReadResponse) {
                    return;
                }
                const {
                    errors,
                    result,
                } = toggleNotificationReadResponse;
                if (errors) {
                    notifyGQLError(errors);
                    return;
                }
                if (result) {
                    notify({
                        children: result.isRead
                            ? 'Notification marked as read'
                            : 'Notification marked as unread',
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
            const readStatusColumn: TableColumn<NotificationType, string, ReadIndicatorProps, TableHeaderCellProps> = {
                id: 'is_read',
                title: 'Read?',
                columnWidth: getWidthFromSize('very-small'),
                columnStretch: false,
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                    filterType: undefined,
                    orderable: false,
                    hideable: false,
                },
                cellContainerClassName: styles.isReadColumn,
                cellRenderer: ReadIndicator,
                cellRendererParams: (_, datum: NotificationType): ReadIndicatorProps => ({
                    isRead: datum.isRead,
                }),
            };
            // eslint-disable-next-line max-len
            const notificationContentColumn: TableColumn<NotificationType, string, NotificationContentProps, TableHeaderCellProps> = {
                id: 'type',
                title: 'Type',
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
                readStatusColumn,
                notificationContentColumn,
                createTextColumn<NotificationType, string>(
                    'actor__full_name',
                    'Actor',
                    (item) => item.actor?.fullName,
                ),
                createDateTimeColumn<NotificationType, string>(
                    'date_created',
                    'Date Created',
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
                    'Action',
                    undefined,
                    1,
                ),
            ];
        },
        [handleMarkRead, handleMarkUnread, toggleNotificationReadStatusPending],
    );

    const notifications = notificationsData?.notifications?.results;
    const totalNotificationsCount = notificationsData?.notifications?.totalCount ?? 0;
    const loading = loadingNotifications;

    const allNotificationsCount = notificationCountsData
        ?.allNotifications?.totalCount ?? 0;
    const importantNotificationsCount = notificationCountsData
        ?.importantNotifications?.totalCount ?? 0;

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
                        <ClickableItem<'category', 'all' | 'important'>
                            name="category"
                            value="all"
                            selected={rawFilter.category === 'all'}
                            onClick={setFilterField}
                        >
                            All
                            {allNotificationsCount > 0 && ` (${allNotificationsCount})`}
                        </ClickableItem>
                        <ClickableItem<'category', 'all' | 'important'>
                            name="category"
                            value="important"
                            selected={rawFilter.category === 'important'}
                            onClick={setFilterField}
                        >
                            Important
                            {importantNotificationsCount > 0 && ` (${importantNotificationsCount})`}
                        </ClickableItem>
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
                    heading="Notifications"
                    description={(
                        <div className={styles.filters}>
                            <SegmentInput
                                className={styles.input}
                                keySelector={readStateKeySelector}
                                listContainerClassName={styles.listContainer}
                                label=""
                                labelSelector={readStateLabelSelector}
                                name="readState"
                                onChange={setFilterField}
                                options={filterOptions}
                                value={rawFilter.readState}
                            />
                            <DateRangeDualInput
                                className={styles.input}
                                fromName="createdAtFrom"
                                toName="createdAtTo"
                                fromValue={rawFilter.createdAtFrom}
                                toValue={rawFilter.createdAtTo}
                                fromOnChange={setFilterField}
                                toOnChange={setFilterField}
                            />
                        </div>
                    )}
                    footerContent={(
                        <Pager
                            activePage={rawPage}
                            itemsCount={totalNotificationsCount}
                            maxItemsPerPage={rawPageSize}
                            onActivePageChange={setPage}
                            onItemsPerPageChange={setPageSize}
                        />
                    )}
                >
                    <Table
                        data={notifications}
                        keySelector={keySelector}
                        columns={notificationListColumn}
                        headersHidden
                    />
                    {loading && <Loading absolute />}
                    {!loading && totalNotificationsCount <= 0 && (
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
