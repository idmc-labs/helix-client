import React, { useEffect, lazy, useContext } from 'react';
import { Redirect } from 'react-router-dom';

import DomainContext from '#components/DomainContext';
import DocumentTitle from '#components/DocumentTitle';
import { User } from '#types';

import styles from './styles.css';

type Visibility = 'is-authenticated' | 'is-not-authenticated' | 'is-anything';
type LazyComp = React.FC<{ className: string | undefined }>;

const FourHundredThree: LazyComp = lazy(
    () => import('../../views/FourHundredThree'),
);

export interface ViewProps {
    title: string;
    navbarVisibility: boolean;
    component: LazyComp;
    visibility: Visibility,
    // onlyAdminAccess?: boolean,
    checkPermissions?: (permissions: NonNullable<User['permissions']>) => boolean | undefined,
}

function View(props: ViewProps) {
    const {
        component: Comp,
        title,
        navbarVisibility,
        visibility,
        // onlyAdminAccess,
        checkPermissions,
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

    if (checkPermissions && (!user?.permissions || !checkPermissions(user.permissions))) {
        return (
            <>
                <DocumentTitle value={`403 - ${title}`} />
                <FourHundredThree className={styles.view} />
            </>
        );
    }

    return (
        <>
            <DocumentTitle value={title} />
            <Comp className={styles.view} />
        </>
    );
}

export default View;
