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
import { useMutation, useQuery } from '@apollo/client';

import { transformToFormError } from '#utils/errorTransform';

import Loading from '#components/Loading';
import FormActions from '#components/FormActions';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import MarkdownEditor from '#components/MarkdownEditor';

import { WithId } from '#utils/common';
import {
    ReportSummaryQuery,
    ReportSummaryQueryVariables,
    UpdateReportSummaryMutation,
    UpdateReportSummaryMutationVariables,
} from '#generated/types';

import {
    FETCH_PUBLIC_FIGURE_ANALYSIS,
    UPDATE_PUBLIC_FIGURE_ANALYSIS,
} from '../query';
import styles from './styles.css';

type ReportSummaryFormFields = UpdateReportSummaryMutationVariables['report'];
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

interface PublicFigureAnalysisProps {
    id?: string;
    onFormCancel?: () => void;
}

function PublicFigureAnalysisForm(props: PublicFigureAnalysisProps) {
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

    const summaryVariables = useMemo(
        (): ReportSummaryQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: reportSummaryLoading,
    } = useQuery<ReportSummaryQuery>(
        FETCH_PUBLIC_FIGURE_ANALYSIS,
        {
            skip: !summaryVariables,
            variables: summaryVariables,
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
        UpdateReportSummaryMutation,
        UpdateReportSummaryMutationVariables
    >(
        UPDATE_PUBLIC_FIGURE_ANALYSIS,
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
                    notify({
                        children: 'Summary updated successfully!',
                        variant: 'success',
                    });
                    if (onFormCancel) {
                        onFormCancel();
                    }
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
        updateReportSummary({
            variables: {
                report: finalValue as ReportSummaryFormFields,
            },
        });
    }, [updateReportSummary]);

    const loading = reportSummaryLoading || updateReportSummaryLoading;

    return (
        <form
            className={styles.summaryForm}
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
            <FormActions>
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
        </form>
    );
}

export default PublicFigureAnalysisForm;
