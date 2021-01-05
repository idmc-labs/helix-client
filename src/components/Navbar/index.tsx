import React, { useContext, useCallback } from 'react';
import { gql, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { MdAdd } from 'react-icons/md';

import {
    ConfirmButton,
    PopupButton,
    Avatar,
} from '@togglecorp/toggle-ui';

import SmartNavLink from '#components/SmartNavLink';
import BrandHeader from '#components/BrandHeader';
import DomainContext from '#components/DomainContext';
import ButtonLikeLink from '#components/ButtonLikeLink';

import { LogoutMutation } from '#generated/types';
import route from '#config/routes';

import styles from './styles.css';

const LOGOUT = gql`
    mutation Logout {
        logout {
            ok
        }
    }
`;

interface Props {
    className?: string;
}

const Navbar = (props: Props) => {
    const { className } = props;

    const {
        authenticated,
        setUser,
        user,
    } = useContext(DomainContext);

    const [logout] = useMutation<LogoutMutation>(
        LOGOUT,
        {
            onCompleted: (data) => {
                if (data.logout?.ok) {
                    setUser(undefined);
                }
                // TODO: handle what to do if not okay?
            },
            // TODO: handle onError
        },
    );

    const handleLogout = useCallback(
        () => {
            logout();
        },
        [logout],
    );

    return (
        <nav className={_cs(className, styles.navbar)}>
            <div className={styles.top}>
                <BrandHeader className={styles.appBrand} />
                <div className={styles.main}>
                    <div className={styles.navLinks}>
                        <SmartNavLink
                            exact
                            className={styles.link}
                            activeClassName={styles.active}
                            route={route.dashboard}
                        />
                        <SmartNavLink
                            exact
                            className={styles.link}
                            activeClassName={styles.active}
                            route={route.countries}
                        />
                        <SmartNavLink
                            exact
                            className={styles.link}
                            activeClassName={styles.active}
                            route={route.crises}
                        />
                        <SmartNavLink
                            exact
                            className={styles.link}
                            activeClassName={styles.active}
                            route={route.extraction}
                        />
                        <SmartNavLink
                            exact
                            className={_cs(styles.link, styles.disabledLink)}
                            activeClassName={styles.active}
                            route={route.grids}
                        />
                        <SmartNavLink
                            exact
                            className={styles.link}
                            activeClassName={styles.active}
                            route={route.performanceAndAdmin}
                        />
                    </div>
                </div>
                <div className={styles.actions}>
                    {authenticated && user && (
                        <PopupButton
                            name={undefined}
                            label={user.fullName ?? user.username}
                            transparent
                            uiMode="dark"
                            icons={(
                                <Avatar
                                    alt={user.fullName ?? user.username}
                                />
                            )}
                        >
                            <ButtonLikeLink
                                className={styles.button}
                                route={route.contacts}
                                transparent
                            >
                                {route.contacts.title}
                            </ButtonLikeLink>
                            <ButtonLikeLink
                                className={styles.button}
                                route={route.organizations}
                                transparent
                            >
                                {route.organizations.title}
                            </ButtonLikeLink>
                            <ButtonLikeLink
                                className={styles.button}
                                route={route.actors}
                                transparent
                            >
                                {route.actors.title}
                            </ButtonLikeLink>
                            <ConfirmButton
                                className={styles.button}
                                name={undefined}
                                onConfirm={handleLogout}
                                transparent
                            >
                                Sign Out
                            </ConfirmButton>
                        </PopupButton>
                    )}
                </div>
            </div>
            <div className={styles.bottom}>
                <div className={styles.main}>
                    <div className={styles.navLinks}>
                        <ButtonLikeLink
                            className={styles.newEntryLink}
                            icons={(
                                <MdAdd />
                            )}
                            route={route.newEntry}
                        >
                            New Entry
                        </ButtonLikeLink>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
