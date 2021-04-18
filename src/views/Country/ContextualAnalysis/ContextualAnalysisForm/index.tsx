import React, { useMemo, useContext } from 'react';
import {
    Button,
    SelectInput,
    DateInput,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
    useMutation,
    MutationUpdaterFn,
} from '@apollo/client';

import useForm, { createSubmitHandler } from '#utils/form';
import type { ObjectSchema } from '#utils/schema';
import { removeNull } from '#utils/schema';
import { transformToFormError } from '#utils/errorTransform';
import { requiredCondition } from '#utils/validation';

import {
    PartialForm,
    PurgeNull,
} from '#types';

import {
    enumKeySelector,
    enumLabelSelector,
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
import Row from '#components/Row';
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
type FormType = PurgeNull<PartialForm<Omit<ContextualAnalysisFields, 'crisisType'> & { crisisType: string }>>;

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

    const { notify } = useContext(NotificationContext);

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
                    notify({ children: 'Failed to update Contextual Analysis' });
                    onErrorSet(createContextualAnalysisError);
                }
                if (result) {
                    notify({ children: 'Contextual Analysis updated successfully!' });
                    onPristineSet(true);
                    onContextualAnalysisFormClose();
                }
            },
            onError: (createContextualAnalysisError) => {
                notify({ children: 'Failed to update Contextual Analysis' });
                onErrorSet({
                    $internal: createContextualAnalysisError.message,
                });
            },
        },
    );

    const handleSubmit = React.useCallback(
        (finalValues: PartialForm<FormType>) => {
            createContextualAnalysis({
                variables: {
                    input: finalValues as ContextualAnalysisFields,
                },
            });
        },
        [createContextualAnalysis],
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
            <Row>
                <SelectInput
                    options={crisisTypeOptions?.crisisType?.enumValues}
                    label="Cause *"
                    name="crisisType"
                    value={value.crisisType}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.crisisType}
                    disabled={crisisTypeOptionsLoading}
                />
            </Row>
            <Row>
                <DateInput
                    label="Publish Date"
                    value={value.publishDate}
                    onChange={onValueChange}
                    name="publishDate"
                    error={error?.fields?.publishDate}
                    disabled={loading}
                />
            </Row>
            <Row>
                <MarkdownEditor
                    onChange={onValueChange}
                    value={value.update}
                    name="update"
                    error={error?.fields?.update}
                    disabled={loading}
                />
            </Row>
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onContextualAnalysisFormClose}
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

export default ContextualAnalysis;
