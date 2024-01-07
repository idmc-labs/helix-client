import React, { useContext } from 'react';
import { _cs } from '@togglecorp/fujs';

import DomainContext from '#components/DomainContext';
import PageHeader from '#components/PageHeader';
import MyResources from '#components/lists/MyResources';
import ParkedItemTable from '#components/tables/ParkedItemTable';

import CrisesEventsEntriesFiguresTable from './CrisesEventsEntriesFiguresTable';
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
                            assignedUser={user?.id}
                            status="TO_BE_REVIEWED"
                        />
                    </div>
                    {user && (
                        <div className={styles.bottom}>
                            <CrisesEventsEntriesFiguresTable
                                className={styles.largeContainer}
                                userId={user.id}
                            />
                        </div>
                    )}
                </div>
                <div className={styles.sideContent}>
                    <MyResources
                        className={styles.container}
                    />
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
