import React from 'react';
import {
    IoTrashOutline,
    IoCreateOutline,
    IoDocumentOutline,
} from 'react-icons/io5';

import Actions from '#components/Actions';
import QuickActionButton from '#components/QuickActionButton';
import QuickActionLink from '#components/QuickActionLink';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';

import { RouteData, Attrs } from '#hooks/useRouteMatching';
import ButtonLikeLink from '#components/ButtonLikeLink';
import route from '#config/routes';
import { Parking_Lot_Status as ParkingLotStatus } from '#generated/types';

import styles from './styles.css';

export interface ActionProps {
    id: string;
    className?: string;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
    disabled?: boolean;
    children?: React.ReactNode;
    editLinkRoute?: RouteData;
    editLinkAttrs?: Attrs;
    parkedItemStatus: ParkingLotStatus | null | undefined;
    actionsHidden?: boolean,
}

function ActionCell(props: ActionProps) {
    const {
        className,
        id,
        onDelete,
        onEdit,
        disabled,
        children,
        editLinkRoute,
        editLinkAttrs,
        parkedItemStatus,
        actionsHidden,
    } = props;

    return (
        <Actions className={className}>
            {children}
            {editLinkRoute && (
                <QuickActionLink
                    route={editLinkRoute}
                    attrs={editLinkAttrs}
                    title="Edit"
                    transparent
                >
                    <IoCreateOutline />
                </QuickActionLink>
            )}
            {parkedItemStatus !== 'REVIEWED' && (
                <ButtonLikeLink
                    route={route.newEntryFromParkedItem}
                    attrs={{ parkedItemId: id }}
                    icons={<IoDocumentOutline />}
                    title="Create Entry"
                    disabled={disabled}
                    className={styles.createEntry}
                    transparent
                />
            )}
            {onEdit && !actionsHidden && parkedItemStatus !== 'REVIEWED' && (
                <QuickActionButton
                    name={id}
                    onClick={onEdit}
                    title="Edit"
                    disabled={disabled || !onEdit}
                    transparent
                >
                    <IoCreateOutline />
                </QuickActionButton>
            )}
            {onDelete && !actionsHidden && (
                <QuickActionConfirmButton
                    name={id}
                    onConfirm={onDelete}
                    title="Delete"
                    variant="danger"
                    disabled={disabled || !onDelete}
                    transparent
                >
                    <IoTrashOutline />
                </QuickActionConfirmButton>
            )}
        </Actions>
    );
}

export default ActionCell;
