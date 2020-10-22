import React, { useCallback, useState, useMemo } from 'react';
import { IoMdClose } from 'react-icons/io';
import {
    FaPlus,
    FaSearch,
} from 'react-icons/fa';
import { gql, useQuery } from '@apollo/client';
import {
    _cs,
    caseInsensitiveSubmatch,
    compareStringSearch,
} from '@togglecorp/fujs';

import Container from '#components/Container';
import QuickActionButton from '#components/QuickActionButton';

import useBasicToggle from '../../../hooks/toggleBasicState';

import GroupForm from './GroupForm';
import ResourceForm from './ResourceForm';
import ResourcesAccordion from './ResourcesAccordion';
import SearchResourceForm from './SearchResourceForm';

import { Resource, Group, Country } from './myResources.interface';

import styles from './styles.css';

interface GetGroupsListResponse {
    resourceGroupList: {
        results: Group[],
    };
}

interface GetResoucesListResponse {
    resourceList: {
        results: Resource[],
    };
}

const GET_RESOURCES_LIST = gql`
    query MyQuery {
        resourceList {
          results {
            id
            name
            url
            createdAt
            lastAccessedOn
            group {
              id
              name
            }
            countries {
                id
            }
          }
        }
      }
`;

const GET_GROUPS_LIST = gql`
    query MyQuery {
        resourceGroupList {
            results {
                name
                id
            }
        }
    }
`;

const GET_COUNTRIES_LIST = gql`
    query CountryList {
        countryList {
            results {
                id
                name
            }
        }
    }
`;

interface MyResourcesProps {
    className?: string;
}

