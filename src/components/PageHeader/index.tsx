import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

interface Props {
    className?: string;
    title: React.ReactNode;
    status?: React.ReactNode;
    actions?: React.ReactNode;
    icons?: React.ReactNode;
    iconsClassName?: string;
}

function PageHeader(props: Props) {
    const {
        className,
        title,
        actions,
        icons,
        iconsClassName,
        status,
    } = props;

    return (
        <header className={_cs(styles.header, className)}>
            <div className={styles.headingSection}>
                {icons && (
                    <div className={_cs(styles.icons, iconsClassName)}>
                        {icons}
                    </div>
                )}
                <h2>
                    { title }
                </h2>
            </div>
            <div className={styles.dummySection} />
            {status && (
                <div className={styles.statusSection}>
                    { status }
                </div>
            )}
            {actions && (
                <div className={styles.actionsSection}>
                    { actions }
                </div>
            )}
        </header>
    );
}

export default PageHeader;
