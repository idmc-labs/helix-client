import React, { useMemo, useContext } from 'react';
import { Button } from '@togglecorp/toggle-ui';
import {
    gql,
    useMutation,
    MutationUpdaterFn,
} from '@apollo/client';
import {
    removeNull,
    ObjectSchema,
    useForm,
    createSubmitHandler,
    requiredCondition,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';

import { transformToFormError } from '#utils/errorTransform';

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
            errors
        }
    }
`;

type CountrySummaryFormFields = CreateSummaryMutationVariables['input'];
type FormType = PurgeNull<PartialForm<CountrySummaryFormFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
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
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

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
                    notifyGQLError(errors);
                    onErrorSet(createSummaryError);
                }
                if (result) {
                    onSummaryFormClose();
                    notify({ children: 'Summary updated successfully!' });
                    onPristineSet(true);
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
            {loading && <Loading absolute />}
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
