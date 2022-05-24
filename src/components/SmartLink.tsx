import React from 'react';
import { Link, LinkProps } from 'react-router-dom';

import useRouteMatching, {
    RouteData,
    Attrs,
} from '#hooks/useRouteMatching';

type SmartLinkProps = Omit<LinkProps, 'to'> & {
    route: RouteData;
    attrs?: Attrs;
    search?: string;
    hash?: string;
    children?: React.ReactNode;
};

function isString(value: unknown): value is string {
    return typeof value === 'string';
}

function SmartLink(props: SmartLinkProps) {
    const {
        route,
        attrs,
        children,
        search,
        hash,
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
            to={{
                pathname: routeData.to,
                hash,
                search,
            }}
            title={isString(children) ? children : undefined}
        >
            {children}
        </Link>
    );
}

export default SmartLink;
