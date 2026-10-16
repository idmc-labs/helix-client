import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.module.css';

const appVersion = import.meta.env.REACT_APP_VERSION;
const appCommitHash = import.meta.env.REACT_APP_COMMIT_HASH;

const tooltipInfo = `Version: ${appVersion}\nCommit: ${appCommitHash}`;

interface BrandHeaderProps {
    title?: string;
    className?: string;
}

function BrandHeader(props: BrandHeaderProps) {
    const {
        title,
        className,
    } = props;
    return (
        <div
            className={_cs(className, styles.brand)}
            title={tooltipInfo}
        >
            {title ?? 'HELIX 2.0'}
        </div>
    );
}

export default BrandHeader;
