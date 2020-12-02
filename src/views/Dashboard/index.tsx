import React, { useContext } from 'react';
import { _cs } from '@togglecorp/fujs';

import DomainContext from '#components/DomainContext';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import MyResources from '#components/MyResources';
import EntriesTable from '#components/EntriesTable';
import EntriesForReview from '#components/EntriesForReview';

import styles from './styles.css';

interface DashboardProps {
    className?: string;
}

function Dashboard(props: DashboardProps) {
    const { className } = props;

    const {
        user,
    } = useContext(DomainContext);

    return (
        <div className={_cs(className, styles.dashboard)}>
            <PageHeader
                title="Dashboard"
            />
            <div className={styles.content}>
                <div className={styles.mainContent}>
                    <div className={styles.top}>
                        <EntriesForReview
                            className={styles.container}
                            heading="For Review"
                            pageSize={5}
                            userId={user?.id}
                            pagerDisabled
                            searchDisabled
                        />
                        <Container
                            className={styles.container}
                            heading="Parking lot"
                            headerActions={(
                                /* TODO: set link */
                                <a
                                    href="#media-monitoring-platform"
                                >
                                    Go to Media Monitoring Platform
                                </a>
                            )}
                        >
                            <div className={styles.dummyContent} />
                        </Container>
                    </div>
                    <div className={styles.bottom}>
                        <EntriesTable
                            className={styles.container}
                            heading="My Latest Entries"
                            pageSize={5}
                            userId={user?.id}
                            pagerDisabled
                            searchDisabled
                        />
                        <Container
                            className={styles.container}
                            heading="IDP Map"
                        >
                            <div className={styles.dummyContent} />
                        </Container>
                        <Container
                            className={styles.container}
                            heading="IDP Trends"
                        >
                            <div className={styles.dummyContent} />
                        </Container>
                    </div>
                </div>
                <div className={styles.sideContent}>
                    <Container
                        className={styles.container}
                        heading="Recent Updates"
                    >
                        <div className={styles.dummyContent} />
                    </Container>
                    <MyResources
                        className={styles.container}
                    />
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
