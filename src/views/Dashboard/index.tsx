import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    FaPlus,
    FaEdit,
    FaSearch,
} from 'react-icons/fa';

import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import QuickActionButton from '#components/QuickActionButton';

import styles from './styles.css';

interface DashboardProps {
    className?: string;
}

function Dashboard(props: DashboardProps) {
    const { className } = props;

    return (
        <div className={_cs(className, styles.dashboard)}>
            <PageHeader
                title="Dashboard"
            />
            <div className={styles.content}>
                <div className={styles.mainContent}>
                    <div className={styles.top}>
                        <Container
                            className={styles.container}
                            heading="For Review"
                        >
                            <div className={styles.dummyContent} />
                        </Container>
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
                        <Container
                            className={styles.container}
                            heading="My Latest Entries"
                        >
                            <div className={styles.dummyContent} />
                        </Container>
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
                    <Container
                        className={styles.container}
                        heading="My Resources"
                        headerActions={(
                            <>
                                <QuickActionButton name={undefined}>
                                    <FaSearch />
                                </QuickActionButton>
                                <QuickActionButton name={undefined}>
                                    <FaPlus />
                                </QuickActionButton>
                                <QuickActionButton name={undefined}>
                                    <FaEdit />
                                </QuickActionButton>
                            </>
                        )}
                    >
                        <div className={styles.dummyContent} />
                    </Container>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
