import React, { useContext } from 'react';
import { _cs } from '@togglecorp/fujs';

import Wip from '#components/Wip';
import DomainContext from '#components/DomainContext';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import MyResources from '#components/MyResources';
import EntriesTable from '#components/EntriesTable';
import EntriesForReview from '#components/EntriesForReview';
import ParkingLotTable from '#components/ParkingLotTable';

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
                            pageSize={10}
                        />
                        <ParkingLotTable
                            className={styles.container}
                            headerActions={(
                                /* TODO: set link */
                                <a
                                    href="#media-monitoring-platform"
                                >
                                    Go to Media Monitoring Platform
                                </a>
                            )}
                            defaultUser={user?.id}
                            defaultStatus="TO_BE_REVIEWED"
                            detailsHidden
                            searchHidden
                            actionsHidden
                        />
                    </div>
                    <div className={styles.bottom}>
                        <EntriesTable
                            className={styles.largeContainer}
                            heading="My Latest Entries"
                            pageSize={5}
                            userId={user?.id}
                            pagerDisabled
                            searchDisabled
                        />
                        <Wip>
                            <Container
                                className={styles.container}
                                heading="IDP Map"
                            />
                        </Wip>
                        <Wip>
                            <Container
                                className={styles.container}
                                heading="IDP Trends"
                            />
                        </Wip>
                    </div>
                </div>
                <div className={styles.sideContent}>
                    <Wip>
                        <Container
                            className={styles.container}
                            heading="Recent Updates"
                        />
                    </Wip>
                    <MyResources
                        className={styles.container}
                    />
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
