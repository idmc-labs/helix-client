import React from 'react';
import { _cs } from '@togglecorp/fujs';
import PageHeader from '#components/PageHeader';
import styles from './styles.css';
import EventsTable from '#components/tables/EventsTable';

interface EventProps {
    className?: string;
}

function IgnoredEvents(props: EventProps) {
    const {
        className,
    } = props;

    return (
        <div className={_cs(styles.events, className)}>
            <PageHeader
                title="Ignored Events"
            />
            <EventsTable
                className={styles.container}
                qaMode="IGNORE_QA"
            />
        </div>
    );
}

export default IgnoredEvents;
