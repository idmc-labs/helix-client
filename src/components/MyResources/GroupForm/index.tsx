import React, { useCallback, useContext } from 'react';
import {
    TextInput,
    Button,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useMutation,
    MutationUpdaterFn,
} from '@apollo/client';

import { PartialForm, PurgeNull } from '#types';
import useForm, { createSubmitHandler } from '#utils/form';
import { removeNull } from '#utils/schema';
import type { Schema } from '#utils/schema';

import {
    requiredStringCondition,
    // idCondition,
} from '#utils/validation';
import { transformToFormError } from '#utils/errorTransform';

import Loading from '#components/Loading';
import FormActions from '#components/FormActions';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';

import styles from './styles.css';

import {
    CreateResourceGroupMutation,
    CreateResourceGroupMutationVariables,
} from '#generated/types';

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
type FormType = PurgeNull<PartialForm<GroupFormFields>>;

const schema: Schema<FormType> = {
    fields: () => ({
        // id: [idCondition],
        name: [requiredStringCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface GroupFormProps {
    onGroupFormClose: () => void;
    onAddNewGroupInCache: MutationUpdaterFn<CreateResourceGroupMutation>;
}

// TODO: handle group edit
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

    const { notify } = useContext(NotificationContext);

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
                    const createGroupError = transformToFormError(removeNull(errors));
                    onErrorSet(createGroupError);
                    console.error(errors);
                } else {
                    notify({ children: 'Group created successfully!' });
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
            className={styles.groupForm}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {createGroupLoading && <Loading className={styles.loading} />}
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
                disabled={createGroupLoading}
            />
            <FormActions className={styles.actions}>
                <Button
                    name={undefined}
                    onClick={onGroupFormClose}
                    disabled={createGroupLoading}
                >
                    Cancel
                </Button>
                <Button
                    name={undefined}
                    variant="primary"
                    type="submit"
                    disabled={createGroupLoading}
                >
                    Submit
                </Button>
            </FormActions>
        </form>
    );
}

export default GroupForm;
