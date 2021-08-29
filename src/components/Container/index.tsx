import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Header from '#components/Header';
import Footer from '#components/Footer';

import styles from './styles.css';

interface Props {
    className?: string;
    heading?: React.ReactNode;
    headerIcons?: React.ReactNode;
    headerActions?: React.ReactNode;
    children?: React.ReactNode;
    description?: React.ReactNode;
    headerClassName?: string;
    headingContainerClassName?: string;
    contentClassName?: string;
    descriptionClassName?: string;
    footerContent?: React.ReactNode;
    footerActions?: React.ReactNode;
    compact?: boolean;
}

function Container(props: Props) {
    const {
        className,
        heading,
        children,
        description,
        headerActions,
        headerIcons,
        headerClassName,
        headingContainerClassName,
        contentClassName,
        descriptionClassName,
        footerContent,
        footerActions,
        compact,
    } = props;

    return (
        <div
            className={_cs(
                styles.container,
                className,
                compact && styles.compact,
            )}
        >
            <Header
                icons={headerIcons}
                actions={headerActions}
                className={_cs(
                    styles.header,
                    headerClassName,
                    compact && styles.compactHeader,
                )}
                headingContainerClassName={headingContainerClassName}
                heading={heading}
                size={compact ? 'small' : 'medium'}
            />
            <div className={_cs(styles.description, descriptionClassName)}>
                { description }
            </div>
            <div className={_cs(styles.content, contentClassName)}>
                { children }
            </div>
            <Footer
                actions={footerActions}
                className={styles.footer}
            >
                { footerContent }
            </Footer>
        </div>
    );
}

export default Container;
