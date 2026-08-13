import React from 'react';
import { _cs } from '@togglecorp/fujs';

import PageHeader from '#components/PageHeader';

import HulkBulkImportTable from './HulkBulkImportTable';
import styles from './styles.module.css';

interface HulkProps {
    className?: string;
}

function Hulk(props: HulkProps) {
    const { className } = props;
    return (
        <div className={_cs(styles.hulk, className)}>
            <PageHeader
                title="HULK"
            />
            <HulkBulkImportTable
                className={styles.container}
            />
        </div>
    );
}

export default Hulk;
