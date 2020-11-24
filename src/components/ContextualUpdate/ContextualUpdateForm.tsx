import React, { useMemo, useContext } from 'react';
import {
    Button,
    TextArea,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useMutation,
    MutationUpdaterFn,
} from '@apollo/client';

import useForm, { createSubmitHandler } from '#utils/form';
import type { Schema } from '#utils/schema';
import { removeNull } from '#utils/schema';
import { transformToFormError } from '#utils/errorTransform';

import {
    PartialForm,
    PurgeNull,
} from '#types';

import {
    requiredCondition,
} from '#utils/validation';

import {
    CreateContextualUpdateMutation,
    CreateContextualUpdateMutationVariables,
} from '#generated/types';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';

import styles from './styles.css';

const CREATE_CONTEXTUAL_UPDATE = gql`
    mutation CreateContextualUpdate($input: ContextualUpdateCreateInputType!) {
        createContextualUpdate(data: $input) {
            errors {
                field
                messages
            }
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

const schema: Schema<FormType> = {
    fields: () => ({
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
        { loading: createContextualUpdateLoading },
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
                    onErrorSet(createContextualUpdateError);
                }
                if (result) {
                    notify({ children: 'Contextual update updated successfully!' });
                    onPristineSet(true);
                    onContextualUpdateFormClose();
                }
            },
            onError: (createContextualUpdateError) => {
                onErrorSet({
                    $internal: createContextualUpdateError.message,
                });
            },
        },
    );

    const disabled = createContextualUpdateLoading;

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
            {error?.$internal && (
                <NonFieldError>
                    {error?.$internal}
                </NonFieldError>
            )}
            <div className={styles.row}>
                <TextArea
                    onChange={onValueChange}
                    value={value.update}
                    name="update"
                    error={error?.fields?.update}
                    disabled={disabled}
                />
            </div>
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onContextualUpdateFormClose}
                    className={styles.button}
                    disabled={disabled}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    name={undefined}
                    disabled={disabled || pristine}
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
