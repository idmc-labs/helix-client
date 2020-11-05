import React, { Suspense, useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Switch, Route } from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';

import Navbar from '#components/Navbar';
import DomainContext from '#components/DomainContext';
import Loading from '#components/Loading';

import { User } from '#types';
import { MeQuery } from '#generated/types';

import routeSettings from './route';

import styles from './styles.css';

const ME = gql`
    query Me {
      me {
          id
          email
          username
          role
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

    // NOTE: no using loading because we need to setUser before loading is complete
    const { error } = useQuery<MeQuery>(ME, {
        onCompleted: (data) => {
            setUser(data.me);
            setWaiting(false);
        },
    });

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
                                path={routeSettings.event.path}
                                render={routeSettings.event.load}
                            />
                            <Route
                                exact
                                path={routeSettings.crisis.path}
                                render={routeSettings.crisis.load}
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
                        <div className={styles.copyrightMessage}>
                            Copyright @ IDMC 2020
                        </div>
                        <div className={styles.links}>
                            <div className={styles.link}>
                                Help
                            </div>
                            <div className={styles.link}>
                                Contact
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </DomainContext.Provider>
    );
}
export default Multiplexer;
