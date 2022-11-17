import React, { useCallback } from 'react';
import { ConfirmButton } from '@togglecorp/toggle-ui';

import Actions from '#components/Actions';

export interface ButtonActionProps {
    id: string;
    title?: string;
    className?: string;
    disabled?: boolean;
    children?: React.ReactNode;
    onClick?: (id: string) => void;
    onConfirm?: (id: string) => void;
    onCancel?: (id: string) => void;
}

function ButtonActionCell(props: ButtonActionProps) {
    const {
        className,
        disabled,
        children,
    } = props;

    const handleCancel = useCallback(
        () => {
            console.log('Clicked cancel');
        },
        [],
    );

    const handleConfirm = useCallback(
        () => {
            console.log('Clicked confirm');
        },
        [],
    );

    const handleClick = useCallback(
        () => {
            console.log('Clicked mark button');
        },
        [],
    );

    return (
        <Actions className={className}>
            {children}
            <ConfirmButton
                name={undefined}
                title="Are you sure ?"
                disabled={disabled}
                onClick={handleClick}
                onCancel={handleCancel}
                onConfirm={handleConfirm}
            >
                Mark as read
            </ConfirmButton>
        </Actions>
    );
}

export default ButtonActionCell;
