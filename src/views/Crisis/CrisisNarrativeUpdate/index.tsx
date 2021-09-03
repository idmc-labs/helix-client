import React, { useCallback, useContext, useMemo } from 'react';
import {
    Button,
} from '@togglecorp/toggle-ui';
import {
    PartialForm,
    PurgeNull,
    useForm,
    ObjectSchema,
    createSubmitHandler,
    removeNull,
    requiredStringCondition,
    idCondition,
} from '@togglecorp/toggle-form';
import { useMutation, useQuery, gql } from '@apollo/client';

import { transformToFormError } from '#utils/errorTransform';

import Loading from '#components/Loading';
import FormActions from '#components/FormActions';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import MarkdownEditor from '#components/MarkdownEditor';

import { WithId } from '#utils/common';
import {
    CrisisNarrativeQuery,
    CrisisNarrativeQueryVariables,
    UpdateCrisisNarrativeMutation,
    UpdateCrisisNarrativeMutationVariables,
} from '#generated/types';

import styles from './styles.css';

export const FETCH_CRISIS_NARRATIVE = gql`
    query CrisisNarrative($id: ID!) {
        crisis(id: $id) {
            id
            crisisNarrative
        }
    }
`;

export const UPDATE_CRISIS_NARRATIVE = gql`
    mutation UpdateCrisisNarrative($crisis: CrisisUpdateInputType!) {
        updateCrisis(data: $crisis) {
            result {
                id
                crisisNarrative
            }
            errors
        }
    }
`;

type CrisisNarrativeFormFields = UpdateCrisisNarrativeMutationVariables['crisis'];
type FormType = PurgeNull<PartialForm<WithId<CrisisNarrativeFormFields>>>;
type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        crisisNarrative: [requiredStringCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface UpdateCrisisNarrativeProps {
    id?: string;
    onFormCancel?: () => void;
}

function CrisisNarrativeUpdateForm(props: UpdateCrisisNarrativeProps) {
    const {
        id,
        onFormCancel,
    } = props;

    const {
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
        pristine,
        onValueSet,
    } = useForm(defaultFormValues, schema);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const narrativeVariables = useMemo(
        (): CrisisNarrativeQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: narrativeLoading,
    } = useQuery<CrisisNarrativeQuery>(
        FETCH_CRISIS_NARRATIVE,
        {
            skip: !narrativeVariables,
            variables: narrativeVariables,
            onCompleted: (response) => {
                const { crisis } = response;
                if (!crisis) {
                    return;
                }
                onValueSet(removeNull({ ...crisis }));
            },
        },
    );

    const [
        updateCrisisNarrative,
        { loading: updateNarrativeLoading },
    ] = useMutation<
        UpdateCrisisNarrativeMutation,
        UpdateCrisisNarrativeMutationVariables
    >(
        UPDATE_CRISIS_NARRATIVE,
        {
            onCompleted: (response) => {
                const { updateCrisis } = response;
                if (!updateCrisis) {
                    return;
                }
                const { errors } = updateCrisis;
                if (errors) {
                    const updateNarrativeError = transformToFormError(removeNull(errors));
                    onErrorSet(updateNarrativeError);
                    notifyGQLError(errors);
                } else {
                    notify({ children: 'Crisis Narrative updated successfully!' });
                    if (onFormCancel) {
                        onFormCancel();
                    }
                }
            },
            onError: (errors) => {
                notify({ children: errors.message });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = useCallback((finalValue: FormType) => {
        updateCrisisNarrative({
            variables: {
                crisis: finalValue as CrisisNarrativeFormFields,
            },
        });
    }, [updateCrisisNarrative]);

    const loading = narrativeLoading || updateNarrativeLoading;

    return (
        <form
            className={styles.narrativeForm}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <MarkdownEditor
                onChange={onValueChange}
                value={value.crisisNarrative}
                name="crisisNarrative"
                error={error?.fields?.crisisNarrative}
                disabled={loading}
            />
            {(value.crisisNarrative) && (
                <FormActions className={styles.actions}>
                    <Button
                        name={undefined}
                        onClick={onFormCancel}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        name={undefined}
                        variant="primary"
                        type="submit"
                        disabled={pristine || loading || !value.crisisNarrative}
                    >
                        Submit
                    </Button>
                </FormActions>
            )}
        </form>
    );
}

export default CrisisNarrativeUpdateForm;
