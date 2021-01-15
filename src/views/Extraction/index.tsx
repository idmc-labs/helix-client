import React from 'react';
import { useParams } from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';

import PageHeader from '#components/PageHeader';
import ExtractionQuery from '#components/ExtractionQuery';
import styles from './styles.css';

interface ExtractionProps {
    className?: string;
}

function Extraction(props: ExtractionProps) {
    const { className } = props;
    const { queryId } = useParams<{ queryId: string }>();

    return (
        <div className={_cs(styles.extraction, className)}>
            <PageHeader
                title={queryId ? 'Edit Query' : 'New Query'}
            />
            <ExtractionQuery
                className={styles.container}
            />
        </div>
    );
}

export default Extraction;
