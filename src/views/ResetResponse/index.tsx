import React from 'react';
import { IoIosCheckmarkCircleOutline } from 'react-icons/io';
import BrandHeader from '#components/BrandHeader';
import styles from './styles.css';

function ResetResponse() {
    return (
        <div className={styles.resetPassword}>
            <div className={styles.resetFormContainer}>
                <BrandHeader className={styles.header} />
                <div className={styles.resetMessage}>
                    <h2><IoIosCheckmarkCircleOutline /> Reset Successful !</h2>
                </div>
            </div>
        </div>
    );
}

export default ResetResponse;
