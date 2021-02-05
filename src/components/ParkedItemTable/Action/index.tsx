import React, { useCallback } from 'react';
import {
    IoMdTrash,
    IoMdCreate,
    IoMdDocument,
} from 'react-icons/io';

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

    const handleDeleteButtonClick = useCallback(
        () => {
            if (onDelete) {
                onDelete(id);
            }
        },
        [onDelete, id],
    );
    const handleEditButtonClick = useCallback(
        () => {
            if (onEdit) {
                onEdit(id);
            }
        },
        [onEdit, id],
    );

    return (
        <Actions className={className}>
            {children}
            {editLinkRoute && (
                <QuickActionLink
                    route={editLinkRoute}
                    attrs={editLinkAttrs}
                    title="Edit"
                >
                    <IoMdCreate />
                </QuickActionLink>
            )}
            {parkedItemStatus !== 'REVIEWED' && (
                <ButtonLikeLink
                    route={route.newEntryFromParkedItem}
                    attrs={{ parkedItemId: id }}
                    icons={<IoMdDocument />}
                    title="Create Entry"
                    disabled={disabled}
                    className={styles.createEntry}
                />
            )}
            {onEdit && !actionsHidden && parkedItemStatus !== 'REVIEWED' && (
                <QuickActionButton
                    name={undefined}
                    onClick={handleEditButtonClick}
                    title="Edit"
                    disabled={disabled || !onEdit}
                >
                    <IoMdCreate />
                </QuickActionButton>
            )}
            {onDelete && !actionsHidden && (
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={handleDeleteButtonClick}
                    title="Delete"
                    variant="danger"
                    disabled={disabled || !onDelete}
                >
                    <IoMdTrash />
                </QuickActionConfirmButton>
            )}
        </Actions>
    );
}

export default ActionCell;
