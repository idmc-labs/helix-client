import React from 'react';

import styles from './styles.css';

function NewEntry() {
    return (
        <div className={styles.newEntry}>
            <h1 className={styles.heading}>
                NewEntry
            </h1>
            <p className={styles.message}>
                Charts go here.
            </p>
        </div>
    );
}

export default NewEntry;
