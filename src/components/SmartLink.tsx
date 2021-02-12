import React from 'react';
import { Link, LinkProps } from 'react-router-dom';

import useRouteMatching, {
    RouteData,
    Attrs,
} from '#hooks/useRouteMatching';

type SmartLinkProps = Omit<LinkProps, 'to'> & {
    route: RouteData;
    attrs?: Attrs;
    children?: React.ReactNode;
};

function SmartLink(props: SmartLinkProps) {
    const {
        route,
        attrs,
        children,
        ...otherProps
    } = props;

    const routeData = useRouteMatching(route, attrs);
    if (!routeData) {
        return null;
    }

    if (!children) {
        return null;
    }

    return (
        <Link
            {...otherProps}
            to={routeData.to}
            title={routeData.to}
        >
            {children}
        </Link>
    );
}

export default SmartLink;
