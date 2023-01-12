import React, { useContext, useCallback, useState, useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    DateRangeDualInput,
    SegmentInput,
    Pager,
    Table,
} from '@togglecorp/toggle-ui';

import {
    NotificationsQuery,
    NotificationsQueryVariables,
} from '#generated/types';
import route from '#config/routes';
import {
    createTextColumn,
    createDateColumn,
} from '#components/tableHelpers';
import SmartLink from '#components/SmartLink';
import DomainContext from '#components/DomainContext';
import Loading from '#components/Loading';
import Message from '#components/Message';
import PageHeader from '#components/PageHeader';
import Container from '#components/Container';
import useDebouncedValue from '#hooks/useDebouncedValue';

import styles from './styles.css';

const NOTIFICATIONS = gql`
    query Notifications(
        $recipient: ID!,
        $types: [String!],
        $page: Int,
        $pageSize: Int,
        $isRead: Boolean,
        $createAtBefore: Date,
        $createdAtAfter: Date,
    ) {
        notifications(
            recipient: $recipient,
            types: $types,
            page: $page,
            pageSize: $pageSize,
            isRead: $isRead,
            createAtBefore: $createAtBefore,
            createdAtAfter: $createdAtAfter,
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

    const { user } = useContext(DomainContext);
    const userId = user?.id;

    const debouncedPage = useDebouncedValue(page);
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
            } : undefined
        ),
        [debouncedPage, createdAtFrom, createdAtTo, pageSize, readState, userId],
    );

    const {
        previousData,
        data: notificationsData = previousData,
        loading: loadingNotifications,
    } = useQuery<NotificationsQuery, NotificationsQueryVariables>(NOTIFICATIONS, {
        skip: !notificationsVariables,
        variables: notificationsVariables,
    });

    const notificationListColumn = useMemo(
        () => ([
            createTextColumn<NotificationType, string>(
                'is_read',
                'Is Read',
                (item) => (item.isRead ? 'Yes' : 'No'),
            ),
            createTextColumn<NotificationType, string>(
                'type',
                'Type',
                (item) => item.type,
            ),
            createTextColumn<NotificationType, string>(
                'actor__full_name',
                'Actor',
                (item) => item.actor?.fullName,
            ),
            createDateColumn<NotificationType, string>(
                'date_created',
                'Date Created',
                (item) => item.createdAt,
            ),
        ]),
        [],
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
