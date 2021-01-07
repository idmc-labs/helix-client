import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Wip from '#components/Wip';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import UserRoles from '#components/UserRoles';

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
                <Wip>
                    <Container
                        className={styles.container}
                        heading="For Review"
                    />
                </Wip>
                <UserRoles
                    className={styles.container}
                />
            </div>
        </div>
    );
}

export default PerformanceAndAdmin;
