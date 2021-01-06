import React, { useCallback, useContext } from 'react';
import {
    TextArea,
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

import { PartialForm, PurgeNull } from '#types';
import {
    CreateGeneralReviewCommentMutation,
    CreateGeneralReviewCommentMutationVariables,
    ReviewCommentQuery,
    UpdateReviewCommentMutation,
    UpdateReviewCommentMutationVariables,
} from '#generated/types';

import {
    CREATE_GENERAL_COMMENT,
    COMMENT,
    UPDATE_COMMENT,
} from './queries';
import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type CommentFormFields = CreateGeneralReviewCommentMutationVariables['data'];
type UpdateCommentFromFields = UpdateReviewCommentMutationVariables['data'];
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
    onRefetchEntries?: () => void;
    clearable?: boolean;
    cancelable?: boolean;
}

function CommentForm(props: CommentFormProps) {
    const {
        id,
        onCommentFormCancel,
        entry,
        onRefetchEntries,
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

    const { notify } = useContext(NotificationContext);

    const clearForm = useCallback(() => {
        onValueChange(undefined, 'body' as const);
    }, [onValueChange]);

    const {
        loading: commentLoading,
    } = useQuery<ReviewCommentQuery>(
        COMMENT,
        {
            skip: !id,
            variables: id ? { id } : undefined,
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
        createGeneralComment,
        { loading: createGeneralCommentLoading },
    ] = useMutation<
        CreateGeneralReviewCommentMutation,
        CreateGeneralReviewCommentMutationVariables
    >(
        CREATE_GENERAL_COMMENT,
        {
            update: onRefetchEntries,
            onCompleted: (response) => {
                const { createReviewComment: createReviewCommentRes } = response;
                if (!createReviewCommentRes) {
                    return;
                }
                const { errors } = createReviewCommentRes;
                if (errors) {
                    const createCommentError = transformToFormError(removeNull(errors));
                    onErrorSet(createCommentError);
                    notify({ children: 'Sorry, Comment could not be created!' });
                } else {
                    notify({ children: 'Comment created successfully!' });
                    clearForm();
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
                notify({ children: 'Sorry, Comment could not be created!' });
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
                    const updateCommentError = transformToFormError(removeNull(errors));
                    onErrorSet(updateCommentError);
                    notify({ children: 'Sorry, Comment could not be updated!' });
                } else {
                    notify({ children: 'Comment updated successfully!' });
                    clearForm();
                    if (onCommentFormCancel) {
                        onCommentFormCancel();
                    }
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
                notify({ children: 'Sorry, Comment could not be updated!' });
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
            createGeneralComment({
                variables: {
                    data: {
                        ...finalValue as CommentFormFields,
                        entry,
                    },
                },
            });
        }
    }, [createGeneralComment, entry, id, updateComment]);

    const loading = commentLoading || createGeneralCommentLoading || updateCommentLoading;

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
                label="Comment"
                name="body"
                onChange={onValueChange}
                value={value.body}
                disabled={loading}
            />
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
        </form>
    );
}

export default CommentForm;
