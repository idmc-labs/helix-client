import React, { useCallback } from 'react';
import {
    TextInput,
    Button,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useMutation,
} from '@apollo/client';

import { PartialForm } from '#types';
import useForm, { createSubmitHandler } from '#utils/form';
import type { Schema } from '#utils/schema';
import { requiredStringCondition } from '#utils/validation';
import { transformToFormError } from '#utils/errorTransform';

import Loading from '#components/Loading';

import styles from './styles.css';

import {
    CreateResourceGroupMutation,
    CreateResourceGroupMutationVariables,
} from '../../../../../types';

const CREATE_RESOURCE_GROUP = gql`
    mutation CreateResourceGroup($input: ResourceGroupCreateInputType!) {
        createResourceGroup(data: $input) {
            ok
            result {
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

type GroupFormFields = CreateResourceGroupMutationVariables['input'];
type FormType = PartialForm<GroupFormFields>;

const schema: Schema<FormType> = {
    fields: () => ({
        name: [requiredStringCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface GroupFormProps {
    onGroupFormClose: () => void;
    onAddNewGroupInCache: () => void;
}

function GroupForm(props: GroupFormProps) {
    const {
        onGroupFormClose,
        onAddNewGroupInCache,
    } = props;

    const {
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
    } = useForm(defaultFormValues, schema);

    const [
        createResourceGroup,
        { loading: createGroupLoading },
    ] = useMutation<CreateResourceGroupMutation, CreateResourceGroupMutationVariables>(
        CREATE_RESOURCE_GROUP,
        {
            update: onAddNewGroupInCache,
            onCompleted: (response) => {
                const { createResourceGroup: createResourceGroupRes } = response;
                if (!createResourceGroupRes) {
                    return;
                }
                const { errors } = createResourceGroupRes;
                if (errors) {
                    const createGroupError = transformToFormError(errors);
                    onErrorSet(createGroupError);
                    console.error(errors);
                } else {
                    onGroupFormClose();
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = useCallback((finalValue: FormType) => {
        createResourceGroup({
            variables: {
                input: finalValue as GroupFormFields,
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
                disabled={createGroupLoading}
            />
            {createGroupLoading && <Loading />}
            <div
                className={styles.groupFormButtons}
            >
                <Button
                    name={undefined}
                    variant="primary"
                    type="submit"
                    className={styles.button}
                    disabled={createGroupLoading}
                >
                    Submit
                </Button>
                <Button
                    name={undefined}
                    onClick={onGroupFormClose}
                    className={styles.button}
                    disabled={createGroupLoading}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}

export default GroupForm;
