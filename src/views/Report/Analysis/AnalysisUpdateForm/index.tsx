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
    FETCH_REPORT_ANALYSIS,
    UPDATE_REPORT_ANALYSIS,
} from '../query';
import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type ReportAnalysisFormFields = UpdateReportMutationVariables['report'];
type FormType = PurgeNull<PartialForm<WithId<ReportAnalysisFormFields>>>;
type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        analysis: [requiredStringCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface UpdateReportAnalysisProps {
    id?: string;
    onFormCancel?: () => void;
    minimal?: boolean;
}

function AnalysisUpdateForm(props: UpdateReportAnalysisProps) {
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
        loading: reportAnalysisLoading,
    } = useQuery<ReportQuery>(
        FETCH_REPORT_ANALYSIS,
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
        updateReportAnalysis,
        { loading: updateReportAnalysisLoading },
    ] = useMutation<
        UpdateReportMutation,
        UpdateReportMutationVariables
    >(
        UPDATE_REPORT_ANALYSIS,
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
                    notify({ children: 'Figure and Analysis could not be updated!' });
                } else {
                    notify({ children: 'Figure and Analsis updated successfully!' });
                    if (onFormCancel) {
                        onFormCancel();
                    }
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
                notify({ children: 'Figure and Analysis could not be updated!' });
            },
        },
    );

    const handleSubmit = useCallback((finalValue: FormType) => {
        updateReportAnalysis({
            variables: {
                report: finalValue as ReportAnalysisFormFields,
            },
        });
    }, [updateReportAnalysis]);

    const loading = reportAnalysisLoading || updateReportAnalysisLoading;

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
                value={value.analysis}
                name="analysis"
                error={error?.fields?.analysis}
                disabled={loading}
            />
            {(!minimal || value.analysis) && (
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
                        disabled={pristine || loading || !value.analysis}
                    >
                        Submit
                    </Button>
                </FormActions>
            )}
        </form>
    );
}

export default AnalysisUpdateForm;