function MyResources(props: MyResourcesProps) {
    const { className } = props;

    const [myResourcesList, setMyResourcesList] = useState<Resource[]>([]);
    const [groupsList, setGroupsList] = useState<Group[]>([]);
    const [countriesList, setCountriesList] = useState<Country[]>([]);

    const [resourceIdOnEdit, setResourceIdOnEdit] = useState<string | undefined>('');
    const [searchText, setSearchText] = useState<string | undefined>('');
    const [resourceHovered, setResourceHovered] = useState<string | undefined>('');

    useQuery(GET_GROUPS_LIST, {
        onCompleted: (data: GetGroupsListResponse) => {
            /**
             * un-categorized does not come from backend.
             * This sets uncategorized manually for select field.
             * Handle errors as well
             */
            setGroupsList(data.resourceGroupList.results);
        },
    });

    useQuery(GET_RESOURCES_LIST, {
        onCompleted: (data: GetResoucesListResponse) => {
            setMyResourcesList(data.resourceList.results);
        },
    });

    useQuery(GET_COUNTRIES_LIST, {
        onCompleted: (data) => {
            setCountriesList(data.countryList.results);
        },
    });

    const resetResourceOnEdit = useCallback(
        () => {
            setResourceIdOnEdit('');
        }, [],
    );

    const groupsWithUncategorized = useMemo(() => {
        const unCategorized: Group = {
            name: 'Uncategorized',
            id: '-1',
        };
        return [...groupsList, unCategorized];
    }, [groupsList]);

    const [
        resourceFormOpened,
        handleResourceFormOpen,
        handleResourceFormClose,
    ] = useBasicToggle(resetResourceOnEdit);

    const [
        groupFormOpened,
        handleGroupFormOpen,
        handleGroupFormClose,
    ] = useBasicToggle();

    const resetSearchText = useCallback(
        () => {
            setSearchText('');
        }, [],
    );

    const handleUpdateSearchText = setSearchText;

    const [
        searchFieldOpened,
        handleSearchFieldOpen,
        handleSearchFieldClose,
    ] = useBasicToggle(resetSearchText);

    const onAddNewGroup = useCallback(
        (newGroupItem) => {
            setGroupsList([...groupsList, newGroupItem]);
            handleGroupFormClose();
        }, [groupsList, handleGroupFormClose],
    );

    const onAddNewResource = useCallback(
        (newResourceItem) => {
            setMyResourcesList([...myResourcesList, newResourceItem]);
            handleResourceFormClose();
        }, [myResourcesList, handleResourceFormClose],
    );

    const onSetResourceIdOnEdit = useCallback(
        (resourceItemId) => {
            setResourceIdOnEdit(resourceItemId);
            handleResourceFormOpen();
        }, [setResourceIdOnEdit, handleResourceFormOpen],
    );

    // FIXME: pull new resource information inside the resource modal
    const resourceItemOnEdit = useMemo(
        () => {
            if (!resourceIdOnEdit) {
                return undefined;
            }
            return myResourcesList.find((res) => res.id === resourceIdOnEdit);
        }, [resourceIdOnEdit, myResourcesList],
    );

    const onUpdateResourceItem = useCallback(
        (resourceItem) => {
            const tempResourcesList = [...myResourcesList];
            const resourceIndex = tempResourcesList.findIndex((res) => res.id === resourceItem.id);
            if (resourceIndex < 0) {
                console.error('Can not update resource');
                return;
            }
            tempResourcesList[resourceIndex] = resourceItem;
            setMyResourcesList(tempResourcesList);

            handleResourceFormClose();
        }, [myResourcesList, handleResourceFormClose],
    );

    const onRemoveResource = useCallback(
        (resourceItemId) => {
            setMyResourcesList(myResourcesList.filter((res) => res.id !== resourceItemId));

            handleResourceFormClose();
        }, [myResourcesList, handleResourceFormClose],
    );

    const filteredMyResourcesList = useMemo(
        () => [...myResourcesList]
            .filter((res) => caseInsensitiveSubmatch(res.name, searchText))
            .sort((a, b) => compareStringSearch(a.name, b.name, searchText)),
        [myResourcesList, searchText],
    );

    const handleSetResourceHovered = setResourceHovered;

    const handleResetResourceHovered = useCallback(
        () => {
            setResourceHovered('');
        }, [],
    );

    return (
        <>
            <Container
                className={_cs(className, styles.myResources)}
                heading={searchFieldOpened ? (
                    <SearchResourceForm
                        searchText={searchText}
                        onSearchTextChange={handleUpdateSearchText}
                    />
                ) : (
                    'My Resources'
                )}
                headerActions={(
                    <>
                        {searchFieldOpened ? (
                            <QuickActionButton
                                onClick={handleSearchFieldClose}
                                name="closeSearchField"
                                className={styles.headerButtons}
                            >
                                <IoMdClose />
                            </QuickActionButton>
                        ) : (
                            <QuickActionButton
                                onClick={handleSearchFieldOpen}
                                name="search"
                                className={styles.headerButtons}
                            >
                                <FaSearch />
                            </QuickActionButton>
                        )}
                        <QuickActionButton
                            name="add"
                            className={styles.headerButtons}
                            onClick={handleResourceFormOpen}
                        >
                            <FaPlus />
                        </QuickActionButton>
                    </>
                )}
            >
                {filteredMyResourcesList.length > 0 ? (
                    <div className={styles.accordionContainer}>
                        <ResourcesAccordion
                            myResourcesList={filteredMyResourcesList}
                            onSetResourceIdOnEdit={onSetResourceIdOnEdit}
                            resourceHovered={resourceHovered}
                            onHandleSetResourceHovered={handleSetResourceHovered}
                            onHandleResetResourceHovered={handleResetResourceHovered}
                        />
                    </div>
                ) : (
                    <div className={styles.emptyResourceList}>
                        No resource found.
                    </div>
                )}

            </Container>
            {resourceFormOpened && (
                <ResourceForm
                    resourceFormOpened={resourceFormOpened}
                    onHandleResourceFormClose={handleResourceFormClose}
                    onHandleGroupFormOpen={handleGroupFormOpen}
                    groups={groupsWithUncategorized}
                    countries={countriesList}
                    onAddNewResource={onAddNewResource}
                    resourceItemOnEdit={resourceItemOnEdit}
                    onUpdateResourceItem={onUpdateResourceItem}
                    onRemoveResource={onRemoveResource}
                />
            )}
            {groupFormOpened && (
                <GroupForm
                    groupFormOpened={groupFormOpened}
                    onHandleGroupFormClose={handleGroupFormClose}
                    onAddNewGroup={onAddNewGroup}
                />
            )}
        </>
    );
}

export default MyResources;
