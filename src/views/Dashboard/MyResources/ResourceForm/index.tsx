import React, { useCallback, useMemo } from 'react';
import {
    Modal,
    TextInput,
    SelectInput,
    Button,
    MultiSelectInput,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import { FaPlus } from 'react-icons/fa';
import { gql, useMutation } from '@apollo/client';

import useForm, { createSubmitHandler } from '#utils/form';
import type { Schema } from '#utils/schema';
import {
    requiredStringCondition,
    lengthGreaterThanCondition,
    urlCondition,
} from '#utils/validation';
import { transformToFormError } from '#utils/errorTransform';

import QuickActionButton from '#components/QuickActionButton';
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

const schema: Schema<Partial<ResourceFormValues>> = {
    fields: () => ({
        name: [requiredStringCondition, lengthGreaterThanCondition(3)],
        url: [requiredStringCondition, urlCondition],
        group: [],
        id: [],
        countries: [],
    }),
};

interface ResourceFormProps {
    resourceFormOpened: boolean,
    onHandleResourceFormClose: () => void,
    onHandleGroupFormOpen: () => void,
    groups: Group[],
    countries: Country[],
    onAddNewResource: (resourceItem: Resource) => void,
    resourceItemOnEdit: Resource | undefined,
    onUpdateResourceItem: (resourceItem: Resource) => void,
    onRemoveResource: (resourceId: string) => void,
}

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

const getKeySelectorValue = (data: Group | Country) => data.id;

const getLabelSelectorValue = (data: Group | Country) => data.name;

function ResourceForm(props: ResourceFormProps) {
    const {
        resourceFormOpened,
        onHandleResourceFormClose,
        onHandleGroupFormOpen,
        groups,
        onAddNewResource,
        resourceItemOnEdit,
        onUpdateResourceItem,
        countries,
        onRemoveResource,
    } = props;

    const AddResourceFormHeader = (
        <h2>Add Resource</h2>
    );

    const EditResourceFormHeader = (
        <h2>Edit Resource</h2>
    );

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

    const initialFormValues: Partial<ResourceFormValues> = {
        name: resourceItemOnEdit?.name ?? '',
        url: resourceItemOnEdit?.url ?? '',
        group: resourceItemOnEdit?.group?.id ?? '',
        countries: resourceItemOnEdit?.countries?.map((c) => c.id) ?? [],
        id: resourceItemOnEdit?.id,
    };

    const {
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
    } = useForm(initialFormValues, schema);

    const [createResource,
        {
            loading: createResourceLoading,
        },
    ] = useMutation<CreateResourceResponse, CreateUpdateResourceVariables>(
        CREATE_RESOURCE,
        {
            onCompleted: (data: CreateResourceResponse) => {
                if (data.createResource.errors) {
                    const createResourceError = transformToFormError(data.createResource.errors);
                    onErrorSet(createResourceError);
                } else {
                    onAddNewResource(data.createResource.resource);
                }
            },

            onError: (createResourceError) => {
                console.warn(createResourceError);
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
            onCompleted: (data: UpdateResourceResponse) => {
                if (data.updateResource.errors) {
                    const updateResourceError = transformToFormError(data.updateResource.errors);
                    onErrorSet(updateResourceError);
                } else {
                    onUpdateResourceItem(data.updateResource.resource);
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
            onCompleted: (data: DeleteResourceResponse) => {
                if (data.deleteResource.errors) {
                    const deleteResourceError = transformToFormError(data.deleteResource.errors);
                    onErrorSet(deleteResourceError);
                } else {
                    onRemoveResource(data.deleteResource.resource.id); // remove resource from list
                }
            },
        },
    );

    const handleSubmit = useCallback((finalValue: ResourceFormValues) => {
        if (finalValue.id) {
            updateResource({
                variables: {
                    input: {
                        name: finalValue.name,
                        url: finalValue.url,
                        group: finalValue.group !== '-1' ? finalValue.group : '',
                        countries: finalValue.countries,
                        id: finalValue.id,
                    },
                },
            });
        } else {
            createResource({
                variables: {
                    input: {
                        name: finalValue.name,
                        url: finalValue.url,
                        countries: finalValue.countries,
                        group: finalValue.group !== '-1' ? finalValue.group : '',
                    },
                },
            });
        }
    }, [updateResource, createResource]);

    const onDeleteResource = useCallback(() => {
        if (!resourceItemOnEdit) {
            return;
        }
        deleteResource({
            variables: {
                id: resourceItemOnEdit.id,
            },
        });
    }, [deleteResource, resourceItemOnEdit]);

    const loading = useMemo(
        () => createResourceLoading || updateResourceLoading || deleteResourceLoading,
        [createResourceLoading, updateResourceLoading, deleteResourceLoading],
    );

    return (
        <div>
            {resourceFormOpened && (
                <Modal
                    heading={resourceItemOnEdit ? EditResourceFormHeader : AddResourceFormHeader}
                    onClose={onHandleResourceFormClose}
                >
                    <form onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}>
                        <TextInput
                            label="Title"
                            name="name"
                            value={value.name}
                            onChange={onValueChange}
                            error={error?.fields?.name}
                        />

                        <TextInput
                            label="URL"
                            name="url"
                            value={value.url}
                            onChange={onValueChange}
                            error={error?.fields?.url}
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
                        />
                        <MultiSelectInput
                            label="Countries"
                            name="countries"
                            options={countries}
                            value={value.countries}
                            onChange={onValueChange}
                            keySelector={getKeySelectorValue}
                            labelSelector={getLabelSelectorValue}
                        />

                        {/* TODO: Show loader  */}

                        {
                            loading && <Loading message="loading..." />
                        }

                        <div className={styles.resourceFormButtons}>
                            {!!resourceItemOnEdit && (
                                <ConfirmButton
                                    name="delete-resource"
                                    onConfirm={onDeleteResource}
                                    confirmationHeader="Confirm Delete"
                                    confirmationMessage="Are you sure you want to delete?"
                                >
                                    Delete
                                </ConfirmButton>
                            )}
                            <div
                                className={styles.buttonGroup}
                            >
                                <Button
                                    variant="primary"
                                    type="submit"
                                    name="create-update-resource"
                                    className={styles.button}
                                >
                                    {resourceItemOnEdit ? 'Update ' : 'Create '}
                                </Button>
                                <Button
                                    name="cancel-button"
                                    onClick={onHandleResourceFormClose}
                                    className={styles.button}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default ResourceForm;
