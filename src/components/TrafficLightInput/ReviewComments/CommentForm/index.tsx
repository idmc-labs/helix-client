import React, { useCallback, useContext, useMemo } from 'react';
import {
    TextArea,
    Button,
    RadioInput,
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
import { gql, useMutation, useQuery } from '@apollo/client';
import { isDefined } from '@togglecorp/fujs';

import { transformToFormError } from '#utils/errorTransform';
import Loading from '#components/Loading';
import FormActions from '#components/FormActions';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';

import {
    CreateReviewCommentMutation,
    CreateReviewCommentMutationVariables,
    ReviewCommentQuery,
    ReviewCommentQueryVariables,
    UpdateReviewCommentMutation,
    UpdateReviewCommentMutationVariables,
    Review_Field_Type as ReviewFieldType,
} from '#generated/types';
import { WithId } from '#utils/common';

import styles from './styles.css';

const colors = [
    {
        key: 'RED',
        label: 'Red',
    },
    {
        key: 'GREEN',
        label: 'Green',
    },
    {
        key: 'GREY',
        label: 'Grey',
    },
];

const COMMENT = gql`
    query ReviewComment($id: ID!) {
        reviewComment(id: $id) {
            id
            comment
            commentType
        }
    }
`;

const CREATE_COMMENT = gql`
    mutation CreateReviewComment($data: UnifiedReviewCommentCreateInputType!) {
        createReviewComment(data: $data) {
            ok
            result {
                id
                createdBy {
                    id
                    fullName
                }
                createdAt
            }
            errors
        }
    }
`;

const UPDATE_COMMENT = gql`
    mutation UpdateReviewComment($data: UnifiedReviewCommentUpdateInputType!) {
        updateReviewComment(data: $data) {
            ok
            result {
                commentType
                comment
                id
                isEdited
                createdBy {
                    id
                    fullName
                }
                createdAt
            }
            errors
        }
    }
`;

type CommentFormFields = CreateReviewCommentMutationVariables['data'];
type UpdateCommentFromFields = UpdateReviewCommentMutationVariables['data'];
type FormType = PurgeNull<PartialForm<WithId<CommentFormFields>>>;
type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        comment: [requiredStringCondition],
        commentType: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface CommentFormProps {
    name: ReviewFieldType;
    geoLocationId?: string;
    eventId?: string;
    figureId?: string;

    id?: string;
    onCommentFormCancel?: () => void;
    onCommentCreate?: () => void;
    clearable?: boolean;
    cancelable?: boolean;
}

function CommentForm(props: CommentFormProps) {
    const {
        name,
        geoLocationId,
        eventId,
        figureId,
        id,
        onCommentFormCancel,
        onCommentCreate,
        clearable,
        cancelable,
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

    const clearForm = useCallback(() => {
        onValueChange(undefined, 'comment' as const);
    }, [onValueChange]);

    const commentFormVariables = useMemo(
        (): ReviewCommentQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: commentLoading,
    } = useQuery<ReviewCommentQuery>(
        COMMENT,
        {
            skip: !commentFormVariables,
            variables: commentFormVariables,
            onCompleted: (response) => {
                const { reviewComment } = response;
                if (!reviewComment) {
                    return;
                }
                onValueSet(removeNull({ ...reviewComment }));
            },
        },
    );

    const [
        createComment,
        { loading: createCommentLoading },
    ] = useMutation<
        CreateReviewCommentMutation,
        CreateReviewCommentMutationVariables
    >(
        CREATE_COMMENT,
        {
            update: onCommentCreate,
            onCompleted: (response) => {
                const { createReviewComment: createReviewCommentRes } = response;
                if (!createReviewCommentRes) {
                    return;
                }
                const { errors } = createReviewCommentRes;
                if (errors) {
                    const createReviewCommentError = transformToFormError(removeNull(errors));
                    onErrorSet(createReviewCommentError);
                    notifyGQLError(errors);
                } else {
                    notify({
                        children: 'Comment created successfully!',
                        variant: 'success',
                    });
                    clearForm();
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
        updateComment,
        { loading: updateCommentLoading },
    ] = useMutation<
        UpdateReviewCommentMutation,
        UpdateReviewCommentMutationVariables
    >(
        UPDATE_COMMENT,
        {
            onCompleted: (response) => {
                const { updateReviewComment: updateReviewCommentRes } = response;
                if (!updateReviewCommentRes) {
                    return;
                }
                const { errors } = updateReviewCommentRes;
                if (errors) {
                    const updateReviewCommentError = transformToFormError(removeNull(errors));
                    onErrorSet(updateReviewCommentError);
                    notifyGQLError(errors);
                } else {
                    notify({
                        children: 'Comment updated successfully!',
                        variant: 'success',
                    });
                    clearForm();
                    if (onCommentFormCancel) {
                        onCommentFormCancel();
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
        if (id) {
            updateComment({
                variables: {
                    data: {
                        ...finalValue,
                        // NOTE: commentType shouldn't be updated
                        commentType: undefined,
                    } as UpdateCommentFromFields,
                },
            });
        } else {
            createComment({
                variables: {
                    data: {
                        ...finalValue as CommentFormFields,
                        geoLocation: geoLocationId,
                        event: eventId,
                        figure: figureId,
                        field: name,
                    },
                },
            });
        }
    }, [createComment, geoLocationId, eventId, figureId, name, id, updateComment]);

    const handleCommentTypeChange = useCallback((checked) => {
        onValueChange(checked, 'commentType');
    }, [onValueChange]);

    const editMode = isDefined(id);
    const loading = commentLoading || createCommentLoading || updateCommentLoading;

    return (
        <form
            className={styles.commentForm}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <TextArea
                label="Comment *"
                name="comment"
                onChange={onValueChange}
                value={value.comment}
                disabled={loading}
                placeholder="Leave your comment here"
            />
            {!editMode && (
                <RadioInput
                    listContainerClassName={styles.radioInput}
                    name="commentType"
                    keySelector={(d) => d.key}
                    labelSelector={(d) => d.label}
                    value={value.commentType}
                    onChange={handleCommentTypeChange}
                    options={colors}
                />
            )}

            <FormActions className={styles.actions}>
                {clearable && (
                    <Button
                        name={undefined}
                        onClick={clearForm}
                        disabled={loading || !value.comment}
                    >
                        Clear
                    </Button>
                )}
                {cancelable && (
                    <Button
                        name={undefined}
                        onClick={onCommentFormCancel}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    name={undefined}
                    variant="primary"
                    type="submit"
                    disabled={pristine || loading || !value.comment}
                >
                    Submit
                </Button>
            </FormActions>
        </form>
    );
}

export default CommentForm;
