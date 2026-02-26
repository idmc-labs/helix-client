import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Heading, { HeadingProps } from '#components/Heading';

import styles from './styles.module.css';

interface MessageProps {
    className?: string;
    message: string;
    heading?: string;
    headingSize?: HeadingProps['size'];
    actions?: React.ReactNode;
}

function Message(props: MessageProps) {
    const {
        className,
        message = 'I am the walrus!',
        heading,
        headingSize = 'small',
        actions,
    } = props;

    return (
        <div className={_cs(className, styles.container)}>
            {heading && (
                <Heading
                    className={styles.heading}
                    size={headingSize}
                >
                    {heading}
                </Heading>
            )}
            <div className={styles.message}>
                {message}
            </div>
            {actions && (
                <div className={styles.actions}>
                    {actions}
                </div>
            )}
        </div>
    );
}
export default Message;
