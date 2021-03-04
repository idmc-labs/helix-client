import React from 'react';
import { _cs } from '@togglecorp/fujs';

import PageHeader from '#components/PageHeader';

import ActorTable from './ActorTable';
import styles from './styles.css';

interface ActorsProps {
    className?: string;
}

function Actors(props: ActorsProps) {
    const { className } = props;
    return (
        <div className={_cs(styles.actors, className)}>
            <PageHeader
                title="Actors"
            />
            <ActorTable
                className={styles.container}
            />
        </div>
    );
}

export default Actors;
