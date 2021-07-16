import React from 'react';
import { _cs, isDefined, isNotDefined } from '@togglecorp/fujs';
import {
    DateTime,
    Numeral,
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

// FIXME: move this to utils
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
                    {status === 'COMPLETED'
                        ? (`Export for ${downloadType} completed on`)
                        : (`Export for ${downloadType} started on`
                        )}
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
