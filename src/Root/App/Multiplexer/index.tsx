import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Switch, Route } from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';

import Navbar from '#components/Navbar';
import DomainContext from '#components/DomainContext';

import routeSettings from './route';

import styles from './styles.css';

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
    me?: User;
}

const ME = gql`
query GetMe {
  me {
      id
      email
      username
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
            console.warn(data);
            setUser(data.me);
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
        setUser,

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
                        <Loading message="Loading page..." />
                    )}
                >
                    <Switch>
                        <Route
                            exact
                            path={routeSettings.home.path}
                            render={routeSettings.home.load}
                        />
                        <Route
                            exact
                            path={routeSettings.login.path}
                            render={routeSettings.login.load}
                        />
                        <Route
                            exact
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
