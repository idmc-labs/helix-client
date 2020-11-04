import React, { useEffect, lazy, useContext } from 'react';
import { Redirect } from 'react-router-dom';

import DomainContext from '#components/DomainContext';

import styles from './styles.css';

interface TitleProps {
    value: string;
}
function Title({ value }: TitleProps) {
    useEffect(
        () => {
            document.title = value;
        },
        [value],
    );
    return null;
}

type Visibility = 'is-authenticated' | 'is-not-authenticated' | 'is-anything';

type LazyComp = React.FC<{ className: string | undefined }>;

const FourHundredThree: LazyComp = lazy(
    () => import('../../../../views/FourHundredThree'),
);

interface WrapProps {
    title: string;
    navbarVisibility: boolean;
    component: LazyComp;
    visibility: Visibility,
    onlyAdminAccess?: boolean,
}

function WrappedComponent(props: WrapProps) {
    const {
        component: Comp,
        title,
        navbarVisibility,
        visibility,
        onlyAdminAccess,
    } = props;

    const {
        authenticated,
        setNavbarVisibility,
        user,
    } = useContext(DomainContext);

    const redirectToSignIn = visibility === 'is-authenticated' && !authenticated;
    const redirectToHome = visibility === 'is-not-authenticated' && authenticated;
    const redirect = redirectToSignIn || redirectToHome;

    useEffect(
        () => {
            // NOTE: should not set visibility for redirection
            // or, navbar will flash
            if (!redirect) {
                setNavbarVisibility(navbarVisibility);
            }
        },
        // NOTE: setNavbarVisibility will not change, navbarVisibility will not change
        [setNavbarVisibility, navbarVisibility, redirect],
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

    if (onlyAdminAccess && !(user?.role === 'ADMIN' || user?.role === 'IT_HEAD')) {
        return (
            <>
                <Title value="403" />
                <FourHundredThree className={styles.view} />
            </>
        );
    }

    // FIXME: move styling somewhere else
    return (
        <>
            <Title value={title} />
            <Comp className={styles.view} />
        </>
    );
}

function wrap<T>(props: WrapProps & { path: T }) {
    const { path } = props;
    return {
        path,
        title: props.title,
        load: () => (
            <WrappedComponent
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
        component: lazy(() => import('../../../../views/Dashboard')),
        visibility: 'is-authenticated',
    }),
    countries: wrap({
        path: '/countries/',
        title: 'Countries',
        navbarVisibility: true,
        component: lazy(() => import('../../../../views/Countries')),
        visibility: 'is-authenticated',
    }),
    event: wrap({
        path: '/events/:eventId(\\d+)/',
        title: 'Event',
        navbarVisibility: true,
        component: lazy(() => import('../../../../views/Event')),
        visibility: 'is-authenticated',
    }),
    crisis: wrap({
        path: '/crises/:crisisId(\\d+)/',
        title: 'Crisis',
        navbarVisibility: true,
        component: lazy(() => import('../../../../views/Crisis')),
        visibility: 'is-authenticated',
    }),
    crises: wrap({
        path: '/crises/',
        title: 'Crises',
        navbarVisibility: true,
        component: lazy(() => import('../../../../views/Crises')),
        visibility: 'is-authenticated',
    }),
    extraction: wrap({
        path: '/extraction/',
        title: 'Extraction',
        navbarVisibility: true,
        component: lazy(() => import('../../../../views/Extraction')),
        visibility: 'is-authenticated',
    }),
    grids: wrap({
        path: '/grids/',
        title: 'Grids',
        navbarVisibility: true,
        component: lazy(() => import('../../../../views/Grids')),
        visibility: 'is-authenticated',
    }),
    contacts: wrap({
        path: '/contacts/',
        title: 'Contacts',
        navbarVisibility: true,
        component: lazy(() => import('../../../../views/Contacts')),
        visibility: 'is-authenticated',
    }),
    performanceAndAdmin: wrap({
        path: '/performance-and-admin/',
        title: 'Performance and Admin',
        navbarVisibility: true,
        component: lazy(() => import('../../../../views/PerformanceAndAdmin')),
        visibility: 'is-authenticated',
        onlyAdminAccess: true,
    }),
    newEntry: wrap({
        path: '/new-entry/',
        title: 'New Entry',
        navbarVisibility: true,
        component: lazy(() => import('../../../../views/NewEntry')),
        visibility: 'is-authenticated',
    }),
    signIn: wrap({
        path: '/sign-in/',
        title: 'Sign In',
        navbarVisibility: false,
        component: lazy(() => import('../../../../views/SignIn')),
        visibility: 'is-not-authenticated',
    }),
    signUp: wrap({
        path: '/sign-up/',
        title: 'Sign Up',
        navbarVisibility: false,
        component: lazy(() => import('../../../../views/SignUp')),
        visibility: 'is-not-authenticated',
    }),
    lost: wrap({
        path: undefined,
        title: '404',
        navbarVisibility: true,
        component: lazy(() => import('../../../../views/FourHundredFour')),
        visibility: 'is-anything',
    }),
};

export default routeSettings;
