import React from 'react';
import { _cs } from '@togglecorp/fujs';

import PageHeader from '#components/PageHeader';
import Container from '#components/Container';

import styles from './styles.css';

interface NotificationsProps {
    className?: string;
}

function Notifications(props: NotificationsProps) {
    const { className } = props;

    return (
        <div className={_cs(className, styles.notificationsWrapper)}>
            <Container
                className={_cs(className, styles.sideContent)}
                heading="Filter Options"
                contentClassName={styles.content}
            >
                This is the side bar
            </Container>
            <div className={styles.mainContent}>
                <PageHeader
                    title="Notifications"
                />
                <Container
                    contentClassName={_cs(className)}
                >
                    This is the notification center
                </Container>
            </div>
        </div>
    );
}

export default Notifications;
