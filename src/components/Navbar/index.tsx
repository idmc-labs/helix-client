import React, { useState, useContext, useCallback, useMemo } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { MdAdd } from 'react-icons/md';

import {
    ConfirmButton,
    PopupButton,
    Avatar,
    Modal,
    Button,
    DateTime,
    Pager,
    useSortState,
    SortContext,
} from '@togglecorp/toggle-ui';
import {
    IoDocumentOutline,
    // IoFolderOutline,
    IoInformationCircleSharp,
} from 'react-icons/io5';
import { FaDownload } from 'react-icons/fa';

import SmartNavLink from '#components/SmartNavLink';
import ButtonLikeExternalLink from '#components/ButtonLikeExternalLink';
import BrandHeader from '#components/BrandHeader';
import DomainContext from '#components/DomainContext';
import ButtonLikeLink from '#components/ButtonLikeLink';
import UserProfileUpdateForm from '#components/forms/UserProfileUpdateForm';
import UserPasswordChange from '#components/UserPasswordChange';
import Container from '#components/Container';

import { LogoutMutation, ExcelExportsQuery, ExcelExportsQueryVariables } from '#generated/types';
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

const DOWNLOADS = gql`
  query ExcelExports($ordering: String, $page: Int, $pageSize: Int) {
    excelExports(pageSize: $pageSize, page: $page, ordering: $ordering) {
        totalCount
        results {
            id
            downloadType
            startedAt
            status
            file
          }
      }
   }
`;

interface DownloadedItemProps {
    className?: string;
    file: string | null | undefined;
    date: string | null | undefined;
    downloadType: string | null | undefined;
    status: string | null | undefined;
}

function DownloadedItem(props: DownloadedItemProps) {
    const {
        file,
        date,
        className,
        downloadType,
        status,
    } = props;

    /* const statusText: {
        [key in Exclude<ReportGenerationStatus, 'COMPLETED'>]: string;
    } = {
        PENDING: 'The download will start soon.',
        IN_PROGRESS: 'The download has started.',
        FAILED: 'The download has failed.',
    }; */

    return (
        <div
            className={_cs(styles.generationItem, className)}
        >
            <div className={styles.exportItem}>
                <span className={styles.name}>
                    File:
                </span>
                <span className={styles.name}>
                    {downloadType}
                    .xlsx
                </span>
                <span>
                    Downloaded on
                </span>
                <DateTime
                    value={date}
                    format="datetime"
                />
            </div>
            {status === 'COMPLETED' && (
                <div className={styles.actions}>
                    {file && (
                        <ButtonLikeExternalLink
                            title="export.xlsx"
                            link={file}
                            icons={<IoDocumentOutline />}
                            transparent
                        />
                    )}
                </div>
            )}
            {status !== 'COMPLETED' && (
                <div className={styles.status}>
                    <IoInformationCircleSharp className={styles.icon} />
                    <div className={styles.text}>
                        <p>Sorry, the download has failed.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

interface Props {
    className?: string;
}

const Navbar = (props: Props) => {
    const { className } = props;

    const sortState = useSortState();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const ordering = '-startedAt';

    const downloadVariables = useMemo(
        (): ExcelExportsQueryVariables => ({
            ordering,
            page,
            pageSize,
        }),
        [ordering, page, pageSize],
    );

    const {
        data: downloadData,
        // loading: downloadDataLoading,
    } = useQuery<ExcelExportsQuery>(DOWNLOADS, { variables: downloadVariables });

    const allDownloads = downloadData?.excelExports;
    const downloadFiles = allDownloads?.results;
    const totalCrisesCount = allDownloads?.totalCount ?? 0;
    console.log('Downloads data in NavBar of components::.>>', downloadData);

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
                        {/*
                            <SmartNavLink
                                exact
                                className={styles.link}
                                activeClassName={styles.active}
                                route={route.contextualUpdates}
                            />
                        */}
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

                <div className={styles.downloads}>
                    <PopupButton
                        name={undefined}
                        variant="accent"
                        popupClassName={styles.popup}
                        popupContentClassName={styles.popupContent}
                        label={<FaDownload />}
                        transparent
                        arrowHidden
                    >
                        <Container
                            className={styles.container}
                            contentClassName={styles.content}
                            heading="Downloads"
                            footerContent={(
                                <Pager
                                    activePage={page}
                                    itemsCount={totalCrisesCount}
                                    maxItemsPerPage={pageSize}
                                    onActivePageChange={setPage}
                                    onItemsPerPageChange={setPageSize}
                                />
                            )}
                        >
                            {totalCrisesCount > 0 && (
                                <SortContext.Provider value={sortState}>
                                    {downloadFiles && downloadFiles.length > 0
                                        && downloadFiles.map((item) => (
                                            <DownloadedItem
                                                key={item.id}
                                                file={item.file}
                                                date={item.startedAt}
                                                downloadType={item.downloadType}
                                                status={item.status}
                                            />
                                        ))}
                                </SortContext.Provider>
                            )}
                        </Container>
                    </PopupButton>
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
