import React from 'react';
import { _cs } from '@togglecorp/fujs';

import PageHeader from '#components/PageHeader';
import EntriesTable from '#components/EntriesTable';

import styles from './styles.css';

interface ExtractionProps {
    className?: string;
}

function Extraction(props: ExtractionProps) {
    const { className } = props;

    return (
        <div className={_cs(styles.extraction, className)}>
            <PageHeader
                title="New Query"
            />
            <EntriesTable
                className={styles.container}
            />
        </div>
    );
}

export default Extraction;
