import React, { useState, useCallback, useMemo, useContext } from 'react';
import {
    TextInput,
    SelectInput,
    Button,
} from '@togglecorp/toggle-ui';
import { IoMdAdd } from 'react-icons/io';
import {
    gql,
    useMutation,
    useQuery,
    MutationUpdaterFn,
} from '@apollo/client';

import { removeNull } from '#utils/schema';
import { PartialForm, PurgeNull } from '#types';
import useForm, { createSubmitHandler } from '#utils/form';
import type { ObjectSchema } from '#utils/schema';
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
import NotificationContext from '#components/NotificationContext';

import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';

import styles from './styles.css';

import {
    CreateResourceMutation,
    CreateResourceMutationVariables,
    UpdateResourceMutation,
    UpdateResourceMutationVariables,
    ResourceQuery,
    ResourceQueryVariables,
    ResourceGroupType,
    CountryType,
} from '#generated/types';

const CREATE_RESOURCE = gql`
    mutation CreateResource($input: ResourceCreateInputType!) {
        createResource(data: $input) {
            ok
            errors
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
            errors
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
                name
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
type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

type Group = Pick<ResourceGroupType, 'id' | 'name'>;
type Country = Pick<CountryType, 'id' | 'name'>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
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
    onAddNewResourceInCache: MutationUpdaterFn<CreateResourceMutation>;
    defaultCountryOption?: CountryOption | undefined | null;
}

function ResourceForm(props: ResourceFormProps) {
    const {
        onResourceFormClose,
        onGroupFormOpen,
        groups,
        id,
        onAddNewResourceInCache,
        defaultCountryOption,
    } = props;

    const defaultFormValues: PartialForm<FormType> = useMemo(
        () => {
            if (!defaultCountryOption) {
                return {};
            }
            const country = defaultCountryOption.id;
            return { countries: [country] };
        },
        [defaultCountryOption],
    );

    const {
        pristine,
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
        onValueSet,
        onPristineSet,
    } = useForm(defaultFormValues, schema);

    const { notify } = useContext(NotificationContext);
    const [
        countryOptions,
        setCountryOptions,
    ] = useState<CountryOption[] | undefined | null>(
        defaultCountryOption ? [defaultCountryOption] : undefined,
    );

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
                if (resource?.countries) {
                    setCountryOptions(resource.countries);
                }
                onValueSet(removeNull({
                    ...resource,
                    countries: resource.countries?.map((c) => c.id),
                    group: resource.group?.id,
                }));
            },
        },
    );

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
                    notify({ children: 'Failed to create resource.' });
                    onErrorSet(createResourceError);
                }
                if (result) {
                    notify({ children: 'Resource created successfully!' });
                    onPristineSet(true);
                    onResourceFormClose();
                }
            },
            onError: (createResourceError) => {
                notify({ children: 'Failed to create resource.' });
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
                    notify({ children: 'Failed to update resource.' });
                    onErrorSet(updateResourceError);
                }
                if (result) {
                    notify({ children: 'Resource updated successfully!' });
                    onPristineSet(true);
                    onResourceFormClose();
                }
            },
            onError: (updateResourceError) => {
                notify({ children: 'Failed to update resource.' });
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
        || resourceDataLoading;
    const errored = !!resourceDataError;
    const disabled = loading || errored;

    return (
        <form
            className={styles.resourceForm}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
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
            <CountryMultiSelectInput
                options={countryOptions}
                onOptionsChange={setCountryOptions}
                label="Countries *"
                name="countries"
                value={value.countries}
                onChange={onValueChange}
                error={error?.fields?.countries}
                disabled={disabled}
                readOnly={!!defaultCountryOption}
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
                    disabled={disabled || pristine}
                >
                    Submit
                </Button>
            </FormActions>
        </form>
    );
}

export default ResourceForm;
