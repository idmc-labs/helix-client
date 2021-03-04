import React from 'react';

import { _cs } from '@togglecorp/fujs';
import PageHeader from '#components/PageHeader';

import FigureTagsTable from './FigureTagsTable';
import styles from './styles.css';

interface FigureTagsProps {
    className?: string;
}

function FigureTags(props: FigureTagsProps) {
    const {
        className,
    } = props;

    return (
        <div className={_cs(styles.tags, className)}>
            <PageHeader
                title="Tags"
            />
            <FigureTagsTable
                className={styles.container}
            />
        </div>
    );
}

export default FigureTags;
