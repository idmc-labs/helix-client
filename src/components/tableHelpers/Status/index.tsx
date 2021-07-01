import React from 'react';
import {
    IoEllipse,
} from 'react-icons/io5';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

export interface StatusProps {
    className?: string;
    isReviewed?: boolean | null | undefined;
    isSignedOff?: boolean | null | undefined;
    isUnderReview?: boolean | null | undefined;
}

function Status(props: StatusProps) {
    const {
        className,
        isReviewed,
        isSignedOff,
        isUnderReview,
    } = props;

    if (isSignedOff) {
        return (
            <span className={_cs(className, styles.status)}>
                <IoEllipse
                    className={styles.signedOffIcon}
                    title="Signed off"
                />
            </span>
        );
    }

    if (isReviewed) {
        return (
            <span className={_cs(className, styles.status)}>
                <IoEllipse
                    title="Reviewed"
                    className={styles.reviewedIcon}
                />
            </span>
        );
    }

    if (isUnderReview) {
        return (
            <span className={_cs(className, styles.status)}>
                <IoEllipse
                    title="Under review"
                    className={styles.underReviewIcon}
                />
            </span>
        );
    }

    return null;
}

export default Status;
