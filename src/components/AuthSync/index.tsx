import React, { useCallback, useState, useEffect } from 'react';
import { Modal, Button } from '@togglecorp/toggle-ui';

import styles from './styles.css';

const AUTH_STATE = 'helix-auth-state';
const LAST_USER = 'helix-lastuser-state';

let authenticated = false;
let user: string | undefined;

function stringToBool(value: string | undefined) {
    return value === 'true';
}

export function sync(val: boolean, u: string | undefined) {
    authenticated = val;
    user = u;

    // NOTE: Remembering last logged in user to identify if user is logged in
    // but user id is different
    if (user) {
        localStorage.setItem(LAST_USER, user);
    }

    // NOTE: sending auth information to trigger check
    localStorage.setItem(AUTH_STATE, String(authenticated));
    localStorage.removeItem(AUTH_STATE);
}

function AuthSync() {
    const [shown, setShown] = useState(false);
    const [message, setMessage] = useState<string | undefined>();

    useEffect(
        () => {
            function reload(event: StorageEvent) {
                // NOTE: only react when auth is changed
                if (event.key !== AUTH_STATE) {
                    return;
                }
                // NOTE: ignoring action of un-setting auth state
                if (!event.newValue) {
                    return;
                }

                const authenticatedSignal = stringToBool(event.newValue);
                const lastLoggedInUser = localStorage.getItem(LAST_USER);

                // eslint-disable-next-line max-len
                if (authenticated === authenticatedSignal) {
                    if (authenticated && user !== lastLoggedInUser) {
                        setMessage('You have signed in as different user on another tab.');
                        setShown(true);
                    } else {
                        // if not-authenticated or authenticated and same user
                        setShown(false);
                        setMessage(undefined);
                    }
                } else {
                    setMessage(
                        authenticatedSignal
                            ? 'You have signed in from another tab.'
                            : 'You have been signed out from another tab.',
                    );
                    setShown(true);
                }
            }

            window.addEventListener('storage', reload, false);

            return () => {
                window.removeEventListener('storage', reload);
            };
        },
        [],
    );

    const handleConfirmModalClose = useCallback(
        () => {
            setShown(false);
            setMessage(undefined);
        },
        [],
    );

    const handleConfirmModalConfirm = useCallback(
        () => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            window.location.reload(true);
        },
        [],
    );

    if (!shown) {
        return null;
    }

    return (
        <Modal
            heading="Invalid Session"
            onClose={handleConfirmModalClose}
            size="small"
            freeHeight
            footerClassName={styles.actionButtonsRow}
            footer={(
                <>
                    <Button
                        name={undefined}
                        onClick={handleConfirmModalClose}
                        className={styles.actionButton}
                    >
                        Ignore
                    </Button>
                    <Button
                        name={undefined}
                        onClick={handleConfirmModalConfirm}
                        className={styles.actionButton}
                        variant="primary"
                        autoFocus
                    >
                        Reload
                    </Button>
                </>
            )}
        >
            {message}
        </Modal>
    );
}
export default AuthSync;
