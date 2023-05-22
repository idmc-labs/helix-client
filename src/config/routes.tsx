import React, { lazy } from 'react';
import View, { ViewProps } from '#components/View';

import styles from './routes.css';

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
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
    }),
    notifications: wrap({
        path: '/notifications/',
        title: 'Notifications',
        navbarVisibility: true,
        component: lazy(() => import('../views/Notifications')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
    }),
    regions: wrap({
        path: '/monitoring-regions/',
        title: 'Monitoring Regions',
        navbarVisibility: true,
        component: lazy(() => import('../views/MonitoringRegions')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
    }),
    countries: wrap({
        path: '/countries/',
        title: 'Countries',
        navbarVisibility: true,
        component: lazy(() => import('../views/Countries')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
    }),
    country: wrap({
        path: '/countries/:countryId(\\d+)/',
        title: 'Country',
        navbarVisibility: true,
        component: lazy(() => import('../views/Country')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
    }),
    event: wrap({
        path: '/events/:eventId(\\d+)/',
        title: 'Event',
        navbarVisibility: true,
        component: lazy(() => import('../views/Event')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
    }),
    crisis: wrap({
        path: '/crises/:crisisId(\\d+)/',
        title: 'Crisis',
        navbarVisibility: true,
        component: lazy(() => import('../views/Crisis')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
    }),
    crises: wrap({
        path: '/crises/',
        title: 'Crises',
        navbarVisibility: true,
        component: lazy(() => import('../views/Crises')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
    }),
    events: wrap({
        path: '/events/',
        title: 'Events',
        navbarVisibility: true,
        component: lazy(() => import('../views/Events')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
    }),
    extraction: wrap({
        path: '/extractions/:queryId(\\d+)/',
        title: 'Extraction',
        navbarVisibility: true,
        component: lazy(() => import('../views/Extraction')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
    }),
    extractions: wrap({
        path: '/extractions/',
        title: 'Extraction',
        navbarVisibility: true,
        component: lazy(() => import('../views/Extraction')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
    }),
    contextualUpdates: wrap({
        path: '/contextual-updates/',
        title: 'Contextual Updates',
        navbarVisibility: true,
        component: lazy(() => import('../views/ContextualUpdates')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
    }),
    // TODO: add contextual Update later
    contextualUpdateView: wrap({
        path: '/contextual-updates/:contextualUpdateId(\\d+)/',
        title: 'View Contextual Update',
        navbarVisibility: true,
        component: lazy(() => import('../views/ContextualUpdates')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
    }),
    newEntry: wrap({
        path: '/entries/new/',
        title: 'New Entry',
        navbarVisibility: true,
        component: lazy(() => import('../views/Entry')),
        componentProps: {
            className: styles.view,
            mode: 'edit',
        },
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => permissions.entry?.add,
    }),
    entryEdit: wrap({
        path: '/entries/:entryId(\\d+)/edit/',
        title: 'Edit Entry',
        navbarVisibility: true,
        component: lazy(() => import('../views/Entry')),
        componentProps: {
            className: styles.view,
            mode: 'edit',
        },
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => permissions.entry?.change,
    }),
    newEntryFromParkedItem: wrap({
        path: '/entries/new-from-parked-item/:parkedItemId(\\d+)/',
        title: 'New Entry from Parking Lot',
        navbarVisibility: true,
        component: lazy(() => import('../views/Entry')),
        componentProps: {
            className: styles.view,
            mode: 'edit',
        },
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => permissions.entry?.add,
    }),
    entryView: wrap({
        path: '/entries/:entryId(\\d+)/',
        title: 'View Entry',
        navbarVisibility: true,
        component: lazy(() => import('../views/Entry')),
        componentProps: {
            className: styles.view,
            mode: 'view',
        },
        visibility: 'is-authenticated',
    }),
    reports: wrap({
        path: '/reports/',
        title: 'Reports',
        navbarVisibility: true,
        component: lazy(() => import('../views/Reports')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
    }),
    report: wrap({
        path: '/reports/:reportId(\\d+)/',
        title: 'Report',
        navbarVisibility: true,
        component: lazy(() => import('../views/Report')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
    }),
    contacts: wrap({
        path: '/contacts/',
        title: 'Contacts',
        navbarVisibility: true,
        component: lazy(() => import('../views/Contacts')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => (
            permissions.contact?.add
            || permissions.contact?.change
            || permissions.contact?.delete
        ),
    }),
    gidd: wrap({
        path: '/gidd/',
        title: 'GIDD',
        navbarVisibility: true,
        component: lazy(() => import('../views/Gidd')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => (
            permissions.gidd?.update_gidd_data
            || permissions.gidd?.update_release_meta_data
        ),
    }),
    admin: wrap({
        path: '/admin/',
        title: 'Admin',
        navbarVisibility: true,
        component: lazy(() => import('../views/Admin')),
        componentProps: {
            className: styles.view,
        },
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
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => (
            permissions.organization?.add
            || permissions.organization?.change
            || permissions.organization?.delete
        ),
    }),
    actors: wrap({
        path: '/actors/',
        title: 'Actors',
        navbarVisibility: true,
        component: lazy(() => import('../views/Actors')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => (
            permissions.actor?.add
            || permissions.actor?.change
            || permissions.actor?.delete
        ),
    }),
    parkingLot: wrap({
        path: '/parking-lot/',
        title: 'Parking Lot',
        navbarVisibility: true,
        component: lazy(() => import('../views/ParkingLot')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => (
            permissions.parkeditem?.add
            || permissions.parkeditem?.change
            || permissions.parkeditem?.delete
        ),
    }),
    figureTags: wrap({
        path: '/tags/',
        title: 'Tags',
        navbarVisibility: true,
        component: lazy(() => import('../views/FigureTags')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => (
            permissions.figure?.add
            || permissions.figure?.change
            || permissions.figure?.delete
        ),
    }),
    violenceContext: wrap({
        path: '/violence-context/',
        title: 'Context of Violence',
        navbarVisibility: true,
        component: lazy(() => import('../views/ViolenceContext')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => (
            permissions.contextofviolence?.add
            || permissions.contextofviolence?.change
            || permissions.contextofviolence?.delete
        ),
    }),
    qaDashboard: wrap({
        path: '/qa/',
        title: 'QA',
        navbarVisibility: true,
        component: lazy(() => import('../views/QADashboard')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => (
            permissions.event?.add
            || permissions.event?.change
            || permissions.event?.delete
        ),
    }),
    apiTracker: wrap({
        path: '/api-tracker/',
        title: 'Client & Api Tracker',
        navbarVisibility: true,
        component: lazy(() => import('../views/ApiTracker')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
        checkPermissions: (permissions) => (
            permissions.event?.add
            || permissions.event?.change
            || permissions.event?.delete
        ),
    }),
    signIn: wrap({
        path: '/sign-in/',
        title: 'Sign In',
        navbarVisibility: false,
        component: lazy(() => import('../views/SignIn')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-not-authenticated',
    }),
    signUp: wrap({
        path: '/sign-up/',
        title: 'Sign Up',
        navbarVisibility: false,
        component: lazy(() => import('../views/SignUp')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-not-authenticated',
    }),
    forgetPassword: wrap({
        path: '/forget-password/',
        title: 'Forget Password',
        navbarVisibility: false,
        component: lazy(() => import('../views/ForgetPassword')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-not-authenticated',
    }),
    resetPassword: wrap({
        path: '/reset-password/:userId/:resetToken/',
        title: 'Reset Password',
        navbarVisibility: false,
        component: lazy(() => import('../views/ResetPassword')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-not-authenticated',
    }),
    eventReview: wrap({
        path: '/events/:eventId/review/',
        title: 'Event Review',
        navbarVisibility: true,
        component: lazy(() => import('../views/EventReview')),
        componentProps: {
            className: styles.view,
        },
        visibility: 'is-authenticated',
        // FIXME: add permission for review comment
        checkPermissions: (permissions) => (
            permissions.event?.sign_off
            || permissions.figure?.approve
        ),
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
            componentProps={{
                className: styles.view,
            }}
            visibility="is-anything"
            navbarVisibility
        />
    ),
};

export default routeSettings;
