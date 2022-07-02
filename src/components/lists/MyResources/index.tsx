import React, { useCallback, useState, useMemo, useContext } from 'react';
import {
    IoMdClose,
    IoMdAdd,
    IoIosSearch,
} from 'react-icons/io';
import { gql, useQuery } from '@apollo/client';
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

import ResourceForm from './ResourceForm';
import ResourcesAccordion from './ResourcesAccordion';

import {
    ResourcesQuery,
    ResourcesQueryVariables,
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
        previousData,
        data: resources = previousData,
        refetch: refetchResource,
        // FIXME:
        // loading: resourcesLoading,
        // error: errorResourceLoading,
    } = useQuery<ResourcesQuery>(GET_RESOURCES_LIST, {
        variables: resourceVariables,
    });

    const onHandleRefetchResource = useCallback(
        () => {
            refetchResource(resourceVariables);
        },
        [
            refetchResource,
            resourceVariables,
        ],
    );

    const resourcesList = resources?.resourceList?.results;
    // const loading = groupsLoading || resourcesLoading;

    const [
        resourceFormOpened,
        editableResourceId,
        handleResourceFormOpen,
        handleResourceFormClose,
    ] = useModalState();

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
                        onRemoveResourceFromCache={onHandleRefetchResource}
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
                        id={editableResourceId}
                        handleRefetchResource={onHandleRefetchResource}
                        defaultCountryOption={defaultCountryOption}
                    />
                </Modal>
            )}
        </>
    );
}

export default MyResources;
