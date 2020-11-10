import React, { useCallback, useState, useMemo } from 'react';
import {
    IoMdClose,
    IoMdAdd,
    IoIosSearch,
} from 'react-icons/io';
import { gql, MutationUpdaterFn, useQuery } from '@apollo/client';
import {
    _cs,
    caseInsensitiveSubmatch,
    compareStringSearch,
} from '@togglecorp/fujs';
import {
    Modal,
    TextInput,
    Button,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import QuickActionButton from '#components/QuickActionButton';
import useBasicToggle from '#hooks/toggleBasicState';

import Loading from '#components/Loading';

import GroupForm from './GroupForm';
import ResourceForm from './ResourceForm';
import ResourcesAccordion from './ResourcesAccordion';

import {
    DeleteResourceMutation,
    GroupsForResourceQuery,
    ResourcesQuery,
    UpdateResourceMutation,
    CreateResourceMutation,
    CreateResourceGroupMutation,
} from '#generated/types';

import styles from './styles.css';

const GET_RESOURCES_LIST = gql`
    query Resources {
        resourceList {
            results {
                id
                name
                url
                lastAccessedOn
                createdAt
                modifiedAt
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
    query GroupsForResource {
        resourceGroupList {
            results {
                name
                id
            }
        }
    }
`;

const handleAddNewGroupInCache: MutationUpdaterFn<CreateResourceGroupMutation> = (cache, data) => {
    if (!data) {
        return;
    }
    const resourceGroup = data?.data?.createResourceGroup?.result;
    if (!resourceGroup) {
        return;
    }

    // TODO: use immer
    const cacheGroups = cache.readQuery<GroupsForResourceQuery>({
        query: GET_GROUPS_LIST,
    });
    const results = cacheGroups?.resourceGroupList?.results ?? [];
    const newResults = [...results, resourceGroup];
    cache.writeQuery({
        query: GET_GROUPS_LIST,
        data: {
            resourceGroupList: {
                __typename: 'ResourceGroupListType',
                results: newResults,
            },
        },
    });
};

const handleAddNewResourceInCache: MutationUpdaterFn<CreateResourceMutation> = (cache, data) => {
    if (!data) {
        return;
    }

    const resource = data.data?.createResource?.result;
    if (!resource) {
        return;
    }

    // TODO: use immer
    const cacheResources = cache.readQuery<ResourcesQuery>({
        query: GET_RESOURCES_LIST,
    });
    const results = cacheResources?.resourceList?.results ?? [];
    const newResults = [...results, resource];
    cache.writeQuery({
        query: GET_RESOURCES_LIST,
        data: {
            resourceList: {
                __typename: 'ResourceListType',
                results: newResults,
            },
        },
    });
};

const handleUpdateResourceInCache: MutationUpdaterFn<UpdateResourceMutation> = (cache, data) => {
    if (!data) {
        return;
    }

    const resource = data.data?.updateResource?.result;
    if (!resource) {
        return;
    }

    // TODO: use immer
    const cacheResources = cache.readQuery<ResourcesQuery>({
        query: GET_RESOURCES_LIST,
    });
    if (!cacheResources) {
        return;
    }
    const results = cacheResources?.resourceList?.results;
    if (!results) {
        return;
    }

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
                __typename: 'ResourceListType',
                results: updatedResults,
            },
        },
    });
};

const handleRemoveResourceFromCache: MutationUpdaterFn<DeleteResourceMutation> = (cache, data) => {
    if (!data) {
        return;
    }

    const resId = data.data?.deleteResource?.result?.id;
    if (!resId) {
        return;
    }

    // TODO: use immer
    const cacheResources = cache.readQuery<ResourcesQuery>({
        query: GET_RESOURCES_LIST,
    });
    if (!cacheResources) {
        return;
    }
    const results = cacheResources?.resourceList?.results;
    if (!results) {
        return;
    }
    const newResults = results.filter((res) => res.id !== resId);
    cache.writeQuery({
        query: GET_RESOURCES_LIST,
        data: {
            resourceList: {
                __typename: 'ResourceListType',
                results: newResults,
            },
        },
    });
};

interface MyResourcesProps {
    className?: string;
}

function MyResources(props: MyResourcesProps) {
    const { className } = props;

    const [resourceIdOnEdit, setResourceIdOnEdit] = useState<string | undefined>('');
    const [searchText, setSearchText] = useState<string | undefined>('');

    const {
        data: groups,
        loading: groupsLoading,
        // error: errorGroupsLoading,
    } = useQuery<GroupsForResourceQuery>(GET_GROUPS_LIST);

    const {
        data: resources,
        loading: resourcesLoading,
        // error: errorResourceLoading,
    } = useQuery<ResourcesQuery>(GET_RESOURCES_LIST);

    const groupsList = groups?.resourceGroupList?.results;
    const resourcesList = resources?.resourceList?.results;
    const loading = groupsLoading || resourcesLoading;
    // const errored = !!errorGroupsLoading || !!errorResourceLoading;

    const resetResourceOnEdit = useCallback(
        () => {
            setResourceIdOnEdit('');
        },
        [],
    );

    const [
        resourceFormOpened,
        handleResourceFormOpen,
        handleResourceFormClose,
    ] = useBasicToggle(resetResourceOnEdit);

    const onHandleResourceFormClose = useCallback(() => {
        handleResourceFormClose();
        setResourceIdOnEdit('');
    }, [handleResourceFormClose]);

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
        () => {
            if (!resourcesList) {
                return [];
            }
            if (!searchText) {
                return resourcesList;
            }
            return resourcesList
                .filter((res) => caseInsensitiveSubmatch(res.name, searchText))
                .sort((a, b) => compareStringSearch(a.name, b.name, searchText));
        },
        [resourcesList, searchText],
    );

    return (
        <>
            <Container
                className={_cs(className, styles.myResources)}
                heading="My Resources"
                headerActions={(
                    <>
                        {!searchFieldOpened && (
                            <QuickActionButton
                                onClick={handleSearchFieldOpen}
                                name={undefined}
                            >
                                <IoIosSearch />
                            </QuickActionButton>
                        )}
                        <QuickActionButton
                            name={undefined}
                            onClick={handleResourceFormOpen}
                            title="Add"
                        >
                            <IoMdAdd />
                        </QuickActionButton>
                    </>
                )}
            >
                {loading && <Loading />}
                {searchFieldOpened && (
                    <TextInput
                        name="search"
                        className={styles.searchInput}
                        value={searchText}
                        onChange={setSearchText}
                        icons={<IoIosSearch />}
                        actions={(
                            <Button
                                className={styles.clearButton}
                                onClick={handleSearchFieldClose}
                                name={undefined}
                                transparent
                                title="Clear"
                                childrenClassName={styles.childContainer}
                            >
                                <IoMdClose />
                            </Button>
                        )}
                    />
                )}
                {filteredMyResourcesList.length > 0 ? (
                    <ResourcesAccordion
                        myResourcesList={filteredMyResourcesList}
                        onSetResourceIdOnEdit={onSetResourceIdOnEdit}
                        onRemoveResourceFromCache={handleRemoveResourceFromCache}
                    />
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
                        onResourceFormClose={onHandleResourceFormClose}
                        onGroupFormOpen={handleGroupFormOpen}
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
                        onGroupFormClose={handleGroupFormClose}
                        onAddNewGroupInCache={handleAddNewGroupInCache}
                    />
                </Modal>
            )}
        </>
    );
}

export default MyResources;
