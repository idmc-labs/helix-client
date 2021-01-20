import React from 'react';

import { _cs } from '@togglecorp/fujs';
import PageHeader from '#components/PageHeader';
import styles from './styles.css';
import ParkingLotsTable from '#components/ParkingLotsTable';

interface ParkingLotsProps {
    className?: string;
}

function ParkingLots(props: ParkingLotsProps) {
    const {
        className,
    } = props;

    return (
        <div className={_cs(styles.parkingLots, className)}>
            <PageHeader
                title="Parking Lots"
            />
            <ParkingLotsTable
                className={styles.container}
            />
        </div>
    );
}

export default ParkingLots;
