import React, { Suspense, useState, useCallback } from 'react';
import { useQuery, gql } from '@apollo/client';
import { setUser as setUserOnSentry } from '@sentry/react';
import { Switch, Route } from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';
import { v4 as uuidv4 } from 'uuid';

import AuthSync, { sync } from '#components/AuthSync';
import Navbar from '#components/Navbar';
import DomainContext from '#components/DomainContext';
import NotificationContext, {
    NotificationContextProps,
} from '#components/NotificationContext';
import Loading from '#components/Loading';

import {
    User,
    Notification,
    PurgeNull,
} from '#types';

import { removeNull } from '#utils/schema';
import {
    MeQuery,
    PermissionsType,
    Permission_Action, // eslint-disable-line camelcase
    Permission_Entity, // eslint-disable-line camelcase
} from '#generated/types';

import routeSettings, { lostRoute } from '#config/routes';

import styles from './styles.css';

const ME = gql`
    query Me {
      me {
          id
          email
          username
          role
          fullName
          permissions {
              action
              entities
          }
      }
    }
`;

const defaultNotification: Notification = {
    icons: null,
    actions: null,
    children: null,
    duration: 3000,
    horizontalPosition: 'middle',
    verticalPosition: 'end',
    variant: 'default',
};

interface Props {
    className?: string;
}

function transformPermissions(permissions: PermissionsType[]): User['permissions'] {
    const mapping: {
        // eslint-disable-next-line camelcase
        [entityKey in Permission_Entity]?: {
            // eslint-disable-next-line camelcase
            [key in Permission_Action]?: boolean;
        }
    } = {};

    permissions.forEach((permission) => {
        const { action, entities } = permission;
        entities.forEach((entity) => {
            const entityMapping = mapping[entity];
            if (entityMapping) {
                entityMapping[action] = true;
            } else {
                mapping[entity] = {
                    [action]: true,
                };
            }
        });
    });

    return mapping;
}

function Multiplexer(props: Props) {
    const {
        className,
    } = props;

    // TODO: need to sync authentication status between tabs
    const [user, setUser] = useState<User | undefined>();
    const [waiting, setWaiting] = useState(true);
    const [navbarVisibility, setNavbarVisibility] = useState(false);
    const [notifications, setNotifications] = React.useState<{
        [key: string]: Notification;
    }>({});

    const setUserWithSentry = useCallback(
        (u: PurgeNull<MeQuery['me']> | undefined) => {
            if (u) {
                const { permissions, ...others } = u;
                const newPermissions = transformPermissions(permissions ?? []);
                const newUser = {
                    ...others,
                    permissions: newPermissions,
                };
                setUser(newUser);
                sync(true, newUser.id);
            } else {
                setUser(undefined);
                sync(false, undefined);
            }
            setUserOnSentry(u === undefined ? null : u);
        },
        [],
    );

    const authenticated = !!user;

    // NOTE: no using loading because we need to setUser before loading is complete
    const { error } = useQuery<MeQuery>(ME, {
        fetchPolicy: 'network-only',
        onCompleted: (data) => {
            setUserWithSentry(removeNull(data.me));
            setWaiting(false);
        },
    });

    const dismiss = React.useCallback((id: string) => {
        setNotifications((oldNotifications) => {
            const newNotifications = { ...oldNotifications };
            delete newNotifications[id];

            return newNotifications;
        });
    }, [setNotifications]);

    const notify = React.useCallback((notification: Notification, id?: string) => {
        const notificationId = id ?? uuidv4();
        const data = {
            ...defaultNotification,
            ...notification,
        };
        setNotifications((oldNotifications) => ({
            ...oldNotifications,
            [notificationId]: data,
        }));

        if (data.duration !== Infinity) {
            window.setTimeout(() => {
                dismiss(notificationId);
            }, data.duration);
        }

        return notificationId;
    }, [setNotifications, dismiss]);

    const notificationContextValue: NotificationContextProps = React.useMemo(() => ({
        notify,
        dismiss,
    }), [notify, dismiss]);

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
        setUser: setUserWithSentry,

        navbarVisibility,
        setNavbarVisibility,
    };

    const notificationKeyList = Object.keys(notifications);

    return (
        <>
            <AuthSync />
            <DomainContext.Provider value={domainContextValue}>
                <NotificationContext.Provider value={notificationContextValue}>
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
                                        path={routeSettings.country.path}
                                        render={routeSettings.country.load}
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
                                        path={routeSettings.events.path}
                                        render={routeSettings.events.load}
                                    />
                                    <Route
                                        exact
                                        path={routeSettings.extraction.path}
                                        render={routeSettings.extraction.load}
                                    />
                                    <Route
                                        exact
                                        path={routeSettings.entry.path}
                                        render={routeSettings.entry.load}
                                    />
                                    <Route
                                        exact
                                        path={routeSettings.entryReview.path}
                                        render={routeSettings.entryReview.load}
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
                                        path={routeSettings.actors.path}
                                        render={routeSettings.actors.load}
                                    />
                                    <Route
                                        exact
                                        path={routeSettings.parkingLot.path}
                                        render={routeSettings.parkingLot.load}
                                    />
                                    <Route
                                        exact
                                        path={routeSettings.organizations.path}
                                        render={routeSettings.organizations.load}
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
                                        path={lostRoute.path}
                                        render={lostRoute.load}
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
                </NotificationContext.Provider>
            </DomainContext.Provider>
            <div className={styles.notificationContainer}>
                { notificationKeyList.map((notificationKey) => {
                    const notification = notifications[notificationKey];

                    return (
                        <div
                            className={styles.notification}
                            key={notificationKey}
                        >
                            { notification.icons && (
                                <div className={styles.icons}>
                                    { notification.icons }
                                </div>
                            )}
                            { notification.children && (
                                <div className={styles.children}>
                                    { notification.children }
                                </div>
                            )}
                            { notification.actions && (
                                <div className={styles.actions}>
                                    { notification.actions }
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}
export default Multiplexer;
