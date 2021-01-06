import React from 'react';
import {
    IoMdEye,
} from 'react-icons/io';

import Actions from '#components/Actions';
import QuickActionLink from '#components/QuickActionLink';

import { RouteData, Attrs } from '#hooks/useRouteMatching';

export interface ActionProps {
    className?: string;
    children?: React.ReactNode;
    viewLinkRoute?: RouteData;
    viewLinkAttrs?: Attrs;
}

function ActionCell(props: ActionProps) {
    const {
        className,
        children,
        viewLinkRoute,
        viewLinkAttrs,
    } = props;
    return (
        <Actions className={className}>
            {children}
            {viewLinkRoute && (
                <QuickActionLink
                    route={viewLinkRoute}
                    attrs={viewLinkAttrs}
                    title="Review"
                >
                    <IoMdEye />
                </QuickActionLink>
            )}
        </Actions>
    );
}

export default ActionCell;
