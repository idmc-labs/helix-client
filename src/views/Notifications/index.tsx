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
import {
    BasicEntity,
} from '#types';
import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';
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
    query Notifications($recipient: ID!) {
        notifications(recipient: $recipient) {
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
            }
        }
    }
`;

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

type FakeTypeData = NonNullable<NonNullable<NotificationsQuery['notifications']>['results']>[number];

const keySelector = (item: FakeTypeData) => item.id;

interface NotificationsProps {
    className?: string;
}

function Notifications(props: NotificationsProps) {
    const { className } = props;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const debouncedPage = useDebouncedValue(page);

    const { user } = useContext(DomainContext);

    const userId = user?.id;

    const notificationsVariables = userId ? {
        recipient: userId,
        page: debouncedPage,
        pageSize,
    } : undefined;

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
            createTextColumn<FakeTypeData, string>(
                'type',
                'Type',
                (item) => item.type,
            ),
            createTextColumn<FakeTypeData, string>(
                'is_read',
                'Is Read',
                (item) => (item.isRead ? 'Yes' : 'No'),
            ),
            createDateColumn<FakeTypeData, string>(
                'date_created',
                'Date Created',
                (item) => item.createdAt,
            ),
        ]),
        [],
    );

    const handleChange = useCallback(() => {
        // eslint-disable-next-line no-console
        console.log('Input changed');
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
                        <SmartLink
                            className={styles.categoryName}
                            route={route.notifications}
                        >
                            Others
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
                                keySelector={basicEntityKeySelector}
                                listContainerClassName={styles.listContainer}
                                label=""
                                labelSelector={basicEntityLabelSelector}
                                name="filterOption"
                                onChange={handleChange}
                                options={filterOptions}
                                value="all"
                            />
                            <DateRangeDualInput
                                className={styles.input}
                                fromName="date"
                                toName="date"
                                fromValue={undefined}
                                toValue={undefined}
                                fromOnChange={handleChange}
                                toOnChange={handleChange}
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
