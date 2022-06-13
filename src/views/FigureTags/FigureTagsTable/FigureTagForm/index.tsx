import React, { useContext, useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    TextInput,
    Button,
} from '@togglecorp/toggle-ui';
import {
    PartialForm,
    PurgeNull,
    useForm,
    ObjectSchema,
    createSubmitHandler,
    removeNull,
    requiredCondition,
    idCondition,
} from '@togglecorp/toggle-form';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import { EnumFix, WithId } from '#utils/common';

import { transformToFormError } from '#utils/errorTransform';

import {
    FigureTagQuery,
    FigureTagQueryVariables,
    CreateFigureTagMutation,
    CreateFigureTagMutationVariables,
    UpdateFigureTagMutation,
    UpdateFigureTagMutationVariables,
} from '#generated/types';
import styles from './styles.css';

const FIGURE_TAG = gql`
    query FigureTag($id: ID!) {
        figureTag(id: $id) {
            id
            name
        }
    }
`;

const CREATE_FIGURE_TAG = gql`
    mutation CreateFigureTag($figureTag: FigureTagCreateInputType!) {
        createFigureTag(data: $figureTag) {
            result {
                id
            }
            errors
        }
    }
`;

const UPDATE_FIGURE_TAG = gql`
    mutation UpdateFigureTag($figureTag: FigureTagUpdateInputType!) {
        updateFigureTag(data: $figureTag) {
            result {
                id
            }
            errors
        }
    }
`;

type FigureTagFormFields = CreateFigureTagMutationVariables['figureTag'];
type FormType = PurgeNull<PartialForm<WithId<EnumFix<FigureTagFormFields, 'status'>>>>;

type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        name: [requiredCondition],
    }),
};

interface FigureTagFormProps {
    className?: string;
    onCreate?: (result: NonNullable<NonNullable<CreateFigureTagMutation['createFigureTag']>['result']>) => void;
    id?: string;
    readOnly?: boolean;
    onFormCancel: () => void;
}

function FigureTagForm(props: FigureTagFormProps) {
    const {
        onCreate,
        id,
        readOnly,
        className,
        onFormCancel,
    } = props;

    const defaultFormValues: PartialForm<FormType> = {};

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
        onPristineSet,
    } = useForm(defaultFormValues, schema);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const figureTagVariables = useMemo(
        (): FigureTagQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: figureTagDataLoading,
        error: figureTagDataError,
    } = useQuery<FigureTagQuery, FigureTagQueryVariables>(
        FIGURE_TAG,
        {
            skip: !figureTagVariables,
            variables: figureTagVariables,
            onCompleted: (response) => {
                const { figureTag } = response;
                if (!figureTag) {
                    return;
                }

                onValueSet(removeNull({
                    ...figureTag,
                }));
            },
        },
    );

    const [
        createFigureTag,
        { loading: createLoading },
    ] = useMutation<CreateFigureTagMutation, CreateFigureTagMutationVariables>(
        CREATE_FIGURE_TAG,
        {
            onCompleted: (response) => {
                const {
                    createFigureTag: createFigureTagRes,
                } = response;
                if (!createFigureTagRes) {
                    return;
                }
                const { errors, result } = createFigureTagRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (onCreate && result) {
                    notify({
                        children: 'Tag created successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onCreate(result);
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

    const [
        updateFigureTag,
        { loading: updateLoading },
    ] = useMutation<UpdateFigureTagMutation, UpdateFigureTagMutationVariables>(
        UPDATE_FIGURE_TAG,
        {
            onCompleted: (response) => {
                const {
                    updateFigureTag: updateFigureTagRes,
                } = response;
                if (!updateFigureTagRes) {
                    return;
                }
                const { errors, result } = updateFigureTagRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (onCreate && result) {
                    notify({
                        children: 'Tag updated successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onCreate(result);
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

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        if (finalValues.id) {
            updateFigureTag({
                variables: {
                    figureTag: finalValues as WithId<FigureTagFormFields>,
                },
            });
        } else {
            createFigureTag({
                variables: {
                    figureTag: finalValues as FigureTagFormFields,
                },
            });
        }
    }, [createFigureTag, updateFigureTag]);

    const loading = createLoading || updateLoading || figureTagDataLoading;
    const errored = !!figureTagDataError;
    const disabled = loading || errored;

    return (
        <form
            className={_cs(className, styles.figureTagForm)}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <TextInput
                label="Name *"
                name="name"
                value={value.name}
                onChange={onValueChange}
                error={error?.fields?.name}
                disabled={disabled}
                readOnly={readOnly}
                autoFocus
            />
            {!readOnly && (
                <div className={styles.formButtons}>
                    {!!onFormCancel && (
                        <Button
                            name={undefined}
                            onClick={onFormCancel}
                            className={styles.button}
                            disabled={disabled}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        name={undefined}
                        disabled={disabled || pristine}
                        variant="primary"
                        className={styles.button}
                    >
                        Submit
                    </Button>
                </div>
            )}
        </form>
    );
}

export default FigureTagForm;
