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
    subSection?: boolean;
}

function Section(props: SectionProps) {
    const {
        className,
        heading,
        actions,
        children,
        headerClassName,
        contentClassName,
        subSection,
    } = props;

    return (
        <section className={_cs(styles.section, className)}>
            <Header
                className={_cs(
                    headerClassName,
                    styles.header,
                    subSection && styles.subSectionHeader,
                )}
                heading={heading}
                actions={actions}
                size={subSection ? 'small' : 'medium'}
            />
            <div className={_cs(contentClassName, styles.content)}>
                {children}
            </div>
        </section>
    );
}

export default Section;
