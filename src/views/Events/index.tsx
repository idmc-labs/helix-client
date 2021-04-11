import React from 'react';

import { _cs } from '@togglecorp/fujs';
import PageHeader from '#components/PageHeader';
import EventsTable from '#components/tables/EventsTable';

import styles from './styles.css';

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
