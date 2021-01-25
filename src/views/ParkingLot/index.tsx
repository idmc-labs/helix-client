import React from 'react';

import { _cs } from '@togglecorp/fujs';
import PageHeader from '#components/PageHeader';
import styles from './styles.css';
import ParkingLotTable from '#components/ParkingLotTable';

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
                title="Parking Lot"
            />
            <ParkingLotTable
                className={styles.container}
            />
        </div>
    );
}

export default ParkingLots;
