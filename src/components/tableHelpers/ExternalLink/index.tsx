import React from 'react';
import { isFalsyString, _cs } from '@togglecorp/fujs';

import styles from './styles.css';

export interface ExternalLinkProps {
    title?: string | null;
    link?: string | null;
    className?: string;
}
function ExternalLinkCell(props: ExternalLinkProps) {
    const {
        title,
        link,
        className,
    } = props;

    if (isFalsyString(link)) {
        return (
            <div className={_cs(styles.externalLink, className)}>
                {title}
            </div>
        );
    }

    return (
        <a
            className={_cs(styles.externalLink, className)}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            title={link}
        >
            {title}
        </a>
    );
}
export default ExternalLinkCell;
