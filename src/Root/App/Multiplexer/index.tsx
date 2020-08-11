import React, { Suspense, useEffect, useState, useCallback, lazy, createContext, useContext } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Switch, Route, Redirect } from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';

import Navbar from '#components/Navbar';

import styles from './styles.css';

type AuthStatus = 'yes' | 'no' | 'any';

interface DomainContext {
    user: User | undefined;
    navbarVisibility: boolean;
    setNavbarVisibility: (visibility: boolean) => void;
    authenticated: boolean,
}

const DomainContext = createContext<DomainContext>({
    user: undefined,
    navbarVisibility: false,
    setNavbarVisibility: (visibility: boolean) => {
        console.warn('Trying to set navbar visibility to ', visibility);
    },
    authenticated: false,
});

const routeSettings = {
    home: {
        path: '/',
        // eslint-disable-next-line no-use-before-define
        load: wrap({
            title: 'Home',
            navbarVisible: true,
            component: lazy(() => import('../../../views/Home')),
            authStatus: 'yes',
        }),
    },
    login: {
        path: '/login/',
        // eslint-disable-next-line no-use-before-define
        load: wrap({
            title: 'Login',
            navbarVisible: false,
            component: lazy(() => import('../../../views/Login')),
            authStatus: 'no',
        }),
    },
    lost: {
        path: undefined,
        // eslint-disable-next-line no-use-before-define
        load: wrap({
            title: '404',
            navbarVisible: true,
            component: lazy(() => import('../../../views/FourHundredFour')),
            authStatus: 'any',
        }),
    },
};

interface WrapProps {
    title: string;
    navbarVisible: boolean;
    component: React.FC<{ className: string | undefined }>;
    authStatus: AuthStatus,
}

function WrappedComponent(props: WrapProps) {
    const {
        component: Comp,
        title,
        navbarVisible,
        authStatus,
    } = props;

    const {
        authenticated,
        setNavbarVisibility,
    } = useContext(DomainContext);

    const redirectToLogin = authStatus === 'yes' && !authenticated;
    const redirectToHome = authStatus === 'no' && authenticated;

    const redirect = redirectToLogin || redirectToHome;

    useEffect(
        () => {
            // NOTE: should not set visibility for redirection
            // or, navbar will flash
            if (!redirect) {
                setNavbarVisibility(navbarVisible);
            }
        },
        // NOTE: setNavbarVisibility will not change, navbarVisible will not change
        [setNavbarVisibility, navbarVisible, redirect],
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

interface LoadingProps {
    message: string;
    delay?: number;
}
function Loading(props: LoadingProps) {
    const {
        message,
        delay = 200,
    } = props;

    const initialVisibility = delay <= 0;
    const [visibility, setVisibility] = useState(initialVisibility);

    useEffect(
        () => {
            const timeout = setTimeout(
                () => {
                    setVisibility(true);
                },
                delay,
            );
            return () => {
                clearTimeout(timeout);
            };
        },
        [delay],
    );

    return (
        <div className={styles.loading}>
            {visibility ? <h3>{message}</h3> : undefined}
        </div>
    );
}

interface User {
    username: string;
    email: string;
    id: number;
}

interface Me {
    me?: {
        user: User,
    }
}

const ME = gql`
query GetMe {
  me {
    username
    email
    id
  }
}
`;

interface Props {
    className?: string;
}

function Multiplexer(props: Props) {
    const {
        className,
    } = props;

    // TODO: need to sync authentication status between tabs
    const [user, setUser] = useState<User | undefined>();
    const [navbarVisibility, setNavbarVisibility] = useState(false);
    const authenticated = !!user;

    const onCompleted = useCallback(
        (data: Me) => {
            setUser(data.me?.user);
        },
        [],
    );

    const { loading, error } = useQuery<Me>(ME, { onCompleted });

    if (loading) {
        return (
            <div className={_cs(className, styles.multiplexer)}>
                <Loading message="Checking user session..." />
            </div>
        );
    }
    if (error) {
        return (
            <div className={_cs(className, styles.multiplexer)}>
                <Loading
                    message="Some error occurred!"
                    delay={0}
                />
            </div>
        );
    }

    const domainContextValue: DomainContext = {
        authenticated,
        user,
        navbarVisibility,
        setNavbarVisibility,
    };

    return (
        <DomainContext.Provider value={domainContextValue}>
            <div className={_cs(className, styles.multiplexer)}>
                {navbarVisibility && (
                    <Navbar
                        className={styles.navbar}
                    />
                )}
                <Suspense
                    fallback={(
                        <Loading message="Please wait..." />
                    )}
                >
                    <Switch>
                        <Route
                            exact
                            className={styles.route}
                            path={routeSettings.home.path}
                            render={routeSettings.home.load}
                        />
                        <Route
                            exact
                            className={styles.route}
                            path={routeSettings.login.path}
                            render={routeSettings.login.load}
                        />
                        <Route
                            exact
                            className={styles.route}
                            path={routeSettings.lost.path}
                            render={routeSettings.lost.load}
                            default
                        />
                    </Switch>
                </Suspense>
            </div>
        </DomainContext.Provider>
    );
}
export default Multiplexer;
