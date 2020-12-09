import React, { useCallback, useState, useMemo } from 'react';
import produce from 'immer';
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
import Loading from '#components/Loading';
import { CountryOption } from '#components/CountryMultiSelectInput';

import useBasicToggle from '#hooks/toggleBasicState';

import GroupForm from './GroupForm';
import ResourceForm from './ResourceForm';
import ResourcesAccordion from './ResourcesAccordion';

import {
    DeleteResourceMutation,
    GroupsForResourceQuery,
    ResourcesQuery,
    ResourcesQueryVariables,
    CreateResourceMutation,
    CreateResourceGroupMutation,
} from '#generated/types';

import styles from './styles.css';

const GET_RESOURCES_LIST = gql`
    query Resources($countries: [String]) {
        resourceList(countries: $countries) {
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

interface MyResourcesProps {
    className?: string;
    country?: string;
    defaultCountry?: CountryOption[] | undefined | null;
}

function MyResources(props: MyResourcesProps) {
    const {
        className,
        country,
        defaultCountry,
    } = props;

    const [resourceIdOnEdit, setResourceIdOnEdit] = useState<string | undefined>('');
    const [searchText, setSearchText] = useState<string | undefined>('');

    const {
        data: groups,
        // loading: groupsLoading,
        // error: errorGroupsLoading,
    } = useQuery<GroupsForResourceQuery>(GET_GROUPS_LIST);

    const resourceVariables = useMemo(
        (): ResourcesQueryVariables => ({
            countries: country ? [country] : undefined,
        }),
        [country],
    );

    const {
        data: resources,
        // loading: resourcesLoading,
        // error: errorResourceLoading,
    } = useQuery<ResourcesQuery>(GET_RESOURCES_LIST, {
        variables: resourceVariables,
    });

    const handleAddNewGroupInCache: MutationUpdaterFn<
        CreateResourceGroupMutation
    > = useCallback(
        (cache, data) => {
            const resourceGroup = data?.data?.createResourceGroup?.result;
            if (!resourceGroup) {
                return;
            }

            const cacheData = cache.readQuery<GroupsForResourceQuery>({
                query: GET_GROUPS_LIST,
            });

            const updatedValue = produce(cacheData, (safeCacheData) => {
                if (!safeCacheData?.resourceGroupList?.results) {
                    return;
                }
                const { results } = safeCacheData.resourceGroupList;
                results.push(resourceGroup);
            });

            if (updatedValue === cacheData) {
                return;
            }

            cache.writeQuery({
                query: GET_GROUPS_LIST,
                data: updatedValue,
            });
        },
        [],
    );

    const handleAddNewResourceInCache: MutationUpdaterFn<
        CreateResourceMutation
    > = useCallback(
        (cache, data) => {
            const resource = data?.data?.createResource?.result;
            if (!resource) {
                return;
            }

            const cacheData = cache.readQuery<ResourcesQuery>({
                query: GET_RESOURCES_LIST,
                variables: resourceVariables,
            });

            const updatedValue = produce(cacheData, (safeCacheData) => {
                if (!safeCacheData?.resourceList?.results) {
                    return;
                }
                const { results } = safeCacheData.resourceList;
                results.push(resource);
            });

            if (updatedValue === cacheData) {
                return;
            }

            cache.writeQuery({
                query: GET_RESOURCES_LIST,
                data: updatedValue,
            });
        },
        [resourceVariables],
    );

    const handleRemoveResourceFromCache: MutationUpdaterFn<
        DeleteResourceMutation
    > = useCallback(
        (cache, data) => {
            const resource = data?.data?.deleteResource?.result;
            if (!resource) {
                return;
            }

            const cacheData = cache.readQuery<ResourcesQuery>({
                query: GET_RESOURCES_LIST,
                variables: resourceVariables,
            });

            const updatedValue = produce(cacheData, (safeCacheData) => {
                if (!safeCacheData?.resourceList?.results) {
                    return;
                }
                const { results } = safeCacheData.resourceList;
                const resourceIndex = results.findIndex((res) => res.id === resource.id);
                if (resourceIndex !== -1) {
                    results.splice(resourceIndex, 1);
                }
            });

            if (updatedValue === cacheData) {
                return;
            }

            cache.writeQuery({
                query: GET_RESOURCES_LIST,
                data: updatedValue,
            });
        },
        [resourceVariables],
    );

    const groupsList = groups?.resourceGroupList?.results;
    const resourcesList = resources?.resourceList?.results;
    // const loading = groupsLoading || resourcesLoading;

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
                        country={country}
                        defaultCountry={defaultCountry}
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
