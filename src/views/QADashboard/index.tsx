import React from 'react';
import { _cs } from '@togglecorp/fujs';
import EventsTable from '#components/tables/EventsTable';
import PageHeader from '#components/PageHeader';

import styles from './styles.css';

interface QAProps {
    className?: string;
}

function QADashboard(props: QAProps) {
    const {
        className,
    } = props;

    return (
        <div className={_cs(styles.qaEvents, className)}>
            <PageHeader
                title="QA"
            />
            <EventsTable
                className={styles.container}
                qaMode="MULTIPLE_RF"
                title="Events with multiple recommended figures"
            />
            <EventsTable
                className={styles.container}
                qaMode="NO_RF"
                title="Events with no recommended figures"
            />
            <EventsTable
                className={styles.container}
                qaMode="IGNORE_QA"
                title="Ignored events"
            />
        </div>
    );
}

export default QADashboard;
