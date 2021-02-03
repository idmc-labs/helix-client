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
    CreateContextualUpdateMutation,
    CreateContextualUpdateMutationVariables,
} from '#generated/types';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import MarkdownEditor from '#components/MarkdownEditor';
import Row from '#components/EntryForm/Row';
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

const CREATE_CONTEXTUAL_UPDATE = gql`
    mutation CreateContextualUpdate($input: ContextualUpdateCreateInputType!) {
        createContextualUpdate(data: $input) {
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

type ContextualUpdateFields = CreateContextualUpdateMutationVariables['input'];
type FormType = PurgeNull<PartialForm<Omit<ContextualUpdateFields, 'crisisType'> & { crisisType: string }>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

type ContextualUpdate = NonNullable<CountryQuery['country']>['lastContextualUpdate'];

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        update: [requiredCondition],
        country: [requiredCondition],
        crisisType: [requiredCondition],
        publishDate: [],
    }),
};

interface ContextualUpdateProps {
    country: string;
    onContextualUpdateFormClose: () => void;
    onAddNewContextualUpdateInCache: MutationUpdaterFn<CreateContextualUpdateMutation>;
    contextualUpdate: ContextualUpdate;
}

function ContextualUpdate(props:ContextualUpdateProps) {
    const {
        country,
        onAddNewContextualUpdateInCache,
        onContextualUpdateFormClose,
        contextualUpdate,
    } = props;

    const {
        data: crisisTypeOptions,
        loading: crisisTypeOptionsLoading,
        error: crisisTypeOptionsError,
    } = useQuery<CrisisTypeOptionsQuery>(CRISIS_TYPE_OPTIONS);

    const defaultFormValues: PartialForm<FormType> = useMemo(
        () => (removeNull({
            update: contextualUpdate?.update,
            country,
            crisisType: contextualUpdate?.crisisType,
            publishDate: contextualUpdate?.publishDate,
        })),
        [
            contextualUpdate?.update,
            contextualUpdate?.crisisType,
            contextualUpdate?.publishDate,
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
        createContextualUpdate,
        { loading },
    ] = useMutation<CreateContextualUpdateMutation, CreateContextualUpdateMutationVariables>(
        CREATE_CONTEXTUAL_UPDATE,
        {
            update: onAddNewContextualUpdateInCache,
            onCompleted: (response) => {
                const { createContextualUpdate: createContextualUpdateRes } = response;
                if (!createContextualUpdateRes) {
                    return;
                }
                const { errors, result } = createContextualUpdateRes;
                if (errors) {
                    const createContextualUpdateError = transformToFormError(removeNull(errors));
                    notify({ children: 'Failed to update Contextual update' });
                    onErrorSet(createContextualUpdateError);
                }
                if (result) {
                    notify({ children: 'Contextual update updated successfully!' });
                    onPristineSet(true);
                    onContextualUpdateFormClose();
                }
            },
            onError: (createContextualUpdateError) => {
                notify({ children: 'Failed to update Contextual update' });
                onErrorSet({
                    $internal: createContextualUpdateError.message,
                });
            },
        },
    );

    const handleSubmit = React.useCallback(
        (finalValues: PartialForm<FormType>) => {
            createContextualUpdate({
                variables: {
                    input: finalValues as ContextualUpdateFields,
                },
            });
        },
        [createContextualUpdate],
    );

    const disabled = crisisTypeOptionsLoading || !!crisisTypeOptionsError;

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
                    label="Crisis Type *"
                    name="crisisType"
                    value={value.crisisType}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.crisisType}
                    disabled={disabled}
                />
            </Row>
            <Row>
                <DateInput
                    label="Publish Date"
                    value={value.publishDate}
                    onChange={onValueChange}
                    name="publishDate"
                    error={error?.fields?.publishDate}
                    disabled={disabled}
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
                    onClick={onContextualUpdateFormClose}
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

export default ContextualUpdate;
