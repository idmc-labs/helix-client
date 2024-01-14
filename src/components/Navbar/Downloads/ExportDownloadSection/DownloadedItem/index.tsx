import React from 'react';
import { _cs, isDefined, isNotDefined } from '@togglecorp/fujs';
import {
    DateTime,
    Numeral,
} from '@togglecorp/toggle-ui';
import {
    IoDocumentOutline,
    IoInformationCircleOutline,
} from 'react-icons/io5';

import {
    diff,
    formatElapsedTime,
} from '#utils/common';
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
    completedDate: string | null | undefined;
    createdDate: string | null | undefined;
    downloadType: DownloadTypes | null | undefined;
    status: ExcelGenerationStatus | null | undefined;
}

// TODO: move this to utils
interface FilesizeProps {
    className?: string;
    value: number | undefined | null,
    base?: 1024 | 1000,
}

const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
function Filesize(props: FilesizeProps) {
    const {
        value,
        className,
        base = 1024,
    } = props;

    if (isNotDefined(value)) {
        return null;
    }
    if (value === 0) {
        return (
            <Numeral
                className={className}
                value={0}
                suffix="B"
            />
        );
    }

    const index = Math.min(
        Math.floor(Math.log(value) / Math.log(base)),
        sizes.length - 1,
    );

    const finalValue = value / (base ** index);
    const suffix = sizes[index];

    return (
        <Numeral
            className={className}
            value={finalValue}
            suffix={suffix}
        />
    );
}

function DownloadedItem(props: DownloadedItemProps) {
    const {
        file,
        fileSize,
        startedDate,
        completedDate,
        createdDate,
        className,
        downloadType,
        status,
    } = props;

    const statusText: {
        [key in Exclude<ExcelGenerationStatus, 'COMPLETED'>]: string;
    } = {
        PENDING: 'The export should start soon.',
        IN_PROGRESS: 'The export has started.',
        KILLED: 'The export has been aborted.',
        FAILED: 'The export has failed.',
    };

    return (
        <div
            className={_cs(styles.downloadItem, className)}
        >
            {status === 'PENDING' ? (
                <div className={styles.exportItem}>
                    <span>
                        {`Export for ${downloadType}`}
                    </span>
                </div>
            ) : (
                <div className={styles.exportItem}>
                    <span>
                        {status === 'COMPLETED'
                            ? (`Export for ${downloadType} completed on`)
                            : (`Export for ${downloadType} started on`
                            )}
                    </span>
                    <DateTime
                        value={status === 'COMPLETED' ? completedDate : startedDate}
                        format="datetime"
                    />
                </div>
            )}
            <div className={_cs(styles.exportItem, styles.disabled)}>
                {completedDate && startedDate && (
                    <span>
                        {`Export took ${formatElapsedTime(diff(completedDate, startedDate))}.`}
                    </span>
                )}
                {startedDate && createdDate && (
                    <span>
                        {`Export waited for ${formatElapsedTime(diff(startedDate, createdDate))}.`}
                    </span>
                )}
            </div>
            {status !== 'COMPLETED' && isDefined(status) && (
                <div className={styles.status}>
                    <IoInformationCircleOutline className={styles.icon} />
                    <div className={styles.text}>
                        {statusText[status]}
                    </div>
                </div>
            )}
            {status === 'COMPLETED' && (
                <div className={styles.actions}>
                    {file && (
                        <ButtonLikeExternalLink
                            title="download"
                            link={file}
                            icons={<IoDocumentOutline />}
                            transparent
                            compact
                        >
                            {downloadType}
                            &nbsp;
                            <Filesize
                                value={fileSize}
                            />
                        </ButtonLikeExternalLink>
                    )}
                </div>
            )}
        </div>
    );
}

export default DownloadedItem;
