import React, { useCallback, useContext, useMemo } from 'react';
import {
    TextArea,
    Button,
} from '@togglecorp/toggle-ui';
import { gql, useMutation, useQuery } from '@apollo/client';
import {
    removeNull,
    ObjectSchema,
    useForm,
    createSubmitHandler,
    requiredStringCondition,
    idCondition,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';

import { transformToFormError } from '#utils/errorTransform';

import Loading from '#components/Loading';
import FormActions from '#components/FormActions';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';

import { WithId } from '#utils/common';
import {
    CreateCommentMutation,
    CreateCommentMutationVariables,
    ReviewCommentQuery,
    ReviewCommentQueryVariables,
    UpdateCommentMutation,
    UpdateCommentMutationVariables,
} from '#generated/types';

import styles from './styles.css';

const COMMENT = gql`
    query ReviewComment($id: ID!) {
        reviewComment(id: $id) {
            id
            body
        }
    }
`;
const CREATE_COMMENT = gql`
    mutation CreateComment($data: CommentCreateInputType!){
        createComment(data: $data) {
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
    mutation UpdateComment($data: CommentUpdateInputType!){
        updateComment(data: $data) {
            ok
            result {
                body
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

type CommentFormFields = CreateCommentMutationVariables['data'];
type UpdateCommentFromFields = UpdateCommentMutationVariables['data'];
type FormType = PurgeNull<PartialForm<WithId<CommentFormFields>>>;
type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        body: [requiredStringCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface CommentFormProps {
    id?: string;
    onCommentFormCancel?: () => void;
    entry: string;
    onCommentCreate?: () => void;
    clearable?: boolean;
    cancelable?: boolean;
    minimal?: boolean;
}

function CommentForm(props: CommentFormProps) {
    const {
        id,
        onCommentFormCancel,
        entry,
        onCommentCreate,
        clearable,
        cancelable,
        minimal,
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
        onValueChange(undefined, 'body' as const);
    }, [onValueChange]);

    const reviewVariables = useMemo(
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
            skip: !reviewVariables,
            variables: reviewVariables,
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
        CreateCommentMutation,
        CreateCommentMutationVariables
    >(
        CREATE_COMMENT,
        {
            update: onCommentCreate,
            onCompleted: (response) => {
                const { createComment: createCommentRes } = response;
                if (!createCommentRes) {
                    return;
                }
                const { errors } = createCommentRes;
                if (errors) {
                    const createCommentError = transformToFormError(removeNull(errors));
                    onErrorSet(createCommentError);
                    notifyGQLError(errors);
                } else {
                    notify({ children: 'Comment created successfully!' });
                    clearForm();
                }
            },
            onError: (errors) => {
                notify({ children: errors.message });
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
        UpdateCommentMutation,
        UpdateCommentMutationVariables
    >(
        UPDATE_COMMENT,
        {
            onCompleted: (response) => {
                const { updateComment: updateCommentRes } = response;
                if (!updateCommentRes) {
                    return;
                }
                const { errors } = updateCommentRes;
                if (errors) {
                    const updateCommentError = transformToFormError(removeNull(errors));
                    onErrorSet(updateCommentError);
                    notifyGQLError(errors);
                } else {
                    notify({ children: 'Comment updated successfully!' });
                    clearForm();
                    if (onCommentFormCancel) {
                        onCommentFormCancel();
                    }
                }
            },
            onError: (errors) => {
                notify({ children: errors.message });
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
                    data: finalValue as UpdateCommentFromFields,
                },
            });
        } else {
            createComment({
                variables: {
                    data: {
                        ...finalValue as CommentFormFields,
                        entry,
                    },
                },
            });
        }
    }, [createComment, entry, id, updateComment]);

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
                name="body"
                onChange={onValueChange}
                value={value.body}
                disabled={loading}
                placeholder="Leave your comment here"
            />
            {(!minimal || value.body) && (
                <FormActions className={styles.actions}>
                    {clearable && (
                        <Button
                            name={undefined}
                            onClick={clearForm}
                            disabled={loading || !value.body}
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
                        disabled={pristine || loading || !value.body}
                    >
                        Submit
                    </Button>
                </FormActions>
            )}
        </form>
    );
}

export default CommentForm;
