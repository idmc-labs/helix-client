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

import {
    Modal,
} from '@togglecorp/toggle-ui';

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

const GroupFormHeader = (
    <h2>Add Group</h2>
);

const AddResourceFormHeader = (
    <h2>Add Resource</h2>
);

const EditResourceFormHeader = (
    <h2>Edit Resource</h2>
);

// TODO typefix for cache
const handleAddGroupCache = (
    cache, data: { data: {createResourceGroup: { resourceGroup: Group }}},
) => {
    console.log('cache-', cache);
    const { data: { createResourceGroup: { resourceGroup } } } = data;

    const cacheGroups = cache.readQuery({
        query: GET_GROUPS_LIST,
    });
    const { resourceGroupList: { results } } = cacheGroups;

    const newResults = [...results, resourceGroup];

    cache.writeQuery({
        query: GET_GROUPS_LIST,
        data: {
            resourceGroupList: {
                __typename: 'ResourceGroupListType', // TODO figure out way for this
                results: newResults,
            },
        },
    });
};

function MyResources(props: MyResourcesProps) {
    const { className } = props;

    const [myResourcesList, setMyResourcesList] = useState<Resource[]>([]);
    // const [groupsList, setGroupsList] = useState<Group[]>([]);
    const [countriesList, setCountriesList] = useState<Country[]>([]);

    const [resourceIdOnEdit, setResourceIdOnEdit] = useState<string | undefined>('');
    const [searchText, setSearchText] = useState<string | undefined>('');
    const [resourceHovered, setResourceHovered] = useState<string | undefined>('');

    const {
        data: groups,
        refetch: refetchGroups,
        loading: groupsLoading,
    } = useQuery<GetGroupsListResponse>(GET_GROUPS_LIST);

    const groupsWithUncategorized = useMemo(() => {
        const unCategorized: Group = {
            name: 'Uncategorized',
            id: '-1',
        };
        const groupsList = groups?.resourceGroupList?.results ?? [];
        return [...groupsList, unCategorized];
    }, [groups]);

    const {
        data: resources,
        refetch: refetchResources,
        loading: resourcesLoading,
    } = useQuery<GetResoucesListResponse>(GET_RESOURCES_LIST);

    const resourcesList = resources?.resourceList?.results ?? [];

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
            // setGroupsList([...groupsList, newGroupItem]);
            handleGroupFormClose();
        }, [handleGroupFormClose],
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

    // const handleSetResourceHovered = setResourceHovered;

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
                            onHandleSetResourceHovered={setResourceHovered}
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
                <Modal
                    // FIXME: heading also support string
                    heading={resourceItemOnEdit ? EditResourceFormHeader : AddResourceFormHeader}
                    onClose={handleResourceFormClose}
                >
                    <ResourceForm
                        onHandleResourceFormClose={handleResourceFormClose}
                        onHandleGroupFormOpen={handleGroupFormOpen}
                        groups={groupsWithUncategorized}
                        onAddNewResource={onAddNewResource}
                        resourceItemOnEdit={resourceItemOnEdit}
                        onUpdateResourceItem={onUpdateResourceItem}
                        onRemoveResource={onRemoveResource}
                    />
                </Modal>
            )}
            {groupFormOpened && (
                <Modal
                // FIXME: heading also support string
                    heading={GroupFormHeader}
                    onClose={handleGroupFormClose}
                >
                    <GroupForm
                        onHandleGroupFormClose={handleGroupFormClose}
                        onAddNewGroup={onAddNewGroup}
                        onAddGroupCache={handleAddGroupCache}
                    />
                </Modal>
            )}
        </>
    );
}

export default MyResources;
