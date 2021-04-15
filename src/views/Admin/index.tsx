import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Wip from '#components/Wip';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';

import UserRoles from './UserRoles';
import styles from './styles.css';

interface AdminProps {
    className?: string;
}

function Admin(props: AdminProps) {
    const { className } = props;

    return (
        <div className={_cs(className, styles.admin)}>
            <PageHeader
                title="Admin"
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

export default Admin;
