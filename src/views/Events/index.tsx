import React from 'react';

import { _cs } from '@togglecorp/fujs';
import PageHeader from '#components/PageHeader';
import styles from './styles.css';
import EventsTable from '#components/EventsTable';

interface EventsProps {
    className?: string;
}

function Events(props: EventsProps) {
    const {
        className,
    } = props;

    return (
        <div className={_cs(styles.events, className)}>
            <PageHeader
                title="Events"
            />
            <EventsTable
                className={styles.container}
            />
        </div>
    );
}

export default Events;
