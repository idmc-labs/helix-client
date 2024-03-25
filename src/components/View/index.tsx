import React, { useState, useEffect, lazy, useContext, useRef } from 'react';
import { Redirect, useRouteMatch, match } from 'react-router-dom';

import DomainContext from '#components/DomainContext';
import DocumentTitle from '#components/DocumentTitle';
import { User } from '#types';

import styles from './styles.css';

type Visibility = 'is-authenticated' | 'is-not-authenticated' | 'is-anything';

const FourHundredThree = lazy(
    () => import('../../views/FourHundredThree'),
);

type ValueOrFunc<T> = T | ((value: string) => T);

export interface ViewProps<T extends { className?: string }> {
    title: ValueOrFunc<string>;
    navbarVisibility: ValueOrFunc<boolean>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: React.LazyExoticComponent<(props: T) => React.ReactElement<any, any> | null>;
    componentProps: ValueOrFunc<React.PropsWithRef<T>>;
    visibility: ValueOrFunc<Visibility>;
    // onlyAdminAccess?: boolean,
    checkPermissions?: (permissions: NonNullable<User['permissions']>, key: string) => boolean | undefined,

    // eslint-disable-next-line @typescript-eslint/ban-types
    shouldPageDismount?: (prevRoute: match<object>, newRoute: match<object>) => boolean;
}

function View<T extends { className?: string }>(props: ViewProps<T>) {
    const {
        component: Comp,
        componentProps,
        title,
        navbarVisibility,
        visibility,
        // onlyAdminAccess,
        checkPermissions,
        shouldPageDismount,
    } = props;

    const routeMatch = useRouteMatch();

    const prevRouteMatchRef = useRef<typeof routeMatch | undefined>();
    const [compKey, setCompKey] = useState(0);

    // NOTE: Should we use useEffect or useLayoutEffect?
    useEffect(
        () => {
            const prevRouteMatch = prevRouteMatchRef.current;
            prevRouteMatchRef.current = routeMatch;

            if (!prevRouteMatch) {
                return;
            }
            if (!shouldPageDismount) {
                return;
            }
            const changeKey = shouldPageDismount(
                prevRouteMatch,
                routeMatch,
            );
            if (changeKey) {
                console.warn('Forced Dismounting', prevRouteMatch, routeMatch);
                setCompKey((key) => (key + 1));
            }
        },
        [routeMatch, shouldPageDismount],
    );

    const {
        authenticated,
        setNavbarVisibility,
        user,
    } = useContext(DomainContext);

    const resolvedNavbarVisibility = typeof navbarVisibility === 'function'
        ? navbarVisibility(routeMatch.path)
        : navbarVisibility;

    const resolvedVisibility = typeof visibility === 'function'
        ? visibility(routeMatch.path)
        : visibility;

    const resolvedTitle = typeof title === 'function'
        ? title(routeMatch.path)
        : title;

    const resolvedComponentProps = typeof componentProps === 'function'
        ? componentProps(routeMatch.path)
        : componentProps;

    const redirectToSignIn = resolvedVisibility === 'is-authenticated' && !authenticated;
    const redirectToHome = resolvedVisibility === 'is-not-authenticated' && authenticated;
    const redirect = redirectToSignIn || redirectToHome;

    useEffect(
        () => {
            // NOTE: should not set visibility for redirection
            // or, navbar will flash
            if (!redirect) {
                setNavbarVisibility(resolvedNavbarVisibility);
            }
        },
        // NOTE: setNavbarVisibility will not change, navbarVisibility will not change
        [setNavbarVisibility, resolvedNavbarVisibility, redirect],
    );

    if (redirectToSignIn) {
        console.warn('Redirecting to sign-in');
        return (
            <Redirect to="/sign-in/" />
        );
    }

    if (redirectToHome) {
        console.warn('Redirecting to dashboard');
        return (
            <Redirect to="/" />
        );
    }

    if (checkPermissions && (
        !user?.permissions || !checkPermissions(user.permissions, routeMatch.path)
    )) {
        return (
            <>
                <DocumentTitle value={`403 - ${resolvedTitle}`} />
                <FourHundredThree className={styles.view} />
            </>
        );
    }

    return (
        <>
            <DocumentTitle value={resolvedTitle} />
            <Comp
                key={compKey}
                className={styles.view}
                {...resolvedComponentProps}
            />
        </>
    );
}

export default View;
