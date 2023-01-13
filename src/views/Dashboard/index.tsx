import React, { useContext } from 'react';
import { _cs } from '@togglecorp/fujs';

import Wip from '#components/Wip';
import DomainContext from '#components/DomainContext';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import MyResources from '#components/lists/MyResources';
import ParkedItemTable from '#components/tables/ParkedItemTable';

import styles from './styles.css';
import EventsEntriesFiguresTable from '#components/tables/EventsEntriesFiguresTable';

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
                        <Wip>
                            <Container
                                className={styles.container}
                                heading="For Review"
                            />
                        </Wip>
                        <ParkedItemTable
                            className={styles.container}
                            headerActions={(
                                <a
                                    href={process.env.REACT_APP_MMP_ENDPOINT ?? '#'}
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    Go to Media Monitoring Platform
                                </a>
                            )}
                            defaultUser={user?.id}
                            defaultStatus="TO_BE_REVIEWED"
                            detailsHidden
                            searchHidden
                            addButtonHidden
                            pageChangeHidden
                        />
                    </div>
                    <div className={styles.bottom}>
                        <EventsEntriesFiguresTable
                            className={styles.largeContainer}
                            pageSize={5}
                            userId={user?.id}
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
