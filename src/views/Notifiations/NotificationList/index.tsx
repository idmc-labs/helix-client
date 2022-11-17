import React, { useState, useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    Checkbox,
    TableColumn,
    TableProps,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import {
    createDateColumn,
} from '#components/tableHelpers';

import styles from './styles.css';

const keySelector = (item: string) => item;

interface FakeTypeData {
    id: number;
    name: string;
    description: string;
}

interface NotificationsListHeaderCellProps {
    className: string;
    setSelectAll?: React.Dispatch<React.SetStateAction<boolean | undefined>>;
}

function NotificationListHeaderCell(props: NotificationsListHeaderCellProps) {
    const {
        className,
        setSelectAll,
    } = props;

    return (
        <div className={_cs(styles.countryListHeaderCell, className)}>
            <Checkbox
                name="selectAll"
                value={null}
                onChange={setSelectAll}
                label="Show review"
            />
        </div>
    );
}

interface NotificationDescriptionProps {
    className?: string;
}

function NotificationDescription(props: NotificationDescriptionProps) {
    const { className } = props;

    return (
        <div className={_cs(styles.notificationDescriptionCell, className)}>
            This is the notification descripion
        </div>
    );
}

interface ListProps {
    className?: string;
}

function NotificationList(props: ListProps) {
    const { className } = props;

    const [selectAll, setSelectAll] = useState<boolean | undefined>();

    const notificationListColumn = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const notificationColumn: TableColumn<FakeTypeData, string, NotificationDescriptionProps, NotificationsListHeaderCellProps> = {
                id: 'search',
                title: '',
                headerCellRenderer: NotificationListHeaderCell,
                headerCellRendererClassName: styles.countryListHeaderCell,
                headerCellRendererParams: {
                    selectAll,
                    setSelectAll,
                },
                cellRenderer: NotificationDescription,
                cellRendererParams: (_, datum) => ({
                    title: datum.name,
                }),
                columnWidth: 240,
            };

            return [
                notificationColumn,
                createDateColumn<string, string>(
                    'created_at',
                    'Date Created',
                    (item) => item,
                    { sortable: true },
                ),
            ];
        },
        [selectAll],
    );

    return (
        <Container
            className={_cs(className, styles.notificationList)}
            contentClassName={styles.content}
        >
            <Table
                className={styles.table}
                data={null}
                keySelector={keySelector}
                columns={notificationListColumn}
            />
        </Container>
    );
}

export default NotificationList;
