import React, { useMemo, useContext } from 'react';
import { Button } from '@togglecorp/toggle-ui';
import {
    gql,
    useMutation,
    MutationUpdaterFn,
} from '@apollo/client';

import useForm, { createSubmitHandler } from '#utils/form';
import type { Schema } from '#utils/schema';
import { removeNull } from '#utils/schema';
import { transformToFormError } from '#utils/errorTransform';
import { requiredCondition } from '#utils/validation';

import {
    PartialForm,
    PurgeNull,
} from '#types';

import {
    CreateSummaryMutation,
    CreateSummaryMutationVariables,
} from '#generated/types';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import MarkdownEditor from '#components/MarkdownEditor';
import Loading from '#components/Loading';

import styles from './styles.css';

const CREATE_SUMMARY = gql`
    mutation CreateSummary($input: SummaryCreateInputType!) {
        createSummary(data: $input) {
            result {
                id
                summary
            }
            errors {
                field
                messages
            }
        }
    }
`;

type CountrySummaryFormFields = CreateSummaryMutationVariables['input'];
type FormType = PurgeNull<PartialForm<CountrySummaryFormFields>>;

const schema: Schema<FormType> = {
    fields: () => ({
        summary: [requiredCondition],
        country: [requiredCondition],
    }),
};

interface CountrySummaryFormProps {
    country: string;
    summary?: string;
    onSummaryFormClose: () => void;
    onAddNewSummaryInCache: MutationUpdaterFn<CreateSummaryMutation>;
}

function CountrySummaryForm(props:CountrySummaryFormProps) {
    const {
        country,
        summary,
        onAddNewSummaryInCache,
        onSummaryFormClose,
    } = props;

    const defaultFormValues: PartialForm<FormType> = useMemo(
        () => ({
            summary,
            country,
        }),
        [country, summary],
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
        createSummary,
        { loading },
    ] = useMutation<CreateSummaryMutation, CreateSummaryMutationVariables>(
        CREATE_SUMMARY,
        {
            update: onAddNewSummaryInCache,
            onCompleted: (response) => {
                const { createSummary: createSummaryRes } = response;
                if (!createSummaryRes) {
                    return;
                }
                const { errors, result } = createSummaryRes;
                if (errors) {
                    const createSummaryError = transformToFormError(removeNull(errors));
                    onErrorSet(createSummaryError);
                }
                if (result) {
                    onSummaryFormClose();
                    notify({ children: 'Summary updated successfully!' });
                    onPristineSet(true);
                }
            },
            onError: (createSummaryError) => {
                onErrorSet({
                    $internal: createSummaryError.message,
                });
            },
        },
    );

    const handleSubmit = React.useCallback(
        (finalValues: PartialForm<FormType>) => {
            createSummary({
                variables: {
                    input: finalValues as CountrySummaryFormFields,
                },
            });
        }, [createSummary],
    );

    return (
        <form
            className={styles.form}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div className={styles.row}>
                <MarkdownEditor
                    onChange={onValueChange}
                    value={value.summary}
                    name="summary"
                    error={error?.fields?.summary}
                    disabled={loading}
                />
            </div>
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onSummaryFormClose}
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

export default CountrySummaryForm;
