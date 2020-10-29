import React, { useCallback, useMemo } from 'react';
import {
    TextInput,
    SelectInput,
    Button,
    MultiSelectInput,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import { FaPlus } from 'react-icons/fa';
import {
    gql,
    useMutation,
    useQuery,
    ApolloCache,
    FetchResult,
} from '@apollo/client';

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

const schema: Schema<PartialForm<ResourceFormValues>> = {
    fields: () => ({
        name: [requiredStringCondition, lengthGreaterThanCondition(3)],
        url: [requiredStringCondition, urlCondition],
        group: [],
        id: [],
        countries: [],
    }),
};

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

const CREATE_RESOURCE = gql`
    mutation CreateResource($input: ResourceCreateInputType!) {
        createResource(resource: $input) {
            ok
            errors {
                field
                messages
            }
            resource {
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
        updateResource(resource: $input) {
            ok
            errors {
                field
                messages
            }
            resource {
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

const DELETE_RESOURCE = gql`
    mutation DeleteResource($id: ID!) {
        deleteResource(id: $id) {
            errors {
                field
                messages
            }
            ok
            resource {
                id
            }
        }
    }
`;

const GET_RESOURCE_BY_ID = gql`
    query GetResourceById($id: ID!) {
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

interface DeleteResourceVariables {
    id: string | undefined,
}

interface DeleteResourceResponse {
    deleteResource:
    {
        ok: boolean,
        errors?: {
            field: string,
            message: string,
        }[],
        resource: {
            id: string,
        },
    }
}

interface GetResourceByIdResponse {
    resource: Resource,
}

interface ResourceFormProps {
    onHandleResourceFormClose: () => void,
    onHandleGroupFormOpen: () => void,
    groups: Group[] | undefined,
    id: string | undefined,
    onAddResourceCache: (
        cache: ApolloCache<{
            createResource: {
                resource: Resource;
            };
        }>,
        data: FetchResult<{
            createResource: {
                resource: Resource;
            };
        }>
    ) => void;
    onDeleteResourceCache: (
        cache: ApolloCache<DeleteResourceResponse>,
        data: FetchResult<{
            deleteResource: {
                resource: {
                    id: Resource['id'];
                };
            };
        }>
    ) => void;
    onUpdateResourceCache: (
        cache: ApolloCache<{
            updateResource: {
                resource: Resource;
            };
        }>,
        data: FetchResult<{
            updateResource: {
                resource: Resource;
            };
        }>
    ) => void;
}

interface ResourceVariables {
    id: string | undefined;
}

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
const defaultFormValues: PartialForm<WithId<ResourceFormValues>> = {};

function ResourceForm(props: ResourceFormProps) {
    const {
        onHandleResourceFormClose,
        onHandleGroupFormOpen,
        groups,
        id,
        onAddResourceCache,
        onDeleteResourceCache,
        onUpdateResourceCache,
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
                    group: resource.group?.id ?? '-1', // To show uncategorized selected in the edit form
                });
            },
        },
    );

    const {
        data: countriesOptions,
        loading: countriesLoading,
        error: countriesDataError,
    } = useQuery<GetCountriesListResponse>(GET_COUNTRIES_LIST);

    const countries = countriesOptions?.countryList?.results ?? [];

    const [createResource,
        {
            loading: createResourceLoading,
        },
    ] = useMutation<CreateResourceResponse, CreateUpdateResourceVariables>(
        CREATE_RESOURCE,
        {
            update: onAddResourceCache,
            onCompleted: (data: CreateResourceResponse) => {
                if (data.createResource.errors) {
                    const createResourceError = transformToFormError(data.createResource.errors);
                    onErrorSet(createResourceError);
                } else {
                    onHandleResourceFormClose();
                }
            },
            onError: (createResourceError) => {
                onErrorSet({
                    $internal: createResourceError.message,
                });
            },
        },
    );

    const [updateResource,
        {
            loading: updateResourceLoading,
        },
    ] = useMutation<UpdateResourceResponse, CreateUpdateResourceVariables>(
        UPDATE_RESOURCE,
        {
            update: onUpdateResourceCache,
            onCompleted: (data: UpdateResourceResponse) => {
                if (data.updateResource.errors) {
                    const updateResourceError = transformToFormError(data.updateResource.errors);
                    onErrorSet(updateResourceError);
                } else {
                    onHandleResourceFormClose();
                }
            },
            onError: (updateResourceError) => {
                console.warn(updateResourceError);
            },
        },
    );

    const [deleteResource,
        {
            loading: deleteResourceLoading,
        },
    ] = useMutation<DeleteResourceResponse, DeleteResourceVariables>(
        DELETE_RESOURCE,
        {
            update: onDeleteResourceCache,
            onCompleted: (response: DeleteResourceResponse) => {
                // FIXME: delete should not have this error
                if (response.deleteResource.errors) {
                    const deleteResError = transformToFormError(response.deleteResource.errors);
                    onErrorSet(deleteResError);
                } else {
                    onHandleResourceFormClose();
                }
            },
            // FIXME: handle error
        },
    );

    const handleSubmit = useCallback((finalValue: PartialForm<ResourceFormValues>) => {
        const completeValue = finalValue as ResourceFormValues;
        // FIXME: should instead use options without option with '-1' key
        // and make group optional
        if (completeValue.id) {
            updateResource({
                variables: {
                    input: {
                        ...completeValue,
                        group: completeValue?.group !== '-1' ? completeValue.group : '',
                    },
                },
            });
        } else {
            createResource({
                variables: {
                    input: {
                        ...completeValue,
                        group: completeValue?.group !== '-1' ? completeValue.group : '',
                    },
                },
            });
        }
    }, [updateResource, createResource]);

    const onDeleteResource = useCallback(() => {
        if (!id) {
            return;
        }
        deleteResource({
            variables: { id },
        });
    }, [deleteResource, id]);

    const loading = createResourceLoading || updateResourceLoading
        || deleteResourceLoading || resourceDataLoading || countriesLoading;

    const errored = !!resourceDataError || !!countriesDataError;

    const disabled = loading || errored;

    return (
        <form onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}>
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
                        name="add"
                        className={styles.headerButtons}
                        onClick={onHandleGroupFormOpen}
                        transparent
                    >
                        <FaPlus />
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

            {/* TODO: Show loader  */}

            {
                loading && <Loading message="loading..." />
            }

            <div className={styles.resourceFormButtons}>
                {!!id && (
                    <ConfirmButton
                        name="delete-resource"
                        onConfirm={onDeleteResource}
                        confirmationHeader="Confirm Delete"
                        confirmationMessage="Are you sure you want to delete?"
                        disabled={disabled}
                    >
                        Delete
                    </ConfirmButton>
                )}
                <div
                    className={styles.buttonGroup}
                >
                    <Button
                        name={undefined}
                        variant="primary"
                        type="submit"
                        className={styles.button}
                        disabled={disabled}
                    >
                        {id ? 'Update ' : 'Create '}
                    </Button>
                    <Button
                        name={undefined}
                        onClick={onHandleResourceFormClose}
                        className={styles.button}
                        disabled={disabled}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </form>
    );
}

export default ResourceForm;
