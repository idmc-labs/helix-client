import React from 'react';
import {
    IoEllipse,
} from 'react-icons/io5';
import { _cs } from '@togglecorp/fujs';

import {
    EventReviewStatus,
    FigureReviewStatus,
    Report_Review_Filter as ReportReviewFilter,
} from '#generated/types';

import styles from './styles.css';

export type ReviewStatus = EventReviewStatus | FigureReviewStatus | ReportReviewFilter;

export interface StatusProps {
    className?: string;
    status: ReviewStatus | null | undefined;
}

function Status(props: StatusProps) {
    const {
        className,
        status,
    } = props;

    if (status === 'SIGNED_OFF') {
        return (
            <span className={_cs(className, styles.status)}>
                <IoEllipse
                    className={styles.signedOffIcon}
                    title="Signed off"
                />
            </span>
        );
    }

    if (status === 'APPROVED') {
        return (
            <span className={_cs(className, styles.status)}>
                <IoEllipse
                    title="Approved"
                    className={styles.approvedIcon}
                />
            </span>
        );
    }

    if (status === 'REVIEW_RE_REQUESTED') {
        return (
            <span className={_cs(className, styles.status)}>
                <IoEllipse
                    title="Review re-requested"
                    className={styles.reviewRerequestedIcon}
                />
            </span>
        );
    }

    if (status === 'REVIEW_IN_PROGRESS') {
        return (
            <span className={_cs(className, styles.status)}>
                <IoEllipse
                    title="Review in-progress"
                    className={styles.reviewInprogressIcon}
                />
            </span>
        );
    }

    return null;
}

export default Status;
