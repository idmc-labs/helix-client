import React from 'react';

import Card from '#components/Card';

import styles from './styles.css';

function Dashboard() {
    return (
        <div className={styles.dashboard}>
            <Card
                title="Dashboard"
            >
                <p className={styles.message}>
                    Charts go here.
                </p>
            </Card>
        </div>
    );
}

export default Dashboard;
