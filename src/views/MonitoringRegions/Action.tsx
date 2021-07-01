import React from 'react';
import {
    IoPersonSharp,
    IoPeopleSharp,
} from 'react-icons/io5';

import Actions from '#components/Actions';
import QuickActionButton from '#components/QuickActionButton';

export interface ActionProps {
    id: string;
    className?: string;
    onMonitoringExpertEdit?: (id: string) => void;
    onRegionalCoordinatorEdit?: (id: string) => void;
    disabled?: boolean;
}

function ActionCell(props: ActionProps) {
    const {
        className,
        id,
        disabled,
        onMonitoringExpertEdit,
        onRegionalCoordinatorEdit,
    } = props;

    return (
        <Actions className={className}>
            {onMonitoringExpertEdit && (
                <QuickActionButton
                    name={id}
                    onClick={onMonitoringExpertEdit}
                    title="Manage Monitoring Expert"
                    disabled={disabled}
                >
                    <IoPeopleSharp />
                </QuickActionButton>
            )}
            {onRegionalCoordinatorEdit && (
                <QuickActionButton
                    name={id}
                    onClick={onRegionalCoordinatorEdit}
                    title="Manage Regional Coordinator"
                    disabled={disabled}
                >
                    <IoPersonSharp />
                </QuickActionButton>
            )}
        </Actions>
    );
}

export default ActionCell;
