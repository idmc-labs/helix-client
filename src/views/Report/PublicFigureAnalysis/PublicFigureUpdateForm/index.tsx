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
    ReportPublicFigureAnalysisQuery,
    ReportPublicFigureAnalysisQueryVariables,
    UpdateReportPublicFigureAnalysisMutation,
    UpdateReportPublicFigureAnalysisMutationVariables,
} from '#generated/types';

import {
    FETCH_PUBLIC_FIGURE_ANALYSIS,
    UPDATE_PUBLIC_FIGURE_ANALYSIS,
} from '../query';
import styles from './styles.css';

type ReportPublicFigureAnalysisFields = UpdateReportPublicFigureAnalysisMutationVariables['report'];
type FormType = PurgeNull<PartialForm<WithId<ReportPublicFigureAnalysisFields>>>;
type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        publicFigureAnalysis: [requiredStringCondition],
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

    const publicFigureAnalysisVariables = useMemo(
        (): ReportPublicFigureAnalysisQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: publicFigureAnalysisLoading,
    } = useQuery<ReportPublicFigureAnalysisQuery>(
        FETCH_PUBLIC_FIGURE_ANALYSIS,
        {
            skip: !publicFigureAnalysisVariables,
            variables: publicFigureAnalysisVariables,
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
        updateReportPublicFigureAnalysis,
        { loading: updatePublicFigureAnalysisLoading },
    ] = useMutation<
        UpdateReportPublicFigureAnalysisMutation,
        UpdateReportPublicFigureAnalysisMutationVariables
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
                        children: 'Public Report Analysis updated successfully!',
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
        updateReportPublicFigureAnalysis({
            variables: {
                report: finalValue as ReportPublicFigureAnalysisFields,
            },
        });
    }, [updateReportPublicFigureAnalysis]);

    const loading = publicFigureAnalysisLoading || updatePublicFigureAnalysisLoading;

    return (
        <form
            className={styles.publicFigureForm}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <MarkdownEditor
                onChange={onValueChange}
                value={value.publicFigureAnalysis}
                name="publicFigureAnalysis"
                error={error?.fields?.publicFigureAnalysis}
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
                    disabled={pristine || loading || !value.publicFigureAnalysis}
                >
                    Submit
                </Button>
            </FormActions>
        </form>
    );
}

export default PublicFigureAnalysisForm;
