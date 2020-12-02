import React, { lazy } from 'react';
import View, { ViewProps } from '#components/View';

export function wrap<T extends string>(props: ViewProps & { path: T }) {
    const { path, ...otherProps } = props;
    return {
        ...otherProps,
        path,
        title: props.title,
        load: () => (
            <View
                {...props}
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
        visibility: 'is-authenticated',
    }),
    countries: wrap({
        path: '/countries/',
        title: 'Countries',
        navbarVisibility: true,
        component: lazy(() => import('../views/Countries')),
        visibility: 'is-authenticated',
    }),
    country: wrap({
        path: '/countries/:countryId(\\d+)/',
        title: 'Country',
        navbarVisibility: true,
        component: lazy(() => import('../views/Countries')),
        visibility: 'is-authenticated',
    }),
    event: wrap({
        path: '/events/:eventId(\\d+)/',
        title: 'Event',
        navbarVisibility: true,
        component: lazy(() => import('../views/Event')),
        visibility: 'is-authenticated',
    }),
    crisis: wrap({
        path: '/crises/:crisisId(\\d+)/',
        title: 'Crisis',
        navbarVisibility: true,
        component: lazy(() => import('../views/Crisis')),
        visibility: 'is-authenticated',
    }),
    crises: wrap({
        path: '/crises/',
        title: 'Crises',
        navbarVisibility: true,
        component: lazy(() => import('../views/Crises')),
        visibility: 'is-authenticated',
    }),
    extraction: wrap({
        path: '/extraction/',
        title: 'Extraction',
        navbarVisibility: true,
        component: lazy(() => import('../views/Extraction')),
        visibility: 'is-authenticated',
    }),
    newEntry: wrap({
        path: '/entries/new/',
        title: 'New Entry',
        navbarVisibility: true,
        component: lazy(() => import('../views/NewEntry')),
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => permissions.add?.entry,
    }),
    entry: wrap({
        path: '/entries/:entryId(\\d+)/edit/',
        title: 'Edit Entry',
        navbarVisibility: true,
        component: lazy(() => import('../views/Entry')),
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => permissions.change?.entry,
    }),
    entryReview: wrap({
        path: '/entries/:entryId(\\d+)/review/',
        title: 'Review Entry',
        navbarVisibility: true,
        component: lazy(() => import('../views/ReviewEntry')),
        visibility: 'is-authenticated',
        // FIXME: better value for entry review
        checkPermissions: (permissions) => permissions.change?.entry,
    }),
    grids: wrap({
        path: '/grids/',
        title: 'Grids',
        navbarVisibility: true,
        component: lazy(() => import('../views/Grids')),
        visibility: 'is-authenticated',
    }),
    contacts: wrap({
        path: '/contacts/',
        title: 'Contacts',
        navbarVisibility: true,
        component: lazy(() => import('../views/Contacts')),
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => (
            permissions.add?.contact
            || permissions.change?.contact
            || permissions.delete?.contact
        ),
    }),
    performanceAndAdmin: wrap({
        path: '/performance-and-admin/',
        title: 'Performance and Admin',
        navbarVisibility: true,
        component: lazy(() => import('../views/PerformanceAndAdmin')),
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => (
            permissions.add?.user
            || permissions.change?.user
            || permissions.delete?.user
        ),
    }),
    organizations: wrap({
        path: '/organizations/',
        title: 'Organizations',
        navbarVisibility: true,
        component: lazy(() => import('../views/Organizations')),
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => (
            permissions.add?.organization
            || permissions.change?.organization
            || permissions.delete?.organization
        ),
    }),
    signIn: wrap({
        path: '/sign-in/',
        title: 'Sign In',
        navbarVisibility: false,
        component: lazy(() => import('../views/SignIn')),
        visibility: 'is-not-authenticated',
    }),
    signUp: wrap({
        path: '/sign-up/',
        title: 'Sign Up',
        navbarVisibility: false,
        component: lazy(() => import('../views/SignUp')),
        visibility: 'is-not-authenticated',
    }),
    lost: wrap({
        path: undefined as unknown as string,
        title: '404',
        navbarVisibility: true,
        component: lazy(() => import('../views/FourHundredFour')),
        visibility: 'is-anything',
    }),
};

export default routeSettings;
