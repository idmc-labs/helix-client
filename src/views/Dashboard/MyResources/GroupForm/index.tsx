import React, { useCallback } from 'react';
import {
    Modal,
    TextInput,
    Button,
} from '@togglecorp/toggle-ui';
import { gql, useMutation } from '@apollo/client';

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

const schema: Schema<Partial<GroupFormValues>> = {
    fields: () => ({
        name: [requiredStringCondition],
    }),
};

interface GroupFormProps {
    groupFormOpened: boolean,
    onHandleGroupFormClose: () => void,
    onAddNewGroup: (groupItem: Group) => void,
}

const initialFormValues: Partial<GroupFormValues> = {
    name: '',
};

function GroupForm(props: GroupFormProps) {
    const {
        groupFormOpened,
        onHandleGroupFormClose,
        onAddNewGroup,
    } = props;

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
                    // TODO: handle server error
                    const createGroupError = transformToFormError(data.createResourceGroup.errors);
                    onErrorSet(createGroupError);
                    console.error(data.createResourceGroup.errors);
                } else {
                    onAddNewGroup(data.createResourceGroup.resourceGroup);
                }
            },
        },
    );

    const handleSubmit = useCallback((finalValue: GroupFormValues) => {
        createResourceGroup({
            variables: {
                input: {
                    name: finalValue.name,
                },
            },
        });
    }, [createResourceGroup]);

    return (
        <div>
            {groupFormOpened && (
                <Modal
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
                                variant="primary"
                                type="submit"
                                name="create-group"
                                className={styles.button}
                            >
                                Create
                            </Button>
                            <Button
                                name="cancel-button"
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
