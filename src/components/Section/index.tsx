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
    elementRef?: React.RefObject<HTMLDivElement>;
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
        elementRef,
    } = props;

    return (
        <section
            ref={elementRef}
            className={_cs(className, styles.section)}
        >
            <Header
                className={_cs(
                    headerClassName,
                    styles.header,
                    subSection ? styles.subSectionHeader : styles.sectionHeader,
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
