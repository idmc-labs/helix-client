import React, { useEffect, useState } from 'react';
import { _cs } from '@togglecorp/fujs';
import styles from './styles.css';

interface LoadingProps {
    className?: string;
    message?: string;
    delay?: number;
}

function Loading(props: LoadingProps) {
    const {
        className,
        message = 'Working...',
        delay = 200,
    } = props;

    const initialVisibility = delay <= 0;
    const [visibility, setVisibility] = useState(initialVisibility);

    useEffect(
        () => {
            const timeout = setTimeout(
                () => {
                    setVisibility(true);
                },
                delay,
            );
            return () => {
                clearTimeout(timeout);
            };
        },
        [delay],
    );

    return (
        <div className={_cs(className, styles.loading)}>
            {visibility && (
                <>
                    <div className={styles.particleContainer}>
                        <div className={styles.particle} />
                        <div className={styles.particle} />
                        <div className={styles.particle} />
                    </div>
                    <div className={styles.message}>
                        {message}
                    </div>
                </>
            )}
        </div>
    );
}
export default Loading;
