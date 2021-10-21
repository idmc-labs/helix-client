import React from 'react';
import { _cs } from '@togglecorp/fujs';
import styles from './styles.css';
import RecommendedFiguresTable from './RecommendedFiguresTable';
import NoRecommendedFiguresTable from './NoRecommendedFiguresTable';
import IgnoredEventsTable from './IgnoredEventsTable';

interface QAProps {
    className?: string;
}

function QADashboard(props: QAProps) {
    const {
        className,
    } = props;

    return (
        <div className={_cs(styles.qaEvents, className)}>
            <RecommendedFiguresTable />
            <NoRecommendedFiguresTable />
            <IgnoredEventsTable />
        </div>
    );
}

export default QADashboard;
