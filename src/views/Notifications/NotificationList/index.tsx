import React, { useMemo, useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    Checkbox,
    TableColumn,
    // TableProps,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import {
    createDateColumn,
    // createButtonActionColumn,
} from '#components/tableHelpers';
import { notificationsData, FakeTypeData } from '#utils/dummyData';

import styles from './styles.css';

const keySelector = (item: FakeTypeData) => item.id;

interface NotificationsListHeaderCellProps {
    className: string;
}

function NotificationListHeaderCell(props: NotificationsListHeaderCellProps) {
    const {
        className,
    } = props;

    const handleChange = useCallback((value: boolean) => {
        console.warn(value);
    }, []);

    return (
        <div className={_cs(styles.countryListHeaderCell, className)}>
            <Checkbox
                name="selectAll"
                value={null}
                onChange={handleChange}
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

    const notificationListColumn = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const notificationDetail: TableColumn<FakeTypeData, string, NotificationDescriptionProps, NotificationsListHeaderCellProps> = {
                id: 'search',
                title: 'Select All',
                headerCellRenderer: NotificationListHeaderCell,
                headerCellRendererClassName: styles.notificationHeaderStyle,
                headerCellRendererParams: {
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
                createDateColumn<FakeTypeData, string>(
                    'date_created',
                    'Date Created',
                    (item) => item?.dateCreated,
                ),
            ];
        },
        [],
    );

    return (
        <Container
            className={_cs(className, styles.notificationList)}
            contentClassName={styles.content}
        >
            <Table
                className={styles.table}
                data={notificationsData}
                keySelector={keySelector}
                columns={notificationListColumn}
            />
        </Container>
    );
}

export default NotificationList;
