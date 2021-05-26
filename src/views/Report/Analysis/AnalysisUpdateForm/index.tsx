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
    idCondition,
    requiredStringCondition,
} from '@togglecorp/toggle-form';
import { useMutation, useQuery } from '@apollo/client';

import { transformToFormError } from '#utils/errorTransform';

import Loading from '#components/Loading';
import FormActions from '#components/FormActions';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import MarkdownEditor from '#components/MarkdownEditor';

import {
    ReportAnalysisQuery,
    ReportAnalysisQueryVariables,
    UpdateReportAnalysisMutation,
    UpdateReportAnalysisMutationVariables,
} from '#generated/types';

import {
    FETCH_REPORT_ANALYSIS,
    UPDATE_REPORT_ANALYSIS,
} from '../query';
import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type ReportAnalysisFormFields = UpdateReportAnalysisMutationVariables['report'];
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
}

function AnalysisUpdateForm(props: UpdateReportAnalysisProps) {
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

    const analysisVariables = useMemo(
        (): ReportAnalysisQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: reportAnalysisLoading,
    } = useQuery<ReportAnalysisQuery>(
        FETCH_REPORT_ANALYSIS,
        {
            skip: !analysisVariables,
            variables: analysisVariables,
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
        UpdateReportAnalysisMutation,
        UpdateReportAnalysisMutationVariables
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
                    notifyGQLError(errors);
                } else {
                    notify({ children: 'Figure and Analysis updated successfully!' });
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
        updateReportAnalysis({
            variables: {
                report: finalValue as ReportAnalysisFormFields,
            },
        });
    }, [updateReportAnalysis]);

    const loading = reportAnalysisLoading || updateReportAnalysisLoading;

    return (
        <form
            className={styles.analysisForm}
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
            {(value.analysis) && (
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
