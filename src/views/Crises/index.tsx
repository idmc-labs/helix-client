import React from 'react';
import { _cs } from '@togglecorp/fujs';

import PageHeader from '#components/PageHeader';
import CrisesTable from '#components/tables/CrisesTable';

import styles from './styles.css';

interface CrisesProps {
    className?: string;
}

function Crises(props: CrisesProps) {
    const { className } = props;

    return (
        <div className={_cs(styles.crises, className)}>
            <PageHeader
                title="Crises"
            />
            <CrisesTable
                className={styles.container}
            />
        </div>
    );
}

export default Crises;
