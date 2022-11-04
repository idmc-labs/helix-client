import React from 'react';

import PageHeader from '#components/PageHeader';
import UrlPreview from '#components/UrlPreview';

import styles from './styles.css';

function FigureAndPreview() {
    return (
        <div className={styles.container}>
            <div className={styles.figureContainer}>
                <PageHeader
                    title="Figure"
                />
                <UrlPreview
                    className={styles.preview}
                    url={undefined}
                />
            </div>
            <div className={styles.previewContainer}>
                <PageHeader
                    title="Preview"
                />
                <UrlPreview
                    className={styles.preview}
                    url={undefined}
                />
            </div>

        </div>
    );
}

export default FigureAndPreview;
