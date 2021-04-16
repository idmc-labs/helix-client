import React, { useCallback, useContext, useMemo } from 'react';
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
    ReportMethodologyQuery,
    ReportMethodologyQueryVariables,
    UpdateReportMethodologyMutation,
    UpdateReportMethodologyMutationVariables,
} from '#generated/types';

import {
    FETCH_REPORT_METHODOLOGY,
    UPDATE_REPORT_METHODOLOGY,
} from '../query';
import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type ReportMethodologyFormFields = UpdateReportMethodologyMutationVariables['report'];
type FormType = PurgeNull<PartialForm<WithId<ReportMethodologyFormFields>>>;
type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        methodology: [requiredStringCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface UpdateReportMethodologyProps {
    id?: string;
    onFormCancel?: () => void;
}

function MethodologyUpdateForm(props: UpdateReportMethodologyProps) {
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

    const { notify } = useContext(NotificationContext);

    const methodologyVariables = useMemo(
        (): ReportMethodologyQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: reportMethodologyLoading,
    } = useQuery<ReportMethodologyQuery>(
        FETCH_REPORT_METHODOLOGY,
        {
            skip: !methodologyVariables,
            variables: methodologyVariables,
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
        updateReportMethodology,
        { loading: updateReportMethodologyLoading },
    ] = useMutation<
        UpdateReportMethodologyMutation,
        UpdateReportMethodologyMutationVariables
    >(
        UPDATE_REPORT_METHODOLOGY,
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
                    notify({ children: 'Methodology could not be updated!' });
                } else {
                    notify({ children: 'Methodology updated successfully!' });
                    if (onFormCancel) {
                        onFormCancel();
                    }
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
                notify({ children: 'Methodology could not be updated!' });
            },
        },
    );

    const handleSubmit = useCallback((finalValue: FormType) => {
        updateReportMethodology({
            variables: {
                report: finalValue as ReportMethodologyFormFields,
            },
        });
    }, [updateReportMethodology]);

    const loading = reportMethodologyLoading || updateReportMethodologyLoading;

    return (
        <form
            className={styles.methodologyForm}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <MarkdownEditor
                onChange={onValueChange}
                value={value.methodology}
                name="methodology"
                error={error?.fields?.methodology}
                disabled={loading}
            />
            {(value.methodology) && (
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
                        disabled={pristine || loading || !value.methodology}
                    >
                        Submit
                    </Button>
                </FormActions>
            )}
        </form>
    );
}

export default MethodologyUpdateForm;
