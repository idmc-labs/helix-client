import React from 'react';
import { _cs } from '@togglecorp/fujs';
import PageHeader from '#components/PageHeader';
import styles from './styles.css';
import EventsTable from '#components/tables/EventsTable';

interface EventProps {
    className?: string;
}

function NoRecommendedFigureEvents(props: EventProps) {
    const {
        className,
    } = props;

    return (
        <div className={_cs(styles.events, className)}>
            <PageHeader
                title="Events with no Recommended Figures"
            />
            <EventsTable
                className={styles.container}
                qaMode="NO_RF"
            />
        </div>
    );
}

export default NoRecommendedFigureEvents;
