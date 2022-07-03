import React from 'react';
import {
    IoMdCreate,
} from 'react-icons/io';

import Actions from '#components/Actions';
import QuickActionLink from '#components/QuickActionLink';

import { RouteData, Attrs } from '#hooks/useRouteMatching';

export interface ActionProps {
    className?: string;
    children?: React.ReactNode;
    editLinkRoute?: RouteData;
    editLinkAttrs?: Attrs;
}

function ActionCell(props: ActionProps) {
    const {
        className,
        children,
        editLinkRoute,
        editLinkAttrs,
    } = props;
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
        </Actions>
    );
}

export default ActionCell;
