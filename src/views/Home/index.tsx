import React from 'react';

import styles from './styles.css';

const Home = () => (
    <div className={styles.home}>
        <h1 className={styles.heading}>
            Home
        </h1>
        <p className={styles.message}>
            This is your homepage.
        </p>
    </div>
);

export default Home;
