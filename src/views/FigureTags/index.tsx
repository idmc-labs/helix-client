import React from 'react';

import { _cs } from '@togglecorp/fujs';
import PageHeader from '#components/PageHeader';
import styles from './styles.css';
import FigureTagsTable from '#components/FigureTagsTable';

interface FigureTagsProps {
    className?: string;
}

function FigureTags(props: FigureTagsProps) {
    const {
        className,
    } = props;

    return (
        <div className={_cs(styles.figureTags, className)}>
            <PageHeader
                title="Figure Tags"
            />
            <FigureTagsTable
                className={styles.container}
            />
        </div>
    );
}

export default FigureTags;
