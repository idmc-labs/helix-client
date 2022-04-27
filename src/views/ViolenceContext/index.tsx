import React from 'react';

import { _cs } from '@togglecorp/fujs';
import PageHeader from '#components/PageHeader';

import ViolenceContextTable from './ViolenceContextTable';
import styles from './styles.css';

interface ViolenceContextProps {
    className?: string;
}

function ViolenceContext(props: ViolenceContextProps) {
    const {
        className,
    } = props;

    return (
        <div className={_cs(styles.context, className)}>
            <PageHeader
                title="Violence Context"
            />
            <ViolenceContextTable
                className={styles.container}
            />
        </div>
    );
}

export default ViolenceContext;
