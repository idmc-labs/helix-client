import React, { useContext, useCallback } from 'react';
import { gql, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { MdAdd } from 'react-icons/md';

import {
    ConfirmButton,
    PopupButton,
    Avatar,
    Modal,
    Button,
} from '@togglecorp/toggle-ui';

import SmartNavLink from '#components/SmartNavLink';
import BrandHeader from '#components/BrandHeader';
import DomainContext from '#components/DomainContext';
import ButtonLikeLink from '#components/ButtonLikeLink';
import UserProfileUpdateForm from '#components/forms/UserProfileUpdateForm';
import UserPasswordChange from '#components/UserPasswordChange';

import { LogoutMutation } from '#generated/types';
import useModalState from '#hooks/useModalState';
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

    const [
        userProfileFormOpened, ,
        showUserProfileForm,
        hideUserProfileForm,
    ] = useModalState();

    const [
        userPasswordChangeOpened, ,
        showUserPasswordChange,
        hideUserPasswordChange,
    ] = useModalState();

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

    const updateUser = useCallback(
        (newUser: { fullName: string }) => {
            setUser((oldUser) => {
                if (!oldUser) {
                    return undefined;
                }
                return {
                    ...oldUser,
                    fullName: newUser.fullName,
                };
            });
            hideUserProfileForm();
        },
        [hideUserProfileForm, setUser],
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
                            route={route.events}
                        />
                        <SmartNavLink
                            exact
                            className={styles.link}
                            activeClassName={styles.active}
                            route={route.contextualUpdates}
                        />
                        <SmartNavLink
                            exact
                            className={styles.link}
                            activeClassName={styles.active}
                            route={route.extractions}
                        />
                        <SmartNavLink
                            exact
                            className={styles.link}
                            activeClassName={styles.active}
                            route={route.reports}
                        />
                        <SmartNavLink
                            exact
                            className={styles.link}
                            activeClassName={styles.active}
                            route={route.admin}
                        />
                    </div>
                </div>
                <div className={styles.actions}>
                    <ButtonLikeLink
                        className={styles.newEntryLink}
                        icons={(
                            <MdAdd />
                        )}
                        route={route.newEntry}
                    >
                        New Entry
                    </ButtonLikeLink>
                    {authenticated && user && (
                        <PopupButton
                            className={styles.dropdown}
                            name={undefined}
                            label={user.fullName}
                            transparent
                            uiMode="dark"
                            icons={(
                                <Avatar
                                    alt={user.fullName}
                                />
                            )}
                        >
                            <Button
                                className={styles.button}
                                name={undefined}
                                onClick={showUserProfileForm}
                                transparent
                            >
                                Update Profile
                            </Button>
                            <Button
                                className={styles.button}
                                name={undefined}
                                onClick={showUserPasswordChange}
                                transparent
                            >
                                Change Password
                            </Button>
                            <ButtonLikeLink
                                className={styles.button}
                                route={route.parkingLot}
                                transparent
                            >
                                {route.parkingLot.title}
                            </ButtonLikeLink>
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
                            <ButtonLikeLink
                                className={styles.button}
                                route={route.figureTags}
                                transparent
                            >
                                {route.figureTags.title}
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
                {userProfileFormOpened && user && (
                    <Modal
                        onClose={hideUserProfileForm}
                        heading="Update Profile"
                    >
                        <UserProfileUpdateForm
                            userId={user.id}
                            onFormSave={updateUser}
                            onFormCancel={hideUserProfileForm}
                        />
                    </Modal>
                )}
                {userPasswordChangeOpened && user && (
                    <Modal
                        onClose={hideUserPasswordChange}
                        heading="Change Password"
                    >
                        <UserPasswordChange
                            onUserFormClose={hideUserPasswordChange}
                        />
                    </Modal>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
