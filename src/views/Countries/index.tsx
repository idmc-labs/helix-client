import React from 'react';

import styles from './styles.css';

function Countries() {
    return (
        <div className={styles.countries}>
            <h1 className={styles.heading}>
                Countries
            </h1>
            <p className={styles.message}>
                Charts go here.
            </p>
        </div>
    );
}

export default Countries;
