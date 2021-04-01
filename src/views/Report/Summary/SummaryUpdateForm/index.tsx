import React, { useCallback, useContext } from 'react';
import {
    Button,
} from '@togglecorp/toggle-ui';
import { useMutation, useQuery } from '@apollo/client';

import useForm, { createSubmitHandler } from '#utils/form';
import { removeNull } from '#utils/schema';
import type { ObjectSchema } from '#utils/schema';
import {
    requiredStringCondition,
    idCondition,
} from '#utils/validation';
import { transformToFormError } from '#utils/errorTransform';

import Loading from '#components/Loading';
import FormActions from '#components/FormActions';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import MarkdownEditor from '#components/MarkdownEditor';

import { PartialForm, PurgeNull } from '#types';
import {
    ReportQuery,
    UpdateReportMutation,
    UpdateReportMutationVariables,
} from '#generated/types';

import {
    FETCH_REPORT_SUMMARY,
    UPDATE_REPORT_SUMMARY,
} from '../query';
import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type ReportSummaryFormFields = UpdateReportMutationVariables['report'];
type FormType = PurgeNull<PartialForm<WithId<ReportSummaryFormFields>>>;
type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        summary: [requiredStringCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface UpdateReportSummaryProps {
    id?: string;
    onFormCancel?: () => void;
    minimal?: boolean;
}

function SummaryUpdateForm(props: UpdateReportSummaryProps) {
    const {
        id,
        onFormCancel,
        minimal,
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

    const { notify } = useContext(NotificationContext);

    const {
        loading: reportSummaryLoading,
    } = useQuery<ReportQuery>(
        FETCH_REPORT_SUMMARY,
        {
            skip: !id,
            variables: id ? { id } : undefined,
            onCompleted: (response) => {
                const { report } = response;
                if (!report) {
                    return;
                }
                onValueSet(removeNull({ ...report }));
            },
        },
    );

    const [
        updateReportSummary,
        { loading: updateReportSummaryLoading },
    ] = useMutation<
        UpdateReportMutation,
        UpdateReportMutationVariables
    >(
        UPDATE_REPORT_SUMMARY,
        {
            onCompleted: (response) => {
                const { updateReport } = response;
                if (!updateReport) {
                    return;
                }
                const { errors } = updateReport;
                if (errors) {
                    const updateReportError = transformToFormError(removeNull(errors));
                    onErrorSet(updateReportError);
                    notify({ children: 'Summary could not be updated!' });
                } else {
                    notify({ children: 'Summary updated successfully!' });
                    if (onFormCancel) {
                        onFormCancel();
                    }
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
                notify({ children: 'Summary could not be updated!' });
            },
        },
    );

    const handleSubmit = useCallback((finalValue: FormType) => {
        updateReportSummary({
            variables: {
                report: finalValue as ReportSummaryFormFields,
            },
        });
    }, [updateReportSummary]);

    const loading = reportSummaryLoading || updateReportSummaryLoading;

    return (
        <form
            className={styles.commentForm}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <MarkdownEditor
                onChange={onValueChange}
                value={value.summary}
                name="summary"
                error={error?.fields?.summary}
                disabled={loading}
            />
            {(!minimal || value.summary) && (
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
                        disabled={pristine || loading || !value.summary}
                    >
                        Submit
                    </Button>
                </FormActions>
            )}
        </form>
    );
}

export default SummaryUpdateForm;
