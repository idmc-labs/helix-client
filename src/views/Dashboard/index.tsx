import React from 'react';
import {
    IoMdHeartEmpty,
    IoMdCheckmark,
} from 'react-icons/io';

import Container from '#components/Container';
import Header from '#components/Header';
import QuickActionButton from '#components/QuickActionButton';

import styles from './styles.css';

function Dashboard() {
    return (
        <div className={styles.dashboard}>
            <Container>
                <Header
                    icons={
                        <IoMdHeartEmpty />
                    }
                    heading="Dashboard"
                    actions={(
                        <QuickActionButton name={undefined}>
                            <IoMdCheckmark />
                        </QuickActionButton>
                    )}
                />
                <p className={styles.message}>
                    Charts go here. Woohooo this is awesome.
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    Is it though?
                </p>
            </Container>
        </div>
    );
}

export default Dashboard;
