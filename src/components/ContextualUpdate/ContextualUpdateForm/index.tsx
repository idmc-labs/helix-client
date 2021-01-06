import React, { useMemo, useContext } from 'react';
import {
    Button,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useMutation,
    MutationUpdaterFn,
} from '@apollo/client';

import useForm, { createSubmitHandler } from '#utils/form';
import type { ObjectSchema } from '#utils/schema';
import { removeNull } from '#utils/schema';
import { transformToFormError } from '#utils/errorTransform';
import { requiredCondition } from '#utils/validation';

import {
    PartialForm,
    PurgeNull,
} from '#types';
import {
    CreateContextualUpdateMutation,
    CreateContextualUpdateMutationVariables,
} from '#generated/types';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import MarkdownEditor from '#components/MarkdownEditor';
import Loading from '#components/Loading';

import styles from './styles.css';

const CREATE_CONTEXTUAL_UPDATE = gql`
    mutation CreateContextualUpdate($input: ContextualUpdateCreateInputType!) {
        createContextualUpdate(data: $input) {
            errors
            result {
                id
                update
                createdAt
            }
        }
    }
`;

type ContextualUpdateFields = CreateContextualUpdateMutationVariables['input'];
type FormType = PurgeNull<PartialForm<ContextualUpdateFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        update: [requiredCondition],
        country: [requiredCondition],
    }),
};

interface ContextualUpdateProps {
    country: string;
    update?: string;
    onContextualUpdateFormClose: () => void;
    onAddNewContextualUpdateInCache: MutationUpdaterFn<CreateContextualUpdateMutation>;
}

function ContextualUpdate(props:ContextualUpdateProps) {
    const {
        country,
        update,
        onAddNewContextualUpdateInCache,
        onContextualUpdateFormClose,
    } = props;

    const defaultFormValues: PartialForm<FormType> = useMemo(
        () => ({
            update,
            country,
        }),
        [country, update],
    );

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onPristineSet,
    } = useForm(defaultFormValues, schema);

    const { notify } = useContext(NotificationContext);

    const [
        createContextualUpdate,
        { loading },
    ] = useMutation<CreateContextualUpdateMutation, CreateContextualUpdateMutationVariables>(
        CREATE_CONTEXTUAL_UPDATE,
        {
            update: onAddNewContextualUpdateInCache,
            onCompleted: (response) => {
                const { createContextualUpdate: createContextualUpdateRes } = response;
                if (!createContextualUpdateRes) {
                    return;
                }
                const { errors, result } = createContextualUpdateRes;
                if (errors) {
                    const createContextualUpdateError = transformToFormError(removeNull(errors));
                    notify({ children: 'Failed to update Contextual update' });
                    onErrorSet(createContextualUpdateError);
                }
                if (result) {
                    notify({ children: 'Contextual update updated successfully!' });
                    onPristineSet(true);
                    onContextualUpdateFormClose();
                }
            },
            onError: (createContextualUpdateError) => {
                notify({ children: 'Failed to update Contextual update' });
                onErrorSet({
                    $internal: createContextualUpdateError.message,
                });
            },
        },
    );

    const handleSubmit = React.useCallback(
        (finalValues: PartialForm<FormType>) => {
            createContextualUpdate({
                variables: {
                    input: finalValues as ContextualUpdateFields,
                },
            });
        },
        [createContextualUpdate],
    );

    return (
        <form
            className={styles.form}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div className={styles.row}>
                <MarkdownEditor
                    onChange={onValueChange}
                    value={value.update}
                    name="update"
                    error={error?.fields?.update}
                    disabled={loading}
                />
            </div>
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onContextualUpdateFormClose}
                    className={styles.button}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    name={undefined}
                    disabled={loading || pristine}
                    className={styles.button}
                    variant="primary"
                >
                    Submit
                </Button>
            </div>
        </form>
    );
}

export default ContextualUpdate;
