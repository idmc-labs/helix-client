import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    FaPlus,
    FaEdit,
    FaSearch,
} from 'react-icons/fa';

import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import QuickActionButton from '#components/QuickActionButton';

import styles from './styles.css';

interface PerformanceAndAdminProps {
    className?: string;
}

function PerformanceAndAdmin(props: PerformanceAndAdminProps) {
    const { className } = props;

    return (
        <div className={_cs(className, styles.performanceAndAdmin)}>
            <PageHeader
                className={styles.pageHeader}
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
