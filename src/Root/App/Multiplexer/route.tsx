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

const routeSettings = {
    home: {
        path: '/',
        // eslint-disable-next-line no-use-before-define
        load: wrap({
            title: 'Home',
            navbarVisibility: true,
            component: lazy(() => import('../../../views/Home')),
            visibility: 'is-authenticated',
        }),
    },
    login: {
        path: '/login/',
        // eslint-disable-next-line no-use-before-define
        load: wrap({
            title: 'Login',
            navbarVisibility: false,
            component: lazy(() => import('../../../views/Login')),
            visibility: 'is-not-authenticated',
        }),
    },
    lost: {
        path: undefined,
        // eslint-disable-next-line no-use-before-define
        load: wrap({
            title: '404',
            navbarVisibility: true,
            component: lazy(() => import('../../../views/FourHundredFour')),
            visibility: 'is-anything',
        }),
    },
};

interface WrapProps {
    title: string;
    navbarVisibility: boolean;
    component: React.FC<{ className: string | undefined }>;
    visibility: Visibility,
}

function WrappedComponent(props: WrapProps) {
    const {
        component: Comp,
        title,
        navbarVisibility,
        visibility,
    } = props;

    const {
        authenticated,
        setNavbarVisibility,
    } = useContext(DomainContext);

    const redirectToLogin = visibility === 'is-authenticated' && !authenticated;
    const redirectToHome = visibility === 'is-not-authenticated' && authenticated;

    const redirect = redirectToLogin || redirectToHome;

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

    if (redirectToLogin) {
        console.warn('redirecting to login');
        return (
            <Redirect to={routeSettings.login.path} />
        );
    }

    if (redirectToHome) {
        console.warn('redirecting to home');
        return (
            <Redirect to={routeSettings.home.path} />
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

function wrap(props: WrapProps) {
    return () => <WrappedComponent {...props} />;
}

export default routeSettings;
