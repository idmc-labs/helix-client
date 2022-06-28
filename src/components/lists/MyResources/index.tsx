import React, { useCallback, useState, useMemo, useContext } from 'react';
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

import Message from '#components/Message';
import Container from '#components/Container';
import QuickActionButton from '#components/QuickActionButton';
import { CountryOption } from '#components/selections/CountryMultiSelectInput';

import useBasicToggle from '#hooks/toggleBasicState';
import DomainContext from '#components/DomainContext';

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
import useModalState from '#hooks/useModalState';

const GET_RESOURCES_LIST = gql`
    query Resources($countries: [String!]) {
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
    defaultCountryOption?: CountryOption | undefined | null;
}

function MyResources(props: MyResourcesProps) {
    const {
        className,
        defaultCountryOption,
    } = props;

    const [searchText, setSearchText] = useState<string | undefined>('');

    const {
        data: groups,
        // loading: groupsLoading,
        // error: errorGroupsLoading,
    } = useQuery<GroupsForResourceQuery>(GET_GROUPS_LIST);

    const resourceVariables = useMemo(
        (): ResourcesQueryVariables => {
            if (!defaultCountryOption) {
                return { countries: undefined };
            }
            const countryId = defaultCountryOption.id;
            return { countries: [countryId] };
        }, [defaultCountryOption],
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

    const [
        resourceFormOpened,
        editableResourceId,
        handleResourceFormOpen,
        handleResourceFormClose,
    ] = useModalState();

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

    const { user } = useContext(DomainContext);
    const addResourcePermission = user?.permissions?.resource?.add;
    return (
        <>
            <Container
                className={_cs(className, styles.myResources)}
                contentClassName={styles.content}
                heading="My Resources"
                headerActions={(
                    <>
                        {!searchFieldOpened && (
                            <QuickActionButton
                                onClick={handleSearchFieldOpen}
                                name={undefined}
                                title="Search"
                            >
                                <IoIosSearch />
                            </QuickActionButton>
                        )}
                        {addResourcePermission && (
                            <QuickActionButton
                                name={undefined}
                                onClick={handleResourceFormOpen}
                                title="Add Resource"
                            >
                                <IoMdAdd />
                            </QuickActionButton>
                        )}
                    </>
                )}
                description={searchFieldOpened && (
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
                                compact
                            >
                                <IoMdClose />
                            </Button>
                        )}
                    />
                )}
            >
                {filteredMyResourcesList.length > 0 ? (
                    <ResourcesAccordion
                        myResourcesList={filteredMyResourcesList}
                        onSetResourceIdOnEdit={handleResourceFormOpen}
                        onRemoveResourceFromCache={handleRemoveResourceFromCache}
                    />
                ) : (
                    <Message
                        message="No resources found."
                    />
                )}

            </Container>
            {resourceFormOpened && (
                <Modal
                    heading={editableResourceId ? 'Edit Resource' : 'Add Resource'}
                    onClose={handleResourceFormClose}
                    size="medium"
                    freeHeight
                >
                    <ResourceForm
                        onResourceFormClose={handleResourceFormClose}
                        onGroupFormOpen={handleGroupFormOpen}
                        groups={groupsList}
                        id={editableResourceId}
                        onAddNewResourceInCache={handleAddNewResourceInCache}
                        defaultCountryOption={defaultCountryOption}
                    />
                </Modal>
            )}
            {groupFormOpened && (
                <Modal
                    heading="Add Group"
                    onClose={handleGroupFormClose}
                    size="small"
                    freeHeight
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
