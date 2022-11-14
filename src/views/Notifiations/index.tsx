import React, { useState, useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    TabList,
    Tab,
    Tabs,
    TabPanel,
    DateInput,
} from '@togglecorp/toggle-ui';

import PageHeader from '#components/PageHeader';
import Container from '#components/Container';

import styles from './styles.css';
import NotificationCategory from './NotificationCategory';

type Tabs = 'all' | 'unread';

interface NotificationsProps {
    className?: string;
}

function Notifications(props: NotificationsProps) {
    const { className } = props;

    const [selectedTab, setSelectedTab] = useState<Tabs | undefined>('all');

    const handleNotificatiionsDate = useMemo(() => {
        // eslint-disable-next-line no-console
        console.log('Clicked date selector for notifications::');
    }, []);

    return (
        <div className={_cs(className, styles.notificationsWrapper)}>
            <Container
                className={_cs(className, styles.sideContent)}
                heading="Categories"
                contentClassName={styles.content}
            >
                <NotificationCategory />
            </Container>
            <div className={styles.mainContent}>
                <PageHeader
                    title="Notifications"
                />
                <Tabs
                    value={selectedTab}
                    onChange={setSelectedTab}
                >
                    <Container
                        className={_cs(className, styles.notificationsTable)}
                        tabs={(
                            <TabList>
                                <Tab
                                    name="all"
                                >
                                    All
                                </Tab>
                                <Tab
                                    name="unread"
                                >
                                    Unread
                                </Tab>
                            </TabList>
                        )}
                        contentClassName={_cs(className, styles.content)}
                        headerClassName={styles.notificationsTabHeader}
                        headerActions={(
                            <DateInput
                                value="Date"
                                onChange={handleNotificatiionsDate}
                                name="startDate"
                                error={undefined}
                            />
                        )}
                    >
                        <TabPanel name="all">
                            ALL notifications are up to date.
                        </TabPanel>
                        <TabPanel name="unread">
                            This is the UNREAD SECTION.
                        </TabPanel>
                    </Container>
                </Tabs>
            </div>
        </div>
    );
}

export default Notifications;
