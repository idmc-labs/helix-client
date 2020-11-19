import React, { useCallback, useMemo } from 'react';
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
    MutationUpdaterFn,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';

import { removeNull } from '#utils/schema';
import { PartialForm, PurgeNull } from '#types';
import useForm, { createSubmitHandler } from '#utils/form';
import type { Schema } from '#utils/schema';
import {
    requiredCondition,
    requiredStringCondition,
    lengthGreaterThanCondition,
    urlCondition,
    idCondition,
} from '#utils/validation';
import { transformToFormError } from '#utils/errorTransform';

import Loading from '#components/Loading';
import NonFieldError from '#components/NonFieldError';
import FormActions from '#components/FormActions';

import styles from './styles.css';

import {
    CountriesForResourceQuery,
    CreateResourceMutation,
    CreateResourceMutationVariables,
    UpdateResourceMutation,
    UpdateResourceMutationVariables,
    ResourceQuery,
    ResourceQueryVariables,
    ResourceGroupType,
    CountryType,
} from '#generated/types';

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
                createdAt
                modifiedAt
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
                createdAt
                modifiedAt
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
`;

const getKeySelectorValue = (data: Group | Country) => data.id;

const getLabelSelectorValue = (data: Group | Country) => data.name;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type ResourceFormFields = CreateResourceMutationVariables['input'];
type FormType = PurgeNull<PartialForm<WithId<ResourceFormFields>>>;

type Group = Pick<ResourceGroupType, 'id' | 'name'>;
type Country = Pick<CountryType, 'id' | 'name'>;

const schema: Schema<FormType> = {
    fields: () => ({
        id: [idCondition],
        name: [requiredStringCondition, lengthGreaterThanCondition(3)],
        url: [requiredStringCondition, urlCondition],
        group: [],
        countries: [requiredCondition],
    }),
};

interface ResourceFormProps {
    onResourceFormClose: () => void,
    onGroupFormOpen: () => void,
    groups: Group[] | undefined | null,
    id: string | undefined,
    country?: string;
    onAddNewResourceInCache: MutationUpdaterFn<CreateResourceMutation>;
}

function ResourceForm(props: ResourceFormProps) {
    const {
        onResourceFormClose,
        onGroupFormOpen,
        groups,
        id,
        onAddNewResourceInCache,
        country,
    } = props;

    const defaultFormValues: PartialForm<FormType> = useMemo(
        () => ({ countries: country ? [country] : undefined }),
        [country],
    );

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
    } = useQuery<ResourceQuery, ResourceQueryVariables>(
        GET_RESOURCE_BY_ID,
        {
            skip: !id,
            variables: id ? { id } : undefined,
            onCompleted: (response) => {
                const { resource } = response;
                if (!resource) {
                    return;
                }
                onValueSet(removeNull({
                    ...resource,
                    countries: resource.countries?.map((c) => c.id),
                    group: resource.group?.id,
                }));
            },
        },
    );

    const {
        data: countriesData,
        loading: countriesLoading,
        error: countriesDataError,
    } = useQuery<CountriesForResourceQuery>(GET_COUNTRIES_LIST);

    const countries = countriesData?.countryList?.results;

    const [
        createResource,
        { loading: createResourceLoading },
    ] = useMutation<CreateResourceMutation, CreateResourceMutationVariables>(
        CREATE_RESOURCE,
        {
            update: onAddNewResourceInCache,
            onCompleted: (response) => {
                const { createResource: createResourceRes } = response;
                if (!createResourceRes) {
                    return;
                }
                const { errors, result } = createResourceRes;
                if (errors) {
                    const createResourceError = transformToFormError(removeNull(errors));
                    onErrorSet(createResourceError);
                }
                if (result) {
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
    ] = useMutation<UpdateResourceMutation, UpdateResourceMutationVariables>(
        UPDATE_RESOURCE,
        {
            onCompleted: (response) => {
                const { updateResource: updateResourceRes } = response;
                if (!updateResourceRes) {
                    return;
                }
                const { errors, result } = updateResourceRes;
                if (errors) {
                    const updateResourceError = transformToFormError(removeNull(errors));
                    onErrorSet(updateResourceError);
                }
                if (result) {
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

    const handleSubmit = useCallback((finalValue: FormType) => {
        if (finalValue.id) {
            updateResource({
                variables: {
                    input: finalValue as WithId<ResourceFormFields>,
                },
            });
        } else {
            createResource({
                variables: {
                    input: finalValue as ResourceFormFields,
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
        <form
            className={styles.resourceForm}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading className={styles.loading} />}
            {error?.$internal && (
                <NonFieldError>
                    {error?.$internal}
                </NonFieldError>
            )}
            <TextInput
                className={styles.input}
                label="Name *"
                name="name"
                value={value.name}
                onChange={onValueChange}
                error={error?.fields?.name}
                disabled={disabled}
            />

            <TextInput
                className={styles.input}
                label="URL *"
                name="url"
                value={value.url}
                onChange={onValueChange}
                error={error?.fields?.url}
                disabled={disabled}
            />
            <SelectInput
                className={styles.input}
                label="Groups"
                actions={(
                    <Button
                        name={undefined}
                        onClick={onGroupFormOpen}
                        transparent
                        compact
                        title="Add new group"
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
                className={styles.input}
                label="Countries *"
                name="countries"
                options={countries}
                value={value.countries}
                onChange={onValueChange}
                keySelector={getKeySelectorValue}
                labelSelector={getLabelSelectorValue}
                error={error?.fields?.countries}
                disabled={disabled}
                readOnly={!!country}
            />
            <FormActions className={styles.actions}>
                <Button
                    name={undefined}
                    onClick={onResourceFormClose}
                    disabled={disabled}
                >
                    Cancel
                </Button>
                <Button
                    name={undefined}
                    variant="primary"
                    type="submit"
                    disabled={disabled}
                >
                    Submit
                </Button>
            </FormActions>
        </form>
    );
}

export default ResourceForm;
