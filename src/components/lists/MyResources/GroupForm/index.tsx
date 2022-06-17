import React, { useCallback, useContext } from 'react';
import {
    TextInput,
    Button,
} from '@togglecorp/toggle-ui';
import {
    removeNull,
    ObjectSchema,
    useForm,
    createSubmitHandler,
    requiredStringCondition,
    // idCondition,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';
import {
    gql,
    useMutation,
    MutationUpdaterFn,
} from '@apollo/client';

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
            errors
        }
    }
`;

type GroupFormFields = CreateResourceGroupMutationVariables['input'];
type FormType = PurgeNull<PartialForm<GroupFormFields>>;
type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        // id: [idCondition],
        name: [requiredStringCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};
interface GroupFormProps {
    onGroupFormClose: () => void;
    onAddNewGroupInCache: MutationUpdaterFn<CreateResourceGroupMutation>;
    handleNewGroupName: (groupName: string | undefined) => void;
}

// TODO: handle group edit
function GroupForm(props: GroupFormProps) {
    const {
        onGroupFormClose,
        onAddNewGroupInCache,
        handleNewGroupName,
    } = props;

    const {
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
        pristine,
        onPristineSet,
    } = useForm(defaultFormValues, schema);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

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
                    notifyGQLError(errors);
                    onErrorSet(createGroupError);
                    console.error(errors);
                } else {
                    notify({
                        children: 'Group created successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    handleNewGroupName(createResourceGroupRes?.result?.id);
                    onGroupFormClose();
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
            {createGroupLoading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <TextInput
                label="Name *"
                name="name"
                value={value.name}
                onChange={onValueChange}
                error={error?.fields?.name}
                disabled={createGroupLoading}
                autoFocus
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
                    disabled={createGroupLoading || pristine}
                >
                    Submit
                </Button>
            </FormActions>
        </form>
    );
}

export default GroupForm;
