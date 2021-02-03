import React from 'react';
import { _cs } from '@togglecorp/fujs';

import PageHeader from '#components/PageHeader';
import ParkedItemTable from '#components/ParkedItemTable';

import styles from './styles.css';

interface ParkingLotProps {
    className?: string;
}

function ParkingLot(props: ParkingLotProps) {
    const {
        className,
    } = props;

    return (
        <div className={_cs(styles.parkingLot, className)}>
            <PageHeader
                title="Parking Lot"
            />
            <ParkedItemTable
                className={styles.container}
            />
        </div>
    );
}

export default ParkingLot;
