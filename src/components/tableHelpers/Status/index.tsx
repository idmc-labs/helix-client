import React from 'react';
import {
    IoSquare,
} from 'react-icons/io5';
import { _cs } from '@togglecorp/fujs';

import {
    Event_Review_Status as EventReviewStatus,
    Figure_Review_Status as FigureReviewStatus,
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
                <IoSquare
                    className={styles.signedOffIcon}
                    title="Signed off"
                />
            </span>
        );
    }

    if (status === 'APPROVED') {
        return (
            <span className={_cs(className, styles.status)}>
                <IoSquare
                    title="Approved"
                    className={styles.approvedIcon}
                />
            </span>
        );
    }

    if (status === 'REVIEW_RE_REQUESTED') {
        return (
            <span className={_cs(className, styles.status)}>
                <IoSquare
                    title="Review re-requested"
                    className={styles.reviewRerequestedIcon}
                />
            </span>
        );
    }

    if (status === 'REVIEW_IN_PROGRESS') {
        return (
            <span className={_cs(className, styles.status)}>
                <IoSquare
                    title="Review in-progress"
                    className={styles.reviewInprogressIcon}
                />
            </span>
        );
    }
    if (status === 'APPROVED_BUT_CHANGED') {
        return (
            <span className={_cs(className, styles.status)}>
                <IoSquare
                    title="Review in-progress (previously approved)"
                    className={styles.reviewInprogressIcon}
                />
            </span>
        );
    }
    if (status === 'SIGNED_OFF_BUT_CHANGED') {
        return (
            <span className={_cs(className, styles.status)}>
                <IoSquare
                    title="Review in-progress (previously signed-off)"
                    className={styles.reviewInprogressIcon}
                />
            </span>
        );
    }

    return (
        <span className={_cs(className, styles.status)}>
            <IoSquare
                title="Review not started"
            />
        </span>
    );
}

export default Status;
