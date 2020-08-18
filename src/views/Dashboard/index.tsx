import React from 'react';

import styles from './styles.css';

function Dashboard() {
    return (
        <div className={styles.dashboard}>
            <h1 className={styles.heading}>
                Dashboard
            </h1>
            <p className={styles.message}>
                Charts go here.
            </p>
        </div>
    );
}

export default Dashboard;
