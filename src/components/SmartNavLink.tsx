import React from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';

import useRouteMatching, {
    RouteData,
    Attrs,
} from '#hooks/useRouteMatching';

type SmartNavLinkProps = Omit<NavLinkProps, 'to'> & {
    route: RouteData;
    attrs?: Attrs;
    children?: React.ReactNode;
};

function SmartNavLink(props: SmartNavLinkProps) {
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

    return (
        <NavLink
            {...otherProps}
            to={routeData.to}
        >
            {children ?? routeData.children}
        </NavLink>
    );
}

export default SmartNavLink;
