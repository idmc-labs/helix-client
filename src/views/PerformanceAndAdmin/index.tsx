import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Container from '#components/Container';
import PageHeader from '#components/PageHeader';

import styles from './styles.css';

interface PerformanceAndAdminProps {
    className?: string;
}

function PerformanceAndAdmin(props: PerformanceAndAdminProps) {
    const { className } = props;

    return (
        <div className={_cs(className, styles.performanceAndAdmin)}>
            <PageHeader
                title="Performance And Admin"
            />
            <div className={styles.content}>
                <Container
                    className={styles.container}
                    heading="For Review"
                >
                    <div className={styles.dummyContent} />
                    <div className={styles.dummyContent} />
                </Container>
                <Container
                    className={styles.container}
                    heading="User Roles"
                >
                    <div className={styles.dummyContent} />
                </Container>
            </div>
        </div>
    );
}

export default PerformanceAndAdmin;
