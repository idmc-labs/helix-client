import React from 'react';
// import { isFalsyString } from '@togglecorp/fujs';

import SmartLink from '#components/SmartLink';
import { RouteData, Attrs } from '#hooks/useRouteMatching';

export interface LinkProps {
    title?: string | null;
    className?: string;
    route: RouteData;
    attrs?: Attrs;
}
function LinkCell(props: LinkProps) {
    const {
        title,
        route,
        attrs,
        className,
    } = props;

    /*
    if (isFalsyString(route)) {
        return (
            <div className={className}>
                {title}
            </div>
        );
    }
    */

    return (
        <SmartLink
            className={className}
            route={route}
            attrs={attrs}
        >
            {title}
        </SmartLink>
    );
}
export default LinkCell;
