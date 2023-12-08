import React, { useMemo, useContext, useCallback } from 'react';
import {
    Button,
    SelectInput,
    DateInput,
} from '@togglecorp/toggle-ui';
import {
    removeNull,
    ObjectSchema,
    useForm,
    createSubmitHandler,
    requiredCondition,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';
import {
    gql,
    useQuery,
    useMutation,
    MutationUpdaterFn,
} from '@apollo/client';

import { transformToFormError } from '#utils/errorTransform';

import {
    enumKeySelector,
    enumLabelSelector,
    GetEnumOptions,
} from '#utils/common';

import {
    CountryQuery,
    CrisisTypeOptionsQuery,
    CreateContextualAnalysisMutation,
    CreateContextualAnalysisMutationVariables,
} from '#generated/types';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import MarkdownEditor from '#components/MarkdownEditor';
import Loading from '#components/Loading';

import styles from './styles.css';

const CRISIS_TYPE_OPTIONS = gql`
    query CrisisTypeOptions {
        crisisType: __type(name: "CRISIS_TYPE") {
            name
            enumValues {
                name
                description
            }
        }
    }
`;

const CREATE_CONTEXTUAL_ANALYSIS = gql`
    mutation CreateContextualAnalysis($input: ContextualAnalysisCreateInputType!) {
        createContextualAnalysis(data: $input) {
            errors
            result {
                id
                update
                createdAt
                publishDate
                crisisType
            }
        }
    }
`;

type ContextualAnalysisFields = CreateContextualAnalysisMutationVariables['input'];
type FormType = PurgeNull<PartialForm<ContextualAnalysisFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

type ContextualAnalysis = NonNullable<CountryQuery['country']>['lastContextualAnalysis'];

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        update: [requiredCondition],
        country: [requiredCondition],
        crisisType: [requiredCondition],
        publishDate: [],
    }),
};

interface ContextualAnalysisProps {
    country: string;
    onContextualAnalysisFormClose: () => void;
    onAddNewContextualAnalysisInCache: MutationUpdaterFn<CreateContextualAnalysisMutation>;
    contextualAnalysis: ContextualAnalysis;
}

function ContextualAnalysis(props:ContextualAnalysisProps) {
    const {
        country,
        onAddNewContextualAnalysisInCache,
        onContextualAnalysisFormClose,
        contextualAnalysis,
    } = props;

    const {
        data: crisisTypeOptions,
        loading: crisisTypeOptionsLoading,
    } = useQuery<CrisisTypeOptionsQuery>(CRISIS_TYPE_OPTIONS);

    const defaultFormValues: PartialForm<FormType> = useMemo(
        () => (removeNull({
            update: contextualAnalysis?.update,
            country,
            crisisType: contextualAnalysis?.crisisType,
            publishDate: contextualAnalysis?.publishDate,
        })),
        [
            contextualAnalysis?.update,
            contextualAnalysis?.crisisType,
            contextualAnalysis?.publishDate,
            country,
        ],
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
        createContextualAnalysis,
        { loading },
    ] = useMutation<CreateContextualAnalysisMutation, CreateContextualAnalysisMutationVariables>(
        CREATE_CONTEXTUAL_ANALYSIS,
        {
            update: onAddNewContextualAnalysisInCache,
            onCompleted: (response) => {
                const { createContextualAnalysis: createContextualAnalysisRes } = response;
                if (!createContextualAnalysisRes) {
                    return;
                }
                const { errors, result } = createContextualAnalysisRes;
                if (errors) {
                    const createContextualAnalysisError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(createContextualAnalysisError);
                }
                if (result) {
                    notify({
                        children: 'Contextual Analysis updated successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onContextualAnalysisFormClose();
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

    const handleSubmit = useCallback(
        (finalValues: PartialForm<FormType>) => {
            createContextualAnalysis({
                variables: {
                    input: finalValues as ContextualAnalysisFields,
                },
            });
        },
        [createContextualAnalysis],
    );

    const crisisTypes = crisisTypeOptions?.crisisType?.enumValues;
    type CrisisTypeOptions = GetEnumOptions<
        typeof crisisTypes,
        NonNullable<typeof value.crisisType>
    >;

    return (
        <form
            className={styles.form}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <SelectInput
                options={crisisTypes as CrisisTypeOptions}
                label="Cause *"
                name="crisisType"
                value={value.crisisType}
                onChange={onValueChange}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                error={error?.fields?.crisisType}
                disabled={crisisTypeOptionsLoading}
                autoFocus
            />
            <DateInput
                label="Publish Date"
                value={value.publishDate}
                onChange={onValueChange}
                name="publishDate"
                error={error?.fields?.publishDate}
                disabled={loading}
            />
            <MarkdownEditor
                onChange={onValueChange}
                value={value.update}
                name="update"
                error={error?.fields?.update}
                disabled={loading}
            />
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onContextualAnalysisFormClose}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    name={undefined}
                    disabled={loading || pristine}
                    variant="primary"
                >
                    Submit
                </Button>
            </div>
        </form>
    );
}

export default ContextualAnalysis;
