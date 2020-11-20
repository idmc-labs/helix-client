import React, { useMemo, useContext } from 'react';

import {
    Button,
    TextArea,
} from '@togglecorp/toggle-ui';

import {
    gql,
    useMutation,
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
    idCondition,
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
            ok
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
        id: [idCondition],
        update: [requiredCondition],
        country: [requiredCondition],
    }),
};

interface ContextualUpdateProps {
    country: string | undefined;
    update?: string;
    onContextualUpdateFormClose: () => void;
    onRefetchCountry?: () => void;
}

function ContextualUpdate(props:ContextualUpdateProps) {
    const {
        country,
        update,
        onRefetchCountry,
        onContextualUpdateFormClose,
    } = props;

    // TO ENSURE: if initializing defaultFormValue here is ok
    const defaultFormValues: PartialForm<FormType> = useMemo(
        () => removeNull({
            update,
            country,
        }), [country, update],
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
            update: onRefetchCountry,
            onCompleted: (response) => {
                const { createContextualUpdate: createContextualUpdateRes } = response;
                if (!createContextualUpdateRes) {
                    return;
                }
                const { errors, result } = createContextualUpdateRes;
                if (errors) {
                    const createContextualUpdateError = transformToFormError(removeNull(errors));
                    onErrorSet(createContextualUpdateError);
                } else {
                    const newContextualUpdateId = result?.id;
                    if (newContextualUpdateId) {
                        notify({ children: 'Contextual update updated successfully!' });
                        onPristineSet(true);
                    }
                }
                if (result) {
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
        }, [createContextualUpdate],
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
                    type="submit"
                    name={undefined}
                    disabled={disabled || pristine}
                    className={styles.button}
                    variant="primary"
                >
                    Submit
                </Button>
                <Button
                    name={undefined}
                    onClick={onContextualUpdateFormClose}
                    className={styles.button}
                    disabled={disabled}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}

export default ContextualUpdate;
