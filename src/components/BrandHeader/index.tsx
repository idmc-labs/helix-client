import React from 'react';

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
            className={className}
            title={tooltipInfo}
        >
            {title ?? 'Helix'}
        </div>
    );
}

export default BrandHeader;
