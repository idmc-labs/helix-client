import React, { useEffect, useState } from 'react';
import styles from './styles.css';

interface LoadingProps {
    message?: string;
    delay?: number;
}

function Loading(props: LoadingProps) {
    const {
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
        <div className={styles.loading}>
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
