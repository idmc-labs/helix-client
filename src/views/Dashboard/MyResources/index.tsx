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

type CacheGroups = GetGroupsListResponse | null | undefined;
type CacheResources = GetResoucesListResponse | null | undefined;

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

const GroupFormHeader = (
    <h2>Add Group</h2>
);

const AddResourceFormHeader = (
    <h2>Add Resource</h2>
);

const EditResourceFormHeader = (
    <h2>Edit Resource</h2>
);

const handleAddGroupCache: MutationUpdaterFn<{
    createResourceGroup: { resourceGroup: Group }
}> = (cache, data) => {
    if (!data) {
        return;
    }
    const resourceGroup = data.data?.createResourceGroup.resourceGroup;

    const cacheGroups: CacheGroups = cache.readQuery({
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

const handleAddResourceCache: MutationUpdaterFn<{
    createResource: { resource: Resource }
}> = (cache, data) => {
    if (!data) {
        return;
    }
    const resource = data.data?.createResource.resource;

    const cacheResources: CacheResources = cache.readQuery({
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

const handleUpdateResourceCache: MutationUpdaterFn<{
    updateResource: { resource: Resource }
}> = (cache, data) => {
    if (!data) {
        return;
    }
    const resource = data.data?.updateResource.resource;

    if (!resource) {
        return;
    }

    const cacheResources: CacheResources = cache.readQuery({
        query: GET_RESOURCES_LIST,
    });
    const results = cacheResources?.resourceList.results ?? [];

    const updatedResults = [...results].map((res) => {
        if (res.id === resource.id) {
            return resource;
        }
        return res;
    });
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

const handleDeleteResourceCache: MutationUpdaterFn<{
    deleteResource: { resource: { id: Resource['id']} }
}> = (cache, data) => {
    const resId = data.data?.deleteResource.resource.id;

    const cacheResources: CacheResources = cache.readQuery({
        query: GET_RESOURCES_LIST,
    });
    const results = cacheResources?.resourceList.results ?? [];

    const newResults = [...results].filter((res: { id: string; }) => res.id !== resId);
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

function MyResources(props: MyResourcesProps) {
    const { className } = props;

    const [resourceIdOnEdit, setResourceIdOnEdit] = useState<string | undefined>('');
    const [searchText, setSearchText] = useState<string | undefined>('');
    const [resourceHovered, setResourceHovered] = useState<string | undefined>('');

    const {
        data: groups,
        loading: groupsLoading,
        error: errorGroupsLoading,
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
        loading: resourcesLoading,
        error: errorResourceLoading,
    } = useQuery<GetResoucesListResponse>(GET_RESOURCES_LIST);

    const resourcesList = resources?.resourceList?.results ?? [];

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
                    heading={resourceIdOnEdit ? EditResourceFormHeader : AddResourceFormHeader}
                    onClose={handleResourceFormClose}
                >
                    <ResourceForm
                        onHandleResourceFormClose={onHandleResourceFormClose}
                        onHandleGroupFormOpen={handleGroupFormOpen}
                        groups={groupsWithUncategorized}
                        id={resourceIdOnEdit}
                        onAddResourceCache={handleAddResourceCache}
                        onDeleteResourceCache={handleDeleteResourceCache}
                        onUpdateResourceCache={handleUpdateResourceCache}
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
                        onAddGroupCache={handleAddGroupCache}
                    />
                </Modal>
            )}
        </>
    );
}

export default MyResources;
