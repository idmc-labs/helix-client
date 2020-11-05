import React, { useCallback } from 'react';
import {
    TextInput,
    SelectInput,
    Button,
    MultiSelectInput,
} from '@togglecorp/toggle-ui';
import { IoMdAdd } from 'react-icons/io';
import {
    gql,
    useMutation,
    useQuery,
    ApolloCache,
    FetchResult,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';

import { PartialForm } from '#types';
import useForm, { createSubmitHandler } from '#utils/form';
import type { Schema } from '#utils/schema';
import {
    requiredStringCondition,
    lengthGreaterThanCondition,
    urlCondition,
} from '#utils/validation';
import { transformToFormError } from '#utils/errorTransform';

import Loading from '#components/Loading';

import { Resource, Group, Country } from '../myResources.interface';

import styles from './styles.css';

interface ResourceFormValues {
    name: string,
    url: string,
    group?: string,
    countries: string[],
    id?: string,
}

interface CreateUpdateResourceVariables {
    input: {
        name: string,
        url: string,
        group?: string,
        countries: string[],
        id?: string,
    };
}

interface CreateUpdateResourceResponse {
    ok: boolean,
    errors?: {
        field: string,
        message: string,
    }[],
    resource: {
        id: string,
        name: string,
        url: string,
        group: {
            id: string,
            name: string,
        },
        countries: {
            id: string,
            name: string,
        }[],
        lastAccessedOn?: string,
    },
}

interface GetCountriesListResponse {
    countryList: {
        results: Country[],
    };
}

interface CreateResourceResponse {
    createResource: CreateUpdateResourceResponse,
}

interface UpdateResourceResponse {
    updateResource: CreateUpdateResourceResponse,
}

interface GetResourceByIdResponse {
    resource: Resource,
}

interface CreateResourceCache {
    createResource: {
        resource: Resource;
    }
}

interface UpdateResourceCache {
    updateResource: {
        resource: Resource;
    }
}

interface ResourceVariables {
    id: string | undefined;
}
const GET_COUNTRIES_LIST = gql`
    query CountriesForResource {
        countryList {
            results {
                id
                name
            }
        }
    }
`;

const CREATE_RESOURCE = gql`
    mutation CreateResource($input: ResourceCreateInputType!) {
        createResource(data: $input) {
            ok
            errors {
                field
                messages
            }
            result {
                countries {
                    id
                    name
                }
                id
                lastAccessedOn
                name
                url
                group {
                    id
                    name
                }
            }
        }
    }
`;

const UPDATE_RESOURCE = gql`
    mutation UpdateResource($input: ResourceUpdateInputType!) {
        updateResource(data: $input) {
            ok
            errors {
                field
                messages
            }
            result {
                id
                name
                url
                lastAccessedOn
                group {
                    id
                    name
                }
                countries {
                    id
                    name
                }
            }
        }
    }
`;

const GET_RESOURCE_BY_ID = gql`
    query Resource($id: ID!) {
        resource(id: $id) {
            id
            name
            url
            group {
                id
                name
            }
            countries {
                id
            }
        }
    }
`;

const getKeySelectorValue = (data: Group | Country) => data.id;

const getLabelSelectorValue = (data: Group | Country) => data.name;

const schema: Schema<PartialForm<ResourceFormValues>> = {
    fields: () => ({
        name: [requiredStringCondition, lengthGreaterThanCondition(3)],
        url: [requiredStringCondition, urlCondition],
        group: [],
        id: [],
        countries: [],
    }),
};

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
const defaultFormValues: PartialForm<WithId<ResourceFormValues>> = {};

interface ResourceFormProps {
    onResourceFormClose: () => void,
    onGroupFormOpen: () => void,
    groups: Group[] | undefined,
    id: string | undefined,
    onAddNewResourceInCache: (
        cache: ApolloCache<CreateResourceCache>,
        data: FetchResult<CreateResourceCache>
    ) => void;
    onUpdateResourceInCache: (
        cache: ApolloCache<UpdateResourceCache>,
        data: FetchResult<UpdateResourceCache>
    ) => void;
}

function ResourceForm(props: ResourceFormProps) {
    const {
        onResourceFormClose,
        onGroupFormOpen,
        groups,
        id,
        onAddNewResourceInCache,
        onUpdateResourceInCache,
    } = props;

    const {
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
        onValueSet,
    } = useForm(defaultFormValues, schema);

    const {
        loading: resourceDataLoading,
        error: resourceDataError,
    } = useQuery<GetResourceByIdResponse, ResourceVariables>(
        GET_RESOURCE_BY_ID,
        {
            skip: !id,
            variables: { id },
            onCompleted: (response) => {
                const { resource } = response;
                onValueSet({
                    ...resource,
                    countries: resource.countries?.map((c) => c.id),
                    group: resource.group?.id,
                });
            },
        },
    );

    const {
        data: countriesData,
        loading: countriesLoading,
        error: countriesDataError,
    } = useQuery<GetCountriesListResponse>(GET_COUNTRIES_LIST);

    const countries = countriesData?.countryList?.results;

    const [
        createResource,
        { loading: createResourceLoading },
    ] = useMutation<CreateResourceResponse, CreateUpdateResourceVariables>(
        CREATE_RESOURCE,
        {
            update: onAddNewResourceInCache,
            onCompleted: (data: CreateResourceResponse) => {
                if (data.createResource.errors) {
                    const createResourceError = transformToFormError(data.createResource.errors);
                    onErrorSet(createResourceError);
                } else {
                    onResourceFormClose();
                }
            },
            onError: (createResourceError) => {
                onErrorSet({
                    $internal: createResourceError.message,
                });
            },
        },
    );

    const [
        updateResource,
        { loading: updateResourceLoading },
    ] = useMutation<UpdateResourceResponse, CreateUpdateResourceVariables>(
        UPDATE_RESOURCE,
        {
            update: onUpdateResourceInCache,
            onCompleted: (data: UpdateResourceResponse) => {
                if (data.updateResource.errors) {
                    const updateResourceError = transformToFormError(data.updateResource.errors);
                    onErrorSet(updateResourceError);
                } else {
                    onResourceFormClose();
                }
            },
            onError: (updateResourceError) => {
                onErrorSet({
                    $internal: updateResourceError.message,
                });
            },
        },
    );

    const handleSubmit = useCallback((finalValue: PartialForm<ResourceFormValues>) => {
        if (finalValue.id) {
            updateResource({
                variables: {
                    input: finalValue as ResourceFormValues,
                },
            });
        } else {
            createResource({
                variables: {
                    input: finalValue as ResourceFormValues,
                },
            });
        }
    }, [updateResource, createResource]);

    const loading = createResourceLoading
        || updateResourceLoading
        || resourceDataLoading
        || countriesLoading;

    const errored = !!resourceDataError || !!countriesDataError;

    const disabled = loading || errored;

    return (
        <form onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}>
            {loading && <Loading />}
            {error?.$internal && (
                <p>
                    {error?.$internal}
                </p>
            )}
            <TextInput
                label="Title"
                name="name"
                value={value.name}
                onChange={onValueChange}
                error={error?.fields?.name}
                disabled={disabled}
            />

            <TextInput
                label="URL"
                name="url"
                value={value.url}
                onChange={onValueChange}
                error={error?.fields?.url}
                disabled={disabled}
            />
            <SelectInput
                label="Groups"
                actions={(
                    <Button
                        name={undefined}
                        className={styles.headerButtons}
                        onClick={onGroupFormOpen}
                        transparent
                    >
                        <IoMdAdd />
                    </Button>
                )}
                name="group"
                options={groups}
                value={value.group}
                keySelector={getKeySelectorValue}
                labelSelector={getLabelSelectorValue}
                onChange={onValueChange}
                error={error?.fields?.group}
                disabled={disabled}
            />
            <MultiSelectInput
                label="Countries"
                name="countries"
                options={countries}
                value={value.countries}
                onChange={onValueChange}
                keySelector={getKeySelectorValue}
                labelSelector={getLabelSelectorValue}
                error={error?.fields?.countries}
                disabled={disabled}
            />
            <div className={_cs(styles.resourceFormButtons, styles.buttonGroup)}>
                <Button
                    name={undefined}
                    variant="primary"
                    type="submit"
                    className={styles.button}
                    disabled={disabled}
                >
                    Submit
                </Button>
                <Button
                    name={undefined}
                    onClick={onResourceFormClose}
                    className={styles.button}
                    disabled={disabled}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}

export default ResourceForm;
