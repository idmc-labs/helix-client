import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Header from '#components/Header';

import styles from './styles.css';

interface SectionProps {
    className?: string;
    heading: React.ReactNode;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    headerClassName?: string;
    contentClassName?: string;
}

function Section(props: SectionProps) {
    const {
        className,
        heading,
        actions,
        children,
        headerClassName,
        contentClassName,
    } = props;

    return (
        <section className={_cs(styles.section, className)}>
            <Header
                className={_cs(headerClassName, styles.header)}
                heading={heading}
                actions={actions}
            />
            <div className={_cs(contentClassName, styles.content)}>
                {children}
            </div>
        </section>
    );
}

export default Section;
