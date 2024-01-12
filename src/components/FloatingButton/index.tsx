import React, { useEffect, useState } from 'react';
import {
    _cs,
} from '@togglecorp/fujs';
import { Button, ButtonProps, Portal } from '@togglecorp/toggle-ui';

import styles from './styles.css';

interface FloatingButtonProps<N extends string | number | undefined> extends ButtonProps<N> {
    visibleOn: (scroll: number) => boolean,
}
function FloatingButton<N extends string | number | undefined>(props: FloatingButtonProps<N>) {
    const {
        className,
        visibleOn,
        ...otherProps
    } = props;

    const [scroll, setScroll] = useState<number>(
        () => document.querySelectorAll('[data-multiplexer-content]')[0]?.scrollTop ?? 0,
    );

    useEffect(
        () => {
            const handleDocumentScroll = (e: Event) => {
                if (e.target instanceof HTMLElement) {
                    const isMultiplexerContent = e.target.getAttribute('data-multiplexer-content');

                    if (isMultiplexerContent) {
                        setScroll(e.target.scrollTop);
                    }
                }
            };

            document.addEventListener('scroll', handleDocumentScroll, true);

            return () => {
                document.removeEventListener('scroll', handleDocumentScroll, true);
            };
        },
        [],
    );

    return (
        <Portal>
            <Button
                {...otherProps}
                className={_cs(
                    styles.floatingButton,
                    !visibleOn(scroll) && styles.hidden,
                    className,
                )}
            />
        </Portal>
    );
}

export default FloatingButton;
