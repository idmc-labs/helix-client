import React from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    DateTime,
} from '@togglecorp/toggle-ui';
import {
    IoDocumentOutline,
    IoInformationCircleSharp,
} from 'react-icons/io5';

import ButtonLikeExternalLink from '#components/ButtonLikeExternalLink';
import {
    Excel_Generation_Status as ExcelGenerationStatus,
    Download_Types as DownloadTypes,
} from '#generated/types';

import styles from './styles.css';

interface DownloadedItemProps {
    className?: string;
    file: string | null | undefined;
    fileSize: number | null | undefined;
    startedDate: string | null | undefined;
    downloadType: DownloadTypes | null | undefined;
    status: ExcelGenerationStatus | null | undefined;
}

function DownloadedItem(props: DownloadedItemProps) {
    const {
        file,
        fileSize,
        startedDate,
        className,
        downloadType,
        status,
    } = props;

    const statusText: {
        [key in Exclude<ExcelGenerationStatus, 'COMPLETED'>]: string;
    } = {
        PENDING: 'The export will start soon.',
        IN_PROGRESS: 'The export has started.',
        KILLED: 'The export has been aborted.',
        FAILED: 'The export has failed.',
    };

    return (
        <div
            className={_cs(styles.downloadItem, className)}
        >
            <div className={styles.exportItem}>
                <span>
                    Export for
                </span>
                <span className={styles.name}>
                    {downloadType}
                </span>
                <span>
                    started on
                </span>
                <DateTime
                    value={startedDate}
                    format="datetime"
                />
            </div>
            {status === 'COMPLETED' && (
                <div className={styles.actions}>
                    {file && (
                        <ButtonLikeExternalLink
                            title="download"
                            link={file}
                            icons={<IoDocumentOutline />}
                            transparent
                        />
                    )}
                    <span>{fileSize}</span>
                    <span>{fileSize && 'KB'}</span>
                </div>
            )}
            {status !== 'COMPLETED' && isDefined(status) && (
                <div className={styles.status}>
                    <IoInformationCircleSharp className={styles.icon} />
                    <div className={styles.text}>
                        {statusText[status]}
                    </div>
                </div>
            )}
        </div>
    );
}

export default DownloadedItem;
