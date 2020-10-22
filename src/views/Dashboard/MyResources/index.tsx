import React, { useCallback, useState, useMemo } from 'react';
import { IoMdClose } from 'react-icons/io';
import {
    FaPlus,
    FaSearch,
} from 'react-icons/fa';
import { gql, MutationUpdaterFn, useQuery } from '@apollo/client';
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

import { Resource, Group } from './myResources.interface';

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

interface MyResourcesProps {
    className?: string;
}

const handleAddNewGroupInCache: MutationUpdaterFn<{
    createResourceGroup: { resourceGroup: Group }
}> = (cache, data) => {
    if (!data) {
        return;
    }
    const resourceGroup = data.data?.createResourceGroup.resourceGroup;
    if (!resourceGroup) {
        return;
    }

    const cacheGroups = cache.readQuery<GetGroupsListResponse>({
        query: GET_GROUPS_LIST,
    });
    const results = cacheGroups?.resourceGroupList.results ?? [];
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

const handleAddNewResourceInCache: MutationUpdaterFn<{
    createResource: { resource: Resource }
}> = (cache, data) => {
    if (!data) {
        return;
    }
    const resource = data.data?.createResource.resource;
    if (!resource) {
        return;
    }

    const cacheResources = cache.readQuery<GetResoucesListResponse>({
        query: GET_RESOURCES_LIST,
    });
    const results = cacheResources?.resourceList.results ?? [];

    const newResults = [...results, resource];

    cache.writeQuery({
        query: GET_RESOURCES_LIST,
        data: {
            resourceList: {
                __typename: 'ResourceListType', // TODO figure out way for this
                results: newResults,
            },
        },
    });
};

const handleUpdateResourceInCache: MutationUpdaterFn<{
    updateResource: { resource: Resource }
}> = (cache, data) => {
    if (!data) {
        return;
    }
    const resource = data.data?.updateResource.resource;
    if (!resource) {
        return;
    }

    const cacheResources = cache.readQuery<GetResoucesListResponse>({
        query: GET_RESOURCES_LIST,
    });
    const results = cacheResources?.resourceList.results ?? [];

    const resourceIndex = results.findIndex((res) => res.id === resource.id);

    if (resourceIndex < 0) {
        return;
    }

    const updatedResults = [...results];
    updatedResults.splice(resourceIndex, 1, resource);

    cache.writeQuery({
        query: GET_RESOURCES_LIST,
        data: {
            resourceList: {
                __typename: 'ResourceListType', // TODO figure out way for this
                results: updatedResults,
            },
        },
    });
};

function MyResources(props: MyResourcesProps) {
    const { className } = props;

    const [resourceIdOnEdit, setResourceIdOnEdit] = useState<string | undefined>('');
    const [searchText, setSearchText] = useState<string | undefined>('');

    const {
        data: groups,
        loading: groupsLoading,
        error: errorGroupsLoading,
    } = useQuery<GetGroupsListResponse>(GET_GROUPS_LIST);

    const {
        data: resources,
        loading: resourcesLoading,
        error: errorResourceLoading,
    } = useQuery<GetResoucesListResponse>(GET_RESOURCES_LIST);

    const groupsList = useMemo(() => groups?.resourceGroupList?.results ?? [], [groups]);
    const resourcesList = useMemo(() => resources?.resourceList?.results ?? [], [resources]);
    const loading = groupsLoading || resourcesLoading;

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

    const onHandleResourceFormClose = useCallback(() => {
        handleResourceFormClose();
        setResourceIdOnEdit('');
    }, []);

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

    const onSetResourceIdOnEdit = useCallback(
        (resourceItemId) => {
            setResourceIdOnEdit(resourceItemId);
            handleResourceFormOpen();
        }, [setResourceIdOnEdit, handleResourceFormOpen],
    );

    const filteredMyResourcesList = useMemo(
        () => [...resourcesList]
            .filter((res) => caseInsensitiveSubmatch(res.name, searchText))
            .sort((a, b) => compareStringSearch(a.name, b.name, searchText)),
        [resourcesList, searchText],
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
                    heading={resourceIdOnEdit ? 'Edit Resource' : 'Add Resource'}
                    onClose={handleResourceFormClose}
                >
                    <ResourceForm
                        onHandleResourceFormClose={onHandleResourceFormClose}
                        onHandleGroupFormOpen={handleGroupFormOpen}
                        groups={groupsList}
                        id={resourceIdOnEdit}
                        onAddNewResourceInCache={handleAddNewResourceInCache}
                        onUpdateResourceInCache={handleUpdateResourceInCache}
                    />
                </Modal>
            )}
            {groupFormOpened && (
                <Modal
                    heading="Add Group"
                    onClose={handleGroupFormClose}
                >
                    <GroupForm
                        onHandleGroupFormClose={handleGroupFormClose}
                        onAddNewGroupInCache={handleAddNewGroupInCache}
                    />
                </Modal>
            )}
        </>
    );
}

export default MyResources;
