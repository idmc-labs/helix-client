import React from 'react';
import { _cs } from '@togglecorp/fujs';

import ReportsTable from '#components/tables/ReportsTable';
import PageHeader from '#components/PageHeader';

import styles from './styles.css';

interface ReportsProps {
    className?: string;
}

function Reports(props: ReportsProps) {
    const { className } = props;

    return (
        <div className={_cs(styles.reports, className)}>
            <PageHeader
                title="Reports"
            />
            <ReportsTable
                className={styles.container}
            />
        </div>
    );
}

export default Reports;
