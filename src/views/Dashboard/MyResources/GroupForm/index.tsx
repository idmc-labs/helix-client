import React, { useCallback } from 'react';
import {
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
    onHandleGroupFormClose: () => void;
    onAddGroupCache: (
        cache, // FIXME: type for cache
        data: { data: {createResourceGroup: { resourceGroup: Group }}}
    ) => void;
}

const initialFormValues: PartialForm<GroupFormValues> = {
    name: undefined,
};

interface CreateGroupResponse {
    createResourceGroup: {
        ok: boolean,
        errors?: { field: string, message: string, }[],
        resourceGroup: Group,
    };
}

interface CreateGroupVariables {
    input: {
        name: string;
    };
}

function GroupForm(props: GroupFormProps) {
    const {
        onHandleGroupFormClose,
        onAddGroupCache,
    } = props;

    const {
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
    } = useForm(initialFormValues, schema);

    const [createResourceGroup,
        {
            loading: createGroupLoading,
        },
    ] = useMutation<CreateGroupResponse, CreateGroupVariables>(
        CREATE_RESOURCE_GROUP,
        {
            // FIXME: type mismatch of update with onAddGroupCache
            update: onAddGroupCache,
            onCompleted: (data: CreateGroupResponse) => {
                if (data.createResourceGroup.errors) {
                    const createGroupError = transformToFormError(data.createResourceGroup.errors);
                    onErrorSet(createGroupError);
                    console.error(data.createResourceGroup.errors);
                } else {
                    onHandleGroupFormClose();
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
            },
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

    return (
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
    );
}

export default GroupForm;
