import React, { Suspense, useState, useCallback, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { setUser as setUserOnSentry } from '@sentry/react';
import { Switch, Route } from 'react-router-dom';
import { _cs, isTruthyString } from '@togglecorp/fujs';
import { removeNull } from '@togglecorp/toggle-form';
import { v4 as uuidv4 } from 'uuid';
import { IoAlertCircleOutline, IoCloseCircleOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';

import AuthSync, { sync } from '#components/AuthSync';
import Navbar from '#components/Navbar';
import DomainContext from '#components/DomainContext';
import OptionContext, { Options } from '#components/OptionContext';
import NotificationContext, {
    NotificationContextProps,
} from '#components/NotificationContext';
import Loading from '#components/Loading';
import ExternalLink from '#components/tableHelpers/ExternalLink';
import { ObjectError } from '#utils/errorTransform';

import {
    User,
    Notification,
    NotificationVariant,
    PurgeNull,
} from '#types';

import {
    MeQuery,
    PermissionsType,
    Permission_Action, // eslint-disable-line camelcase
    Permission_Entity, // eslint-disable-line camelcase
} from '#generated/types';

import routeSettings, { lostRoute } from '#config/routes';

import styles from './styles.css';

const notificationVariantToClassNameMap: { [key in NotificationVariant]: string } = {
    default: styles.default,
    success: styles.success,
    error: styles.error,
};

const ME = gql`
    query Me {
        me {
            id
            fullName
            isAdmin
            isActive
            portfolioRole
            portfolios {
                id
                role
                monitoringSubRegion {
                    id
                    name
                    countries {
                        id
                        idmcShortName
                        boundingBox
                        iso2
                    }
                }
            }
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
    duration: 5_000,

    horizontalPosition: 'middle',
    verticalPosition: 'end',
    variant: 'default',
};

const currentYear = new Date().getFullYear();

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

    const [user, setUser] = useState<PurgeNull<MeQuery['me']> | undefined>();
    const [options, setOptions] = useState<Options>({});
    const [waiting, setWaiting] = useState(true);
    const [navbarVisibility, setNavbarVisibility] = useState(false);
    const [notifications, setNotifications] = useState<{
        [key: string]: Notification;
    }>({});

    const userWithPermissions = useMemo(
        (): User | undefined => {
            if (!user) {
                return undefined;
            }
            const { permissions, ...others } = user;
            const newPermissions = transformPermissions(permissions ?? []);
            const newUser: User = {
                ...others,
                permissions: newPermissions,
            };
            return newUser;
        },
        [user],
    );

    const setUserWithSentry: typeof setUser = useCallback(
        (u) => {
            if (typeof u === 'function') {
                setUser((oldUser) => {
                    const newUser = u(oldUser);
                    sync(!!newUser, newUser?.id);
                    setUserOnSentry(newUser === undefined ? null : newUser);
                    return newUser;
                });
            } else {
                sync(!!u, u?.id);
                setUserOnSentry(u === undefined ? null : u);
                setUser(u);
            }
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

    const dismiss = useCallback((id: string) => {
        setNotifications((oldNotifications) => {
            const newNotifications = { ...oldNotifications };
            delete newNotifications[id];

            return newNotifications;
        });
    }, [setNotifications]);

    const notify = useCallback((notification: Notification, id?: string) => {
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

    const notifyGQLError = useCallback(
        (errors: unknown[], id?: string) => {
            const safeErrors = errors as ObjectError[];
            let errorString = safeErrors
                .filter((item) => item.field === 'nonFieldErrors')
                .map((item) => item.messages)
                .filter(isTruthyString)
                .join('\n');
            if (errorString === '') {
                errorString = 'Some error occurred!';
            }
            return notify({
                children: errorString,
                variant: 'error',
            }, id);
        },
        [notify],
    );

    const notificationContextValue: NotificationContextProps = useMemo(() => ({
        notify,
        notifyGQLError,
        dismiss,
    }), [notify, notifyGQLError, dismiss]);

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

        user: userWithPermissions,
        setUser: setUserWithSentry,

        navbarVisibility,
        setNavbarVisibility,
    };

    const optionContextValue: OptionContext = {
        options,
        setOptions,
    };

    const notificationKeyList = Object.keys(notifications);

    return (
        <>
            <AuthSync />
            <OptionContext.Provider value={optionContextValue}>
                <DomainContext.Provider value={domainContextValue}>
                    <NotificationContext.Provider value={notificationContextValue}>
                        <div className={_cs(className, styles.multiplexer)}>
                            {navbarVisibility && authenticated && (
                                <Navbar className={styles.navbar} />
                            )}
                            <div
                                className={styles.content}
                                data-multiplexer-content
                            >
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
                                            path={routeSettings.notifications.path}
                                            render={routeSettings.notifications.load}
                                        />
                                        <Route
                                            exact
                                            path={routeSettings.regions.path}
                                            render={routeSettings.regions.load}
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
                                            path={routeSettings.extractions.path}
                                            render={routeSettings.extractions.load}
                                        />
                                        <Route
                                            exact
                                            path={routeSettings.contextualUpdates.path}
                                            render={routeSettings.contextualUpdates.load}
                                        />
                                        <Route
                                            exact
                                            path={routeSettings.apiUsage.path}
                                            render={routeSettings.apiUsage.load}
                                        />
                                        <Route
                                            exact
                                            path={routeSettings.contextualUpdateView.path}
                                            render={routeSettings.contextualUpdateView.load}
                                        />
                                        <Route
                                            exact
                                            path={routeSettings.entryEdit.path}
                                            render={routeSettings.entryEdit.load}
                                        />
                                        <Route
                                            exact
                                            path={routeSettings.entryView.path}
                                            render={routeSettings.entryView.load}
                                        />
                                        <Route
                                            exact
                                            path={routeSettings.newEntryFromParkedItem.path}
                                            render={routeSettings.newEntryFromParkedItem.load}
                                        />
                                        <Route
                                            exact
                                            path={routeSettings.reports.path}
                                            render={routeSettings.reports.load}
                                        />
                                        <Route
                                            exact
                                            path={routeSettings.report.path}
                                            render={routeSettings.report.load}
                                        />
                                        <Route
                                            exact
                                            path={routeSettings.contacts.path}
                                            render={routeSettings.contacts.load}
                                        />
                                        <Route
                                            exact
                                            path={routeSettings.gidd.path}
                                            render={routeSettings.gidd.load}
                                        />
                                        <Route
                                            exact
                                            path={routeSettings.admin.path}
                                            render={routeSettings.admin.load}
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
                                            path={routeSettings.figureTags.path}
                                            render={routeSettings.figureTags.load}
                                        />
                                        <Route
                                            exact
                                            path={routeSettings.violenceContext.path}
                                            render={routeSettings.violenceContext.load}
                                        />
                                        <Route
                                            exact
                                            path={routeSettings.qaDashboard.path}
                                            render={routeSettings.qaDashboard.load}
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
                                            path={routeSettings.forgetPassword.path}
                                            render={routeSettings.forgetPassword.load}
                                        />
                                        <Route
                                            exact
                                            path={routeSettings.resetPassword.path}
                                            render={routeSettings.resetPassword.load}
                                        />
                                        <Route
                                            exact
                                            path={routeSettings.eventReview.path}
                                            render={routeSettings.eventReview.load}
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
                                    <div>
                                        Copyright @ IDMC
                                        {' '}
                                        {currentYear}
                                    </div>
                                    <div className={styles.links}>
                                        <ExternalLink
                                            link="https://norwegianrefugeecouncil.sharepoint.com/:w:/r/sites/idmc-idmc-all-idmc/_layouts/15/Doc.aspx?sourcedoc=%7BA79C8A5A-654C-4E2D-99D8-755C11660FD2%7D&file=(2022-08-12)%20What%20is%20new%20in%20Helix%202.docx&wdLOR=cFAD5AB4E-406A-4246-A06C-7317AFD5F588&action=default&mobileredirect=true&cid=a34ff18e-94f9-4e85-90e8-1890b781726a"
                                            title="Help"
                                        />
                                    </div>
                                </footer>
                            </div>
                        </div>
                    </NotificationContext.Provider>
                </DomainContext.Provider>
            </OptionContext.Provider>
            <div className={styles.notificationContainer}>
                {notificationKeyList.map((notificationKey) => {
                    const notification = notifications[notificationKey];

                    let defaultIcon;
                    if (notification.variant === 'error') {
                        defaultIcon = <IoCloseCircleOutline />;
                    } else if (notification.variant === 'success') {
                        defaultIcon = <IoCheckmarkCircleOutline />;
                    } else {
                        defaultIcon = <IoAlertCircleOutline />;
                    }

                    const icon = notification.icons ?? defaultIcon;

                    return (
                        <div
                            className={_cs(
                                styles.notification,
                                notification.variant
                                && notificationVariantToClassNameMap[notification.variant],
                            )}
                            key={notificationKey}
                        >
                            {icon && (
                                <div className={styles.icons}>
                                    {icon}
                                </div>
                            )}
                            {notification.children && (
                                <div className={styles.children}>
                                    {notification.children}
                                </div>
                            )}
                            {notification.actions && (
                                <div className={styles.actions}>
                                    {notification.actions}
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
