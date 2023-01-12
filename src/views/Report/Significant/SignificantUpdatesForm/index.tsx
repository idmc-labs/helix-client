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

import {
    ReportSignificantUpdatesQuery,
    ReportSignificantUpdatesQueryVariables,
    UpdateReportSignificantUpdatesMutation,
    UpdateReportSignificantUpdatesMutationVariables,
} from '#generated/types';

import { WithId } from '#utils/common';

import {
    FETCH_REPORT_SIGNIFICANT,
    UPDATE_REPORT_SIGNIFICANT,
} from '../query';
import styles from './styles.css';

type ReportSignificantFormFields = UpdateReportSignificantUpdatesMutationVariables['report'];
type FormType = PurgeNull<PartialForm<WithId<ReportSignificantFormFields>>>;
type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        significantUpdates: [requiredStringCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface UpdateReportSignificantProps {
    id?: string;
    onFormCancel?: () => void;
}

function SignificantUpdateForm(props: UpdateReportSignificantProps) {
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

    const reportSignificantVariables = useMemo(
        (): ReportSignificantUpdatesQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: reportSignificantLoading,
    } = useQuery<ReportSignificantUpdatesQuery>(
        FETCH_REPORT_SIGNIFICANT,
        {
            skip: !reportSignificantVariables,
            variables: reportSignificantVariables,
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
        updateReportSignificant,
        { loading: updateReportSignificantLoading },
    ] = useMutation<
        UpdateReportSignificantUpdatesMutation,
        UpdateReportSignificantUpdatesMutationVariables
    >(
        UPDATE_REPORT_SIGNIFICANT,
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
                        children: 'Significant updated successfully!',
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
        updateReportSignificant({
            variables: {
                report: finalValue as ReportSignificantFormFields,
            },
        });
    }, [updateReportSignificant]);

    const loading = reportSignificantLoading || updateReportSignificantLoading;

    return (
        <form
            className={styles.significantUpdatesForm}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <MarkdownEditor
                onChange={onValueChange}
                value={value.significantUpdates}
                name="significantUpdates"
                error={error?.fields?.significantUpdates}
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
                    disabled={pristine || loading || !value.significantUpdates}
                >
                    Submit
                </Button>
            </FormActions>
        </form>
    );
}

export default SignificantUpdateForm;
