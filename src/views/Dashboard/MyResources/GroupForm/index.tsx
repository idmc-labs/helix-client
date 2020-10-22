import React, { useCallback } from 'react';
import {
    Modal,
    TextInput,
    Button,
} from '@togglecorp/toggle-ui';
import { gql, useMutation } from '@apollo/client';

import { PartialForm } from '#types';
import useForm, { createSubmitHandler } from '#utils/form';
import type { Schema } from '#utils/schema';
import {
    requiredStringCondition,
} from '#utils/validation';
import { transformToFormError } from '#utils/errorTransform';

import Loading from '#components/Loading';

import { Group } from '../myResources.interface';
import styles from './styles.css';

const CREATE_RESOURCE_GROUP = gql`
  mutation CreateResourceGroup($input: ResourceGroupCreateInputType!) {
    createResourceGroup(resourceGroup: $input) {
      ok
      resourceGroup {
        id
        name
      }
      errors {
        field
        messages
      }
    }
  }
`;

interface GroupFormValues {
    name: string;
}

const schema: Schema<PartialForm<GroupFormValues>> = {
    fields: () => ({
        name: [requiredStringCondition],
    }),
};

interface GroupFormProps {
    groupFormOpened: boolean,
    onHandleGroupFormClose: () => void,
    onAddNewGroup: (groupItem: Group) => void,
}

const initialFormValues: PartialForm<GroupFormValues> = {
    name: undefined,
};

function GroupForm(props: GroupFormProps) {
    const {
        groupFormOpened,
        onHandleGroupFormClose,
        onAddNewGroup,
    } = props;

    // FIXME: move this
    const GroupFormHeader = (
        <h2>Add Group</h2>
    );

    interface CreateGroupVariables {
        input: {
            name: string;
        };
    }

    const {
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
    } = useForm(initialFormValues, schema);

    // FIXME: move this
    interface CreateGroupResponse {
        createResourceGroup: {
            ok: boolean,
            errors?: { field: string, message: string, }[],
            resourceGroup: Group,
        };
    }

    const [createResourceGroup,
        {
            loading: createGroupLoading,
        },
    ] = useMutation<CreateGroupResponse, CreateGroupVariables>(
        CREATE_RESOURCE_GROUP,
        {
            onCompleted: (data: CreateGroupResponse) => {
                if (data.createResourceGroup.errors) {
                    const createGroupError = transformToFormError(data.createResourceGroup.errors);
                    onErrorSet(createGroupError);
                    console.error(data.createResourceGroup.errors);
                } else {
                    onAddNewGroup(data.createResourceGroup.resourceGroup);
                }
            },
            // TODO: handle error
        },
    );

    const handleSubmit = useCallback((finalValue: PartialForm<GroupFormValues>) => {
        const completeValue = finalValue as GroupFormValues;
        createResourceGroup({
            variables: {
                input: {
                    name: completeValue.name,
                },
            },
        });
    }, [createResourceGroup]);

    // FIXME: why have a parent div?
    // Also, the modal should be moved out of the form component
    return (
        <div>
            {groupFormOpened && (
                <Modal
                    // FIXME: heading also support string
                    heading={GroupFormHeader}
                    onClose={onHandleGroupFormClose}
                >
                    <form
                        onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
                    >
                        {error?.$internal && (
                            <p>
                                {error?.$internal}
                            </p>
                        )}
                        <TextInput
                            label="Name"
                            name="name"
                            value={value.name}
                            onChange={onValueChange}
                            error={error?.fields?.name}
                        />
                        { // TODO: Add a loader
                            createGroupLoading && <Loading message="creating..." />
                        }
                        <div
                            className={styles.groupFormButtons}
                        >
                            <Button
                                name={undefined}
                                variant="primary"
                                type="submit"
                                className={styles.button}
                            >
                                Create
                            </Button>
                            <Button
                                name={undefined}
                                onClick={onHandleGroupFormClose}
                                className={styles.button}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default GroupForm;
