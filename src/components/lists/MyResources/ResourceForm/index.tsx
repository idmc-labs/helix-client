import React, { useState, useCallback, useMemo, useContext } from 'react';
import {
    TextInput,
    SelectInput,
    Button,
} from '@togglecorp/toggle-ui';
import {
    removeNull,
    ObjectSchema,
    useForm,
    createSubmitHandler,
    requiredCondition,
    requiredStringCondition,
    idCondition,
    arrayCondition,
    lengthGreaterThanCondition,
    urlCondition,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';
import { IoMdAdd } from 'react-icons/io';
import {
    gql,
    useMutation,
    useQuery,
    MutationUpdaterFn,
} from '@apollo/client';
import { transformToFormError } from '#utils/errorTransform';
import Row from '#components/Row';

import Loading from '#components/Loading';
import NonFieldError from '#components/NonFieldError';
import FormActions from '#components/FormActions';
import NotificationContext from '#components/NotificationContext';

import { WithId } from '#utils/common';
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
                    idmcShortName
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
                    idmcShortName
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
                idmcShortName
            }
        }
    }
`;

const getKeySelectorValue = (data: Group | Country) => data.id;

const getLabelSelectorValue = (data: Group | Country) => data.name;

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
        countries: [requiredCondition, arrayCondition],
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

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);
    const [
        countryOptions,
        setCountryOptions,
    ] = useState<CountryOption[] | undefined | null>(
        defaultCountryOption ? [defaultCountryOption] : undefined,
    );

    const resourceVariables = useMemo(
        (): ResourceQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: resourceDataLoading,
        error: resourceDataError,
    } = useQuery<ResourceQuery, ResourceQueryVariables>(
        GET_RESOURCE_BY_ID,
        {
            skip: !resourceVariables,
            variables: resourceVariables,
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
                    notifyGQLError(errors);
                    onErrorSet(createResourceError);
                }
                if (result) {
                    notify({ children: 'Resource created successfully!' });
                    onPristineSet(true);
                    onResourceFormClose();
                }
            },
            onError: (errors) => {
                notify({ children: errors.message });
                onErrorSet({
                    $internal: errors.message,
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
                    notifyGQLError(errors);
                    onErrorSet(updateResourceError);
                }
                if (result) {
                    notify({ children: 'Resource updated successfully!' });
                    onPristineSet(true);
                    onResourceFormClose();
                }
            },
            onError: (errors) => {
                notify({ children: errors.message });
                onErrorSet({
                    $internal: errors.message,
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
            <Row>
                <TextInput
                    label="Name *"
                    name="name"
                    value={value.name}
                    onChange={onValueChange}
                    error={error?.fields?.name}
                    disabled={disabled}
                />
            </Row>
            <Row>
                <TextInput
                    label="URL *"
                    name="url"
                    value={value.url}
                    onChange={onValueChange}
                    error={error?.fields?.url}
                    disabled={disabled}
                />
            </Row>
            <Row>
                <SelectInput
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
            </Row>
            <Row>
                <CountryMultiSelectInput
                    options={countryOptions}
                    onOptionsChange={setCountryOptions}
                    label="Countries *"
                    name="countries"
                    value={value.countries}
                    onChange={onValueChange}
                    error={error?.fields?.countries?.$internal}
                    disabled={disabled}
                    readOnly={!!defaultCountryOption}
                />
            </Row>
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
