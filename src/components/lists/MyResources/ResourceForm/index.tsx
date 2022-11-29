import React, { useState, useCallback, useMemo, useContext } from 'react';
import {
    TextInput,
    SelectInput,
    Button,
    Modal,
} from '@togglecorp/toggle-ui';
import produce from 'immer';
import {
    removeNull,
    ObjectSchema,
    useForm,
    createSubmitHandler,
    requiredListCondition,
    requiredStringCondition,
    idCondition,
    arrayCondition,
    lengthGreaterThanCondition,
    urlCondition,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';
import { IoAddOutline } from 'react-icons/io5';
import {
    gql,
    useMutation,
    useQuery,
    MutationUpdaterFn,
} from '@apollo/client';
import { transformToFormError } from '#utils/errorTransform';
import DomainContext from '#components/DomainContext';
import Loading from '#components/Loading';
import NonFieldError from '#components/NonFieldError';
import FormActions from '#components/FormActions';
import NotificationContext from '#components/NotificationContext';
import useBasicToggle from '#hooks/useBasicToggle';

import { WithId } from '#utils/common';
import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';

import GroupForm from '../GroupForm';

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
    CreateResourceGroupMutation,
    GroupsForResourceQuery,
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

const GET_GROUPS_LIST = gql`
    query GroupsForResource {
        resourceGroupList {
            name
            id
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
        countries: [requiredListCondition, arrayCondition],
    }),
};
interface ResourceFormProps {
    onResourceFormClose: () => void,
    id: string | undefined,
    handleRefetchResource: MutationUpdaterFn<CreateResourceMutation>;
    defaultCountryOption?: CountryOption | undefined | null;
}

function ResourceForm(props: ResourceFormProps) {
    const {
        onResourceFormClose,
        id,
        handleRefetchResource,
        defaultCountryOption,
    } = props;

    const [
        groupFormOpened,
        handleGroupFormOpen,
        handleGroupFormClose,
    ] = useBasicToggle();

    const { user } = useContext(DomainContext);
    // FIXME: add permission for group and use it
    const addResourcePermission = user?.permissions?.resource?.add;

    const defaultFormValues: PartialForm<FormType> = useMemo(
        () => {
            if (!defaultCountryOption) {
                return {};
            }
            const country = defaultCountryOption.id;
            return {
                countries: [country],
            };
        },
        [
            defaultCountryOption,
        ],
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

    const {
        previousData,
        data: groups = previousData,
        // loading: groupsLoading,
        // error: errorGroupsLoading,
    } = useQuery<GroupsForResourceQuery>(GET_GROUPS_LIST);

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
                if (!safeCacheData?.resourceGroupList) {
                    return;
                }
                const { resourceGroupList } = safeCacheData;
                resourceGroupList.push(resourceGroup);
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
            update: handleRefetchResource,
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
                    notify({
                        children: 'Resource created successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onResourceFormClose();
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
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
                    notify({
                        children: 'Resource updated successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onResourceFormClose();
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleNewGroupName = useCallback(
        (groupName: string | undefined) => {
            handleGroupFormClose();
            onValueChange(groupName, 'group');
        },
        [
            onValueChange,
            handleGroupFormClose,
        ],
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

    const groupsList = groups?.resourceGroupList;

    const loading = createResourceLoading
        || updateResourceLoading
        || resourceDataLoading;
    const errored = !!resourceDataError;
    const disabled = loading || errored;

    return (
        <>
            <form
                className={styles.resourceForm}
                onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
            >
                {loading && <Loading absolute />}
                <NonFieldError>
                    {error?.$internal}
                </NonFieldError>
                <TextInput
                    label="Name *"
                    name="name"
                    value={value.name}
                    onChange={onValueChange}
                    error={error?.fields?.name}
                    disabled={disabled}
                    autoFocus
                />
                <TextInput
                    label="URL *"
                    name="url"
                    value={value.url}
                    onChange={onValueChange}
                    error={error?.fields?.url}
                    disabled={disabled}
                />
                <SelectInput
                    label="Group"
                    actions={addResourcePermission && (
                        <Button
                            name={undefined}
                            onClick={handleGroupFormOpen}
                            transparent
                            compact
                            title="Add new group"
                        >
                            <IoAddOutline />
                        </Button>
                    )}
                    name="group"
                    options={groupsList}
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
                    error={error?.fields?.countries?.$internal}
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
            {groupFormOpened && (
                <Modal
                    heading="Add Group"
                    onClose={handleGroupFormClose}
                    size="small"
                    freeHeight
                >
                    <GroupForm
                        onAddNewGroupInCache={handleAddNewGroupInCache}
                        onAddNewGroup={handleNewGroupName}
                    />
                </Modal>
            )}
        </>
    );
}

export default ResourceForm;
