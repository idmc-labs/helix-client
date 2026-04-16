import React, { useContext, useCallback } from 'react';
import { gql, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { IoAddOutline } from 'react-icons/io5';

import {
    useBooleanState,
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
import UserPasswordChangeForm from '#components/forms/UserPasswordChangeForm';
import OptionContext from '#components/OptionContext';

import { LogoutMutation } from '#generated/types';
import useModalState from '#hooks/useModalState';
import route from '#config/routes';
import { filterStorage } from '#utils/filterStorage';

import Downloads from './Downloads';
import Notifications from './Notifications';
import styles from './styles.module.css';

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

function Navbar(props: Props) {
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

    const { setOptions } = useContext(OptionContext);

    const [logout] = useMutation<LogoutMutation>(
        LOGOUT,
        {
            onCompleted: (data) => {
                if (data.logout?.ok) {
                    setUser(undefined);
                    // NOTE: Clear all local storage values on logout
                    filterStorage.clearAll();
                    // NOTE: clearing options upon logout to prevent maintaining same state
                    // in case the user logs back in without a full page refresh.
                    setOptions({});
                }
                // TODO: handle error
            },
            // TODO: handle error
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

    const [
        logoutConfirmModalShown,
        showLogoutConfirmModal,
        hideLogoutConfirmModal,
    ] = useBooleanState(false);

    let userSuffix: string | undefined;
    if (user?.portfolioRole === 'MONITORING_EXPERT') {
        userSuffix = 'ME';
    } else if (user?.portfolioRole === 'REGIONAL_COORDINATOR') {
        userSuffix = 'RC';
    }

    return (
        <nav className={_cs(className, styles.navbar)}>
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
                        className={styles.link}
                        activeClassName={styles.active}
                        route={route.countries}
                    />
                    <SmartNavLink
                        className={styles.link}
                        activeClassName={styles.active}
                        route={route.crises}
                    />
                    <SmartNavLink
                        className={styles.link}
                        activeClassName={styles.active}
                        route={route.events}
                    />
                    <SmartNavLink
                        exact
                        className={styles.link}
                        activeClassName={styles.active}
                        route={route.extractions}
                    />
                    <SmartNavLink
                        className={styles.link}
                        activeClassName={styles.active}
                        route={route.reports}
                    />
                    <SmartNavLink
                        className={styles.link}
                        activeClassName={styles.active}
                        route={route.qaDashboard}
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
                <Notifications
                    className={styles.notificationsContainer}
                    buttonClassName={styles.notifications}
                />
                <Downloads
                    className={styles.downloadsContainer}
                    buttonClassName={styles.downloads}
                />
                <ButtonLikeLink
                    className={styles.newEntryLink}
                    icons={(
                        <IoAddOutline />
                    )}
                    route={route.newEntry}
                >
                    New Entry
                </ButtonLikeLink>
                {authenticated && user && (
                    <PopupButton
                        className={styles.dropdown}
                        name={undefined}
                        label={userSuffix ? `${user.fullName}, ${userSuffix}` : user.fullName}
                        transparent
                        uiMode="dark"
                        icons={(
                            <Avatar
                                alt={user.fullName}
                            />
                        )}
                        persistent={false}
                    >
                        <ButtonLikeLink
                            className={styles.button}
                            route={route.regions}
                            transparent
                        >
                            {route.regions.title}
                        </ButtonLikeLink>
                        <ButtonLikeLink
                            className={styles.button}
                            route={route.gidd}
                            transparent
                        >
                            {route.gidd.title}
                        </ButtonLikeLink>
                        <ButtonLikeLink
                            className={styles.button}
                            route={route.apiUsage}
                            transparent
                        >
                            {route.apiUsage.title}
                        </ButtonLikeLink>
                        <ButtonLikeLink
                            className={styles.button}
                            route={route.averageHouseholdSize}
                            transparent
                        >
                            {route.averageHouseholdSize.title}
                        </ButtonLikeLink>
                        <div className={styles.rowLine} />
                        <ButtonLikeLink
                            className={styles.button}
                            route={route.parkingLot}
                            transparent
                        >
                            {route.parkingLot.title}
                        </ButtonLikeLink>
                        <ButtonLikeLink
                            className={styles.button}
                            route={route.contextualUpdates}
                            transparent
                        >
                            {route.contextualUpdates.title}
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
                        <ButtonLikeLink
                            className={styles.button}
                            route={route.violenceContext}
                            transparent
                        >
                            {route.violenceContext.title}
                        </ButtonLikeLink>
                        <div className={styles.rowLine} />
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
                        <Button
                            className={styles.button}
                            name={undefined}
                            onClick={showLogoutConfirmModal}
                            transparent
                        >
                            Sign Out
                        </Button>
                    </PopupButton>
                )}
            </div>
            {/* NOTE: We are replacing confirm button
            because of issue with modal closing before action is triggered */}
            {logoutConfirmModalShown && (
                <Modal
                    heading="Sign Out"
                    onClose={hideLogoutConfirmModal}
                    footerClassName={styles.actionButtonsRow}
                    freeHeight
                    size="medium"
                    footer={(
                        <>
                            <Button
                                className={styles.actionButton}
                                name={undefined}
                                onClick={hideLogoutConfirmModal}
                            >
                                Cancel
                            </Button>
                            <Button
                                name={undefined}
                                className={styles.actionButton}
                                onClick={logout}
                                variant="primary"
                                autoFocus
                            >
                                Confirm
                            </Button>
                        </>
                    )}
                >
                    Are you sure you want to sign out?
                </Modal>
            )}
            {userProfileFormOpened && user && (
                <Modal
                    onClose={hideUserProfileForm}
                    heading="Update Profile"
                    size="medium"
                    freeHeight
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
                    size="medium"
                    freeHeight
                >
                    <UserPasswordChangeForm
                        onUserFormClose={hideUserPasswordChange}
                    />
                </Modal>
            )}
        </nav>
    );
}

export default Navbar;
