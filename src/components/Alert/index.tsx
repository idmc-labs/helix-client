import React, { ReactNode, useState, useCallback, useEffect } from 'react';
import { _cs } from '@togglecorp/fujs';
import { Button, Modal } from '@togglecorp/toggle-ui';
import { reverseRoute } from '#hooks/useRouteMatching';
import route from '#config/routes';
import { EventOption } from '#components/selections/EventSelectInput';

import styles from './styles.css';

export interface AlertProps {
    okayLabel?: ReactNode;
    cancelLabel?: ReactNode;
    okayButtonClassName?: string,
    cancelButtonClassName?: string,
    alertHeader?: ReactNode,
    onOkay?: () => void,
    onClose?: () => void,
    cloneEvents: EventOption[] | undefined,
}

function Alert(props: AlertProps) {
    const {
        alertHeader = 'Quick Info',
        okayButtonClassName,
        cancelButtonClassName,
        okayLabel = 'Okay',
        cancelLabel = 'Cancel',
        onOkay,
        onClose,
        cloneEvents,
    } = props;

    console.log('Cloned events data:::>>', cloneEvents);

    const [showAlertModal, setShowAlertModal] = useState(false);

    const handleConfirmModalShow = useCallback(() => {
        setShowAlertModal(true);
    }, []);

    useEffect(() => {
        handleConfirmModalShow();
    }, [handleConfirmModalShow]);

    const handleModalClose = useCallback(() => {
        if (onClose) {
            onClose();
        }
        setShowAlertModal(false);
    }, [onClose]);

    const handleAlertAction = useCallback(() => {
        cloneEvents?.forEach((eventItem) => {
            const eventId = eventItem.id;
            const entryRoute = reverseRoute(
                route.entryView.path,
                { entryId: eventId },
            );
            const cloneUrl = window.location.origin + entryRoute;
            return window.open(`${cloneUrl}`, '_blank');
        });
        if (onOkay) {
            onOkay();
        }
        setShowAlertModal(false);
    }, [onOkay, cloneEvents]);

    return (
        <>
            {showAlertModal && (
                <Modal
                    heading={alertHeader}
                    onClose={handleModalClose}
                    footerClassName={styles.actionButtonsRow}
                    footer={cloneEvents && cloneEvents?.length < 5
                        ? (
                            <>
                                <Button
                                    className={_cs(styles.actionButton, cancelButtonClassName)}
                                    name="cancel-button"
                                    onClick={handleModalClose}
                                    variant="primary"
                                    autoFocus
                                >
                                    {cancelLabel}
                                </Button>
                                <Button
                                    className={_cs(styles.actionButton, okayButtonClassName)}
                                    name="confirm-button"
                                    onClick={handleAlertAction}
                                    variant="primary"
                                    autoFocus
                                >
                                    {okayLabel}
                                </Button>
                            </>
                        ) : (
                            <Button
                                className={_cs(styles.actionButton, okayButtonClassName)}
                                name="confirm-button"
                                onClick={handleModalClose}
                                variant="primary"
                                autoFocus
                            >
                                {okayLabel}
                            </Button>
                        )}

                >
                    {
                        cloneEvents && cloneEvents?.length < 5
                            ? 'Would you like to open the cloned entries in new tab? You can also find them in Dashboard Entries'
                            : 'Please check Dashboard for the cloned entries !'
                    }
                </Modal>
            )}
        </>
    );
}

export default Alert;
