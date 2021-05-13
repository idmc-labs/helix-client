import React from 'react';
import { _cs } from '@togglecorp/fujs';
import styles from './styles.css';

interface ProgressProps {
    className?: string;
}

function ProgressBar(props: ProgressProps) {
    const { className } = props;
    return (
        <div className={_cs(styles.progressWrapper, className)}>
            <div className={styles.dataOne}>
                One%
            </div>
            <div className={styles.dataTwo}>
                two%
            </div>
        </div>
    );
}
export default ProgressBar;
