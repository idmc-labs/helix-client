import React, { lazy } from 'react';
import View, { ViewProps } from '#components/View';

export function wrap<T extends string, K extends { className?: string }>(
    props: ViewProps<K> & { path: T },
) {
    const {
        path,
        component,
        componentProps,
        ...otherProps
    } = props;

    return {
        ...otherProps,
        path,
        load: () => (
            <View
                component={component}
                componentProps={componentProps}
                {...otherProps}
            />
        ),
    };
}

const routeSettings = {
    dashboard: wrap({
        path: '/',
        title: 'Dashboard',
        navbarVisibility: true,
        component: lazy(() => import('../views/Dashboard')),
        componentProps: {},
        visibility: 'is-authenticated',
    }),
    countries: wrap({
        path: '/countries/',
        title: 'Countries',
        navbarVisibility: true,
        component: lazy(() => import('../views/Countries')),
        componentProps: {},
        visibility: 'is-authenticated',
    }),
    country: wrap({
        path: '/countries/:countryId(\\d+)/',
        title: 'Country',
        navbarVisibility: true,
        component: lazy(() => import('../views/Countries')),
        componentProps: {},
        visibility: 'is-authenticated',
    }),
    event: wrap({
        path: '/events/:eventId(\\d+)/',
        title: 'Event',
        navbarVisibility: true,
        component: lazy(() => import('../views/Event')),
        componentProps: {},
        visibility: 'is-authenticated',
    }),
    crisis: wrap({
        path: '/crises/:crisisId(\\d+)/',
        title: 'Crisis',
        navbarVisibility: true,
        component: lazy(() => import('../views/Crisis')),
        componentProps: {},
        visibility: 'is-authenticated',
    }),
    crises: wrap({
        path: '/crises/',
        title: 'Crises',
        navbarVisibility: true,
        component: lazy(() => import('../views/Crises')),
        componentProps: {},
        visibility: 'is-authenticated',
    }),
    extraction: wrap({
        path: '/extraction/',
        title: 'Extraction',
        navbarVisibility: true,
        component: lazy(() => import('../views/Extraction')),
        componentProps: {},
        visibility: 'is-authenticated',
    }),
    newEntry: wrap({
        path: '/entries/new/',
        title: 'New Entry',
        navbarVisibility: true,
        component: lazy(() => import('../views/Entry')),
        componentProps: {},
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => permissions.entry?.add,
    }),
    entry: wrap({
        path: '/entries/:entryId(\\d+)/edit/',
        title: 'Edit Entry',
        navbarVisibility: true,
        component: lazy(() => import('../views/Entry')),
        componentProps: {},
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => permissions.entry?.change,
    }),

    entryReview: wrap({
        path: '/entries/:entryId(\\d+)/review/',
        title: 'Review Entry',
        navbarVisibility: true,
        component: lazy(() => import('../views/Entry')),
        componentProps: { reviewMode: true },
        visibility: 'is-authenticated',
        // FIXME: better value for entry review
        checkPermissions: (permissions) => permissions.entry?.change,
    }),
    grids: wrap({
        path: '/grids/',
        title: 'Grids',
        navbarVisibility: true,
        component: lazy(() => import('../views/Grids')),
        componentProps: {},
        visibility: 'is-authenticated',
    }),
    contacts: wrap({
        path: '/contacts/',
        title: 'Contacts',
        navbarVisibility: true,
        component: lazy(() => import('../views/Contacts')),
        componentProps: {},
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => (
            permissions.contact?.add
            || permissions.contact?.change
            || permissions.contact?.delete
        ),
    }),
    performanceAndAdmin: wrap({
        path: '/performance-and-admin/',
        title: 'Performance and Admin',
        navbarVisibility: true,
        component: lazy(() => import('../views/PerformanceAndAdmin')),
        componentProps: {},
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => (
            permissions.user?.add
            || permissions.user?.change
            || permissions.user?.delete
        ),
    }),
    organizations: wrap({
        path: '/organizations/',
        title: 'Organizations',
        navbarVisibility: true,
        component: lazy(() => import('../views/Organizations')),
        componentProps: {},
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => (
            permissions.organization?.add
            || permissions.organization?.change
            || permissions.organization?.delete
        ),
    }),
    signIn: wrap({
        path: '/sign-in/',
        title: 'Sign In',
        navbarVisibility: false,
        component: lazy(() => import('../views/SignIn')),
        componentProps: {},
        visibility: 'is-not-authenticated',
    }),
    signUp: wrap({
        path: '/sign-up/',
        title: 'Sign Up',
        navbarVisibility: false,
        component: lazy(() => import('../views/SignUp')),
        componentProps: {},
        visibility: 'is-not-authenticated',
    }),
    /*
    lost: wrap({
        path: undefined as unknown as string,
        title: '404',
        navbarVisibility: true,
        component: lazy(() => import('../views/FourHundredFour')),
        visibility: 'is-anything',
    }),
    */
};

export const lostRoute = {
    path: undefined,
    title: '404',
    load: () => (
        <View
            title="404"
            component={lazy(() => import('../views/FourHundredFour'))}
            componentProps={{}}
            visibility="is-anything"
            navbarVisibility
        />
    ),
};

export default routeSettings;
