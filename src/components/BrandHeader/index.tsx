import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

const appVersion = process.env.REACT_APP_VERSION || 'UNKNOWN';
const appCommitHash = process.env.REACT_APP_COMMITHASH || 'UNKNOWN';
const appBranch = process.env.REACT_APP_BRANCH || 'UNKNOWN';

const tooltipInfo = `Version: ${appVersion}\nCommit: ${appCommitHash}\nBranch: ${appBranch}`;

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
