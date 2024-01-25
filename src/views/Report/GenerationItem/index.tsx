import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    IoDocumentOutline,
    IoFolderOutline,
    IoInformationCircleOutline,
} from 'react-icons/io5';

import DateTime from '#components/DateTime';
import ButtonLikeExternalLink from '#components/ButtonLikeExternalLink';
import {
    Report_Generation_Status as ReportGenerationStatus,
} from '#generated/types';

import styles from './styles.css';

interface GenerationItemProps {
    className?: string;
    user: { id: string; fullName?: string; } | null | undefined;
    date: string | null | undefined;
    fullReport: string | null | undefined;
    snapshot: string | null | undefined;
    status: ReportGenerationStatus;
}

function GenerationItem(props: GenerationItemProps) {
    const {
        user,
        date,
        className,
        fullReport,
        snapshot,
        status,
    } = props;

    const statusText: {
        [key in Exclude<ReportGenerationStatus, 'COMPLETED'>]: string;
    } = {
        PENDING: 'The export will start soon.',
        IN_PROGRESS: 'The export has started.',
        KILLED: 'The export has been aborted.',
        FAILED: 'The export has failed.',
    };

    return (
        <div
            className={_cs(styles.generationItem, className)}
        >
            <div className={styles.exportItem}>
                <span className={styles.name}>
                    {user?.fullName ?? 'Anon'}
                </span>
                <span>
                    signed off this report on
                </span>
                <DateTime
                    value={date}
                    format="datetime"
                />
            </div>
            {status === 'COMPLETED' && (
                <div className={styles.actions}>
                    {fullReport && (
                        <ButtonLikeExternalLink
                            title="export.xlsx"
                            link={fullReport}
                            icons={<IoDocumentOutline />}
                            transparent
                        />
                    )}
                    {snapshot && (
                        <ButtonLikeExternalLink
                            title="snapshot.xlsx"
                            link={snapshot}
                            icons={<IoFolderOutline />}
                            transparent
                        />
                    )}
                </div>
            )}
            {status !== 'COMPLETED' && (
                <div className={styles.status}>
                    <IoInformationCircleOutline className={styles.icon} />
                    <div className={styles.text}>
                        {statusText[status]}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GenerationItem;
