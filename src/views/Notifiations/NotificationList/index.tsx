import React, { useState, useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    Checkbox,
    TableColumn,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import {
    createDateColumn,
    createButtonActionColumn,
} from '#components/tableHelpers';
import { NotificationsData } from '#utils/dummyData';

import styles from './styles.css';

const keySelector = (item: string) => item;

interface FakeTypeData {
    id: string,
    section: string,
    description: string,
    dateCreated: number,
}

interface NotificationsListHeaderCellProps {
    className: string;
    selectAll?: boolean;
    setSelectAll: React.Dispatch<React.SetStateAction<boolean>>;
}

function NotificationListHeaderCell(props: NotificationsListHeaderCellProps) {
    const {
        className,
        selectAll,
        setSelectAll,
    } = props;

    const handleSelectNotification = useMemo(() => {
        // eslint-disable-next-line no-console
        console.log('Clicked each notification::');
        setSelectAll(true);
    }, [setSelectAll]);

    return (
        <div className={_cs(styles.countryListHeaderCell, className)}>
            <Checkbox
                name="selectAll"
                value={selectAll}
                onChange={handleSelectNotification}
                label="Select All"
            />
        </div>
    );
}

interface NotificationDescriptionProps {
    className?: string;
    notificationHeader?: string;
    notificationSubheader?: string;
}

function NotificationDescription(props: NotificationDescriptionProps) {
    const {
        className,
        notificationHeader,
        notificationSubheader,
    } = props;

    return (
        <div className={_cs(styles.descriptionCell, className)}>
            <div className={styles.notificationHeader}>
                {notificationHeader}
            </div>
            <div className={styles.notificationInfo}>
                {notificationSubheader}
            </div>
        </div>
    );
}

interface ListProps {
    className?: string;
}

function NotificationList(props: ListProps) {
    const { className } = props;

    const [selectAll, setSelectAll] = useState<boolean>(false);
    const [readEmail, setReadEmail] = useState<boolean | undefined>(false);

    const handleMarkNotifications = useMemo(() => {
        // eslint-disable-next-line no-console
        console.log('Clicked handle mark notifications');
    }, []);

    const notificationListColumn = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const notificationDetail: TableColumn<FakeTypeData, string, NotificationDescriptionProps, NotificationsListHeaderCellProps> = {
                id: 'search',
                title: 'Select All',
                headerCellRenderer: NotificationListHeaderCell,
                headerCellRendererClassName: styles.notificationHeaderStyle,
                headerCellRendererParams: {
                    selectAll,
                    setSelectAll,
                },
                cellRenderer: NotificationDescription,
                cellRendererParams: (_, datum) => ({
                    notificationHeader: datum.section,
                    notificationSubheader: datum.description,
                }),
                columnWidth: 750,
            };

            return [
                notificationDetail,
                createDateColumn<NotificationDescriptionProps, string>(
                    'date_created',
                    'Date Created',
                    (item) => item?.className,
                ),
                createButtonActionColumn<string, string>(
                    'action',
                    '',
                    (item) => ({
                        id: item,
                        title: readEmail ? 'Mark as unread' : 'Mark as read',
                        onClick: handleMarkNotifications,
                    }),
                ),
            ];
        },
        [
            readEmail,
            selectAll,
            handleMarkNotifications,
        ],
    );

    return (
        <Container
            className={_cs(className, styles.notificationList)}
            contentClassName={styles.content}
        >
            <Table
                className={styles.table}
                data={NotificationsData}
                keySelector={keySelector}
                columns={notificationListColumn}
            />
        </Container>
    );
}

export default NotificationList;
