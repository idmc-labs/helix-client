import React from 'react';
import {
    DateTimeProps,
    DateTime as ActualDateTime,
} from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import { getDateFromDateString } from '#utils/common';
import Tooltip from '#components/Tooltip';

import styles from './styles.css';

type Props = DateTimeProps;

function DateTime(props: Props) {
    const {
        className,
        value,
        format,
    } = props;

    let tooltipContent;
    if (value && format === 'date') {
        const date = getDateFromDateString(value);
        tooltipContent = date.toLocaleString(
            navigator.language,
            {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
            },
        );
    } else if (value && format === 'datetime') {
        // FIXME: do no use new Date directly
        const date = new Date(value);
        tooltipContent = date.toLocaleString(
            navigator.language,
            {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            },
        );
    }

    return (
        <span
            className={_cs(styles.dateTime, className)}
        >
            <ActualDateTime
                value={value}
                format={format}
            />
            {tooltipContent && (
                <Tooltip
                    className={styles.tooltip}
                    preferredWidth={8}
                    description={tooltipContent}
                />
            )}
        </span>
    );
}

export default DateTime;
