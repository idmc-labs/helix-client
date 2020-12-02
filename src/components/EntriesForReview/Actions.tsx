import React from 'react';
import {
    IoMdEye,
} from 'react-icons/io';

import Actions from '#components/Actions';
import QuickActionLink from '#components/QuickActionLink';

export interface ActionProps {
    className?: string;
    children?: React.ReactNode;
    viewLink?: string;
}

function ActionCell(props: ActionProps) {
    const {
        className,
        children,
        viewLink,
    } = props;
    return (
        <Actions className={className}>
            {children}
            {viewLink && (
                <QuickActionLink to={viewLink}>
                    <IoMdEye />
                </QuickActionLink>
            )}
        </Actions>
    );
}

export default ActionCell;
