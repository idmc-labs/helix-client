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
    ReportChallengesQuery,
    ReportChallengesQueryVariables,
    UpdateReportChallengesMutation,
    UpdateReportChallengesMutationVariables,
} from '#generated/types';

import {
    FETCH_REPORT_CHALLENGES,
    UPDATE_REPORT_CHALLENGES,
} from '../query';
import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type ReportChallengesFormFields = UpdateReportChallengesMutationVariables['report'];
type FormType = PurgeNull<PartialForm<WithId<ReportChallengesFormFields>>>;
type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        challenges: [requiredStringCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface UpdateReportChallengesProps {
    id?: string;
    onFormCancel?: () => void;
}

function ChallengesUpdateForm(props: UpdateReportChallengesProps) {
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

    const challengeVariables = useMemo(
        (): ReportChallengesQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: reportChallengesLoading,
    } = useQuery<ReportChallengesQuery>(
        FETCH_REPORT_CHALLENGES,
        {
            skip: !challengeVariables,
            variables: challengeVariables,
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
        updateReportChallenges,
        { loading: updateReportChallengesLoading },
    ] = useMutation<
        UpdateReportChallengesMutation,
        UpdateReportChallengesMutationVariables
    >(
        UPDATE_REPORT_CHALLENGES,
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
                    notify({ children: 'Challenges could not be updated!' });
                } else {
                    notify({ children: 'Challenges updated successfully!' });
                    if (onFormCancel) {
                        onFormCancel();
                    }
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
                notify({ children: 'Challenges could not be updated!' });
            },
        },
    );

    const handleSubmit = useCallback((finalValue: FormType) => {
        updateReportChallenges({
            variables: {
                report: finalValue as ReportChallengesFormFields,
            },
        });
    }, [updateReportChallenges]);

    const loading = reportChallengesLoading || updateReportChallengesLoading;

    return (
        <form
            className={styles.challengesForm}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <MarkdownEditor
                onChange={onValueChange}
                value={value.challenges}
                name="challenges"
                error={error?.fields?.challenges}
                disabled={loading}
            />
            {(value.challenges) && (
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
                        disabled={pristine || loading || !value.challenges}
                    >
                        Submit
                    </Button>
                </FormActions>
            )}
        </form>
    );
}

export default ChallengesUpdateForm;
