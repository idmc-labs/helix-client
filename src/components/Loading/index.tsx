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
            {visibility ? <h3>{message}</h3> : undefined}
        </div>
    );
}
export default Loading;
