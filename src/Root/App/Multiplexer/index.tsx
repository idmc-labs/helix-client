import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Switch, Route } from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';

import Navbar from '#components/Navbar';
import DomainContext from '#components/DomainContext';
import Loading from '#components/Loading';

import { User } from '#utils/typings';

import routeSettings from './route';

import styles from './styles.css';

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
    const [waiting, setWaiting] = useState(true);
    const [navbarVisibility, setNavbarVisibility] = useState(false);
    const authenticated = !!user;

    const onCompleted = useCallback(
        (data: Me) => {
            console.warn(data);
            setUser(data.me);
            setWaiting(false);
        },
        [],
    );

    // NOTE: loading is always false from useQuery idk why
    const { error } = useQuery<Me>(ME, { onCompleted });

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
    if (waiting) {
        return (
            <div className={_cs(className, styles.multiplexer)}>
                <Loading message="Checking user session..." />
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
                {navbarVisibility && authenticated && (
                    <Navbar className={styles.navbar} />
                )}
                <div className={styles.content}>
                    <Suspense
                        fallback={(
                            <Loading message="Loading page..." />
                        )}
                    >
                        <Switch>
                            <Route
                                exact
                                path={routeSettings.dashboard.path}
                                render={routeSettings.dashboard.load}
                            />
                            <Route
                                exact
                                path={routeSettings.countries.path}
                                render={routeSettings.countries.load}
                            />
                            <Route
                                exact
                                path={routeSettings.crises.path}
                                render={routeSettings.crises.load}
                            />
                            <Route
                                exact
                                path={routeSettings.extraction.path}
                                render={routeSettings.extraction.load}
                            />
                            <Route
                                exact
                                path={routeSettings.grids.path}
                                render={routeSettings.grids.load}
                            />
                            <Route
                                exact
                                path={routeSettings.contacts.path}
                                render={routeSettings.contacts.load}
                            />
                            <Route
                                exact
                                path={routeSettings.performanceAndAdmin.path}
                                render={routeSettings.performanceAndAdmin.load}
                            />
                            <Route
                                exact
                                path={routeSettings.newEntry.path}
                                render={routeSettings.newEntry.load}
                            />
                            <Route
                                exact
                                path={routeSettings.signIn.path}
                                render={routeSettings.signIn.load}
                            />
                            <Route
                                exact
                                path={routeSettings.signUp.path}
                                render={routeSettings.signUp.load}
                            />
                            <Route
                                exact
                                path={routeSettings.lost.path}
                                render={routeSettings.lost.load}
                                default
                            />
                        </Switch>
                    </Suspense>
                    <footer className={styles.footer}>
                        This is a footer
                    </footer>
                </div>
            </div>
        </DomainContext.Provider>
    );
}
export default Multiplexer;
