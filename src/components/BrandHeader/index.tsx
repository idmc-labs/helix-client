import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

const appVersion = process.env.REACT_APP_VERSION;
const appCommitHash = process.env.REACT_APP_COMMITHASH;
const appBranch = process.env.REACT_APP_BRANCH;

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
            {title ?? 'Helix'}
        </div>
    );
}

export default BrandHeader;
