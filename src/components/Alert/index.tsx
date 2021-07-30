import React, { ReactNode, useState, useCallback, useEffect } from 'react';
import { _cs } from '@togglecorp/fujs';
import { Button, Modal } from '@togglecorp/toggle-ui';

import styles from './styles.css';

export interface AlertProps {
    okayLabel?: ReactNode;
    cancelLabel?: ReactNode;
    okayButtonClassName?: string,
    cancelButtonClassName?: string,
    alertHeader?: ReactNode,
    alertMessage?: ReactNode,
    onOkay?: () => void,
    onClose?: () => void,
    children?: ReactNode;
}

function Alert(props: AlertProps) {
    const {
        alertHeader = 'Quick Info',
        alertMessage = '-- --',
        okayButtonClassName,
        cancelButtonClassName,
        okayLabel = 'Okay',
        cancelLabel = 'Cancel',
        onOkay,
        onClose,
    } = props;

    const [showAlertModal, setShowAlertModal] = useState(false);

    const handleConfirmModalShow = useCallback(() => {
        setShowAlertModal(true);
    }, []);

    useEffect(() => {
        handleConfirmModalShow();
    }, [handleConfirmModalShow]);

    const handleConfirmModalClose = useCallback(() => {
        if (onClose) {
            onClose();
        }
        setShowAlertModal(false);
    }, [onClose]);

    const handleAlertAction = useCallback(() => {
        if (onOkay) {
            onOkay();
        }
        setShowAlertModal(false);
    }, [onOkay]);

    return (
        <>
            {showAlertModal && (
                <Modal
                    heading={alertHeader}
                    onClose={handleConfirmModalClose}
                    footerClassName={styles.actionButtonsRow}
                    footer={(
                        <>
                            <Button
                                className={_cs(styles.actionButton, cancelButtonClassName)}
                                name="cancel-button"
                                onClick={handleConfirmModalClose}
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
                    )}
                >
                    {alertMessage}
                </Modal>
            )}
        </>
    );
}

export default Alert;
