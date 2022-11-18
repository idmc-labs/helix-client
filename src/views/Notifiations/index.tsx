import React, { useState, useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    Tabs,
    Checkbox,
    DateRangeInput,
    SegmentInput,
} from '@togglecorp/toggle-ui';
import {
    BasicEntity,
} from '#types';
import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';
import PageHeader from '#components/PageHeader';
import Container from '#components/Container';

import styles from './styles.css';
import NotificationCategory from './NotificationCategory';

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

type Tabs = 'all' | 'unread';

interface NotificationsProps {
    className?: string;
}

function Notifications(props: NotificationsProps) {
    const { className } = props;

    const [selectedTab, setSelectedTab] = useState<Tabs | undefined>('all');

    const handleChange = useCallback(() => {
        // eslint-disable-next-line no-console
        console.log('Input changed');
    }, []);

    return (
        <div className={_cs(className, styles.notificationsWrapper)}>
            <div className={styles.sideContent}>
                <Container
                    className={styles.stickyContainer}
                    contentClassName={styles.content}
                    heading="Categories"
                >
                    <NotificationCategory />
                </Container>
            </div>
            <div className={styles.mainContent}>
                <PageHeader
                    title="Notifications"
                />
                <div className={styles.filters}>
                    <SegmentInput
                        keySelector={basicEntityKeySelector}
                        label=""
                        labelSelector={basicEntityLabelSelector}
                        name="filterOption"
                        onChange={handleChange}
                        options={filterOptions}
                        value="all"
                    />
                    <DateRangeInput
                        name="date"
                        value={undefined}
                        onChange={handleChange}
                    />
                </div>

                <Tabs
                    value={selectedTab}
                    onChange={setSelectedTab}
                >
                    <Container
                        contentClassName={styles.notificationsContent}
                        compactContent
                        heading={(
                            <Checkbox
                                name="selectAll"
                                label="Select all"
                                onChange={handleChange}
                                value={false}
                            />
                        )}
                    >
                        Notifications go here
                    </Container>
                </Tabs>
            </div>
        </div>
    );
}

export default Notifications;
