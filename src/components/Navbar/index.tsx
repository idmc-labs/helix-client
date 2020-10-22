import React, { useContext, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { gql, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { IoMdPerson } from 'react-icons/io';

import { Button, PopupButton } from '@togglecorp/toggle-ui';

import DomainContext from '#components/DomainContext';

import route from '../../Root/App/Multiplexer/route';

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

    interface LogoutResponse {
        logout: {
            ok: boolean;
        }
    }

    const [logout] = useMutation<LogoutResponse>(
        LOGOUT,
        {
            onCompleted: (data: LogoutResponse) => {
                if (data.logout.ok) {
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
                <div className={styles.appBrand}>
                    Helix
                </div>
                <div className={styles.main}>
                    <div className={styles.navLinks}>
                        <NavLink
                            exact
                            className={_cs(styles.link, styles.disabledLink)}
                            activeClassName={styles.active}
                            to={route.dashboard.path}
                        >
                            {route.dashboard.title}
                        </NavLink>
                        {(user?.role === 'ADMIN' || user?.role === 'IT_HEAD') && (
                            <NavLink
                                exact
                                className={_cs(styles.link, styles.disabledLink)}
                                activeClassName={styles.active}
                                to={route.performanceAndAdmin.path}
                            >
                                {route.performanceAndAdmin.title}
                            </NavLink>
                        )}
                        <NavLink
                            exact
                            className={_cs(styles.link, styles.disabledLink)}
                            activeClassName={styles.active}
                            to={route.countries.path}
                        >
                            {route.countries.title}
                        </NavLink>
                        <NavLink
                            exact
                            className={styles.link}
                            activeClassName={styles.active}
                            to={route.crises.path}
                        >
                            {route.crises.title}
                        </NavLink>
                        <NavLink
                            exact
                            className={_cs(styles.link, styles.disabledLink)}
                            activeClassName={styles.active}
                            to={route.extraction.path}
                        >
                            {route.extraction.title}
                        </NavLink>
                        <NavLink
                            exact
                            className={_cs(styles.link, styles.disabledLink)}
                            activeClassName={styles.active}
                            to={route.grids.path}
                        >
                            {route.grids.title}
                        </NavLink>
                        <NavLink
                            exact
                            className={_cs(styles.link, styles.disabledLink)}
                            activeClassName={styles.active}
                            to={route.contacts.path}
                        >
                            {route.contacts.title}
                        </NavLink>
                    </div>
                </div>
                <div className={styles.actions}>
                    {authenticated && (
                        <PopupButton
                            name={undefined}
                            label={user?.username || 'Anon'}
                            transparent
                            uiMode="dark"
                            icons={(
                                <IoMdPerson />
                            )}
                        >
                            <Button
                                name={undefined}
                                onClick={handleLogout}
                                transparent
                            >
                                Sign Out
                            </Button>
                        </PopupButton>
                    )}
                </div>
            </div>
            <div className={styles.bottom}>
                <div className={styles.main}>
                    <div className={styles.navLinks}>
                        <NavLink
                            exact
                            className={styles.link}
                            activeClassName={styles.active}
                            to={route.newEntry.path}
                        >
                            {route.newEntry.title}
                        </NavLink>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
