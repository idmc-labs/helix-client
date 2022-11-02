import React, { useState, useContext } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    Tab,
    Tabs,
    TabPanel,
} from '@togglecorp/toggle-ui';
import Container from '#components/Container';
import EventsTable from '#components/tables/EventsTable';
import DomainContext from '#components/DomainContext';
import PageHeader from '#components/PageHeader';

import styles from './styles.css';

interface QAProps {
    className?: string;
}

function QADashboard(props: QAProps) {
    const {
        className,
    } = props;

    const {
        user,
    } = useContext(DomainContext);

    const [selectedTab, setSelectedTab] = useState<
        'EventsWithMultipleRecommendedFigures' | 'EventsWithNoRecommendedFigures' | 'IgnoredEvents' | undefined
    >('EventsWithMultipleRecommendedFigures');

    return (
        <div className={_cs(styles.qaEvents, className)}>
            <Tabs
                value={selectedTab}
                onChange={setSelectedTab}
            >
                <div className={styles.sideContent}>
                    <Container
                        className={styles.sidePaneContainer}
                        contentClassName={styles.sidePaneContent}
                    >
                        <Tab
                            name="EventsWithMultipleRecommendedFigures"
                        >
                            Events with multiple recommended figures
                        </Tab>
                        <Tab
                            name="EventsWithNoRecommendedFigures"
                        >
                            Events with no recommended figures
                        </Tab>
                        <Tab
                            name="AssignedEvents"
                        >
                            Assigned Events
                        </Tab>
                        <Tab
                            name="IgnoredEvents"
                        >
                            Ignored Events
                        </Tab>
                    </Container>
                </div>
                <div className={styles.mainContent}>
                    <PageHeader
                        title="QA"
                    />
                    <TabPanel name="EventsWithMultipleRecommendedFigures">
                        <EventsTable
                            className={styles.container}
                            qaMode="MULTIPLE_RF"
                            title="Events with multiple recommended figures"
                        />
                    </TabPanel>
                    <TabPanel name="EventsWithNoRecommendedFigures">
                        <EventsTable
                            className={styles.container}
                            qaMode="NO_RF"
                            title="Events with no recommended figures"
                        />
                    </TabPanel>
                    <TabPanel name="AssignedEvents">
                        <EventsTable
                            className={styles.container}
                            title="Assigned events"
                            assignee={user?.id}
                        />
                    </TabPanel>
                    <TabPanel name="IgnoredEvents">
                        <EventsTable
                            className={styles.container}
                            qaMode="IGNORE_QA"
                            title="Ignored events"
                        />
                    </TabPanel>
                </div>
            </Tabs>
        </div>
    );
}

export default QADashboard;
