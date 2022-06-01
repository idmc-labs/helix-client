import React, { useCallback, useContext, useMemo } from 'react';
import {
    TextArea,
    Button,
} from '@togglecorp/toggle-ui';
import { isDefined } from '@togglecorp/fujs';
import { gql, useMutation } from '@apollo/client';
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
    CreateReviewCommentMutation,
    CreateReviewCommentMutationVariables,
} from '#generated/types';

import { getReviewInputMap, getReviewList } from '../../EntryForm/utils';
import { ReviewInputFields } from '../../EntryForm/types';
import styles from './styles.css';

export const CREATE_REVIEW_COMMENT = gql`
    mutation CreateReviewComment($data: ReviewCommentCreateInputType!) {
        createReviewComment(data: $data) {
            ok
            result {
                entry {
                    id
                    latestReviews {
                        age
                        field
                        id
                        figure {
                            id
                        }
                        geoLocation {
                            id
                        }
                        value
                        comment {
                            body
                            id
                            createdAt
                            createdBy {
                                id
                                fullName
                            }
                        }
                    }
                    reviewing {
                        id
                        status
                        createdAt
                        reviewer {
                            id
                            fullName
                        }
                    }
                }
            }
            errors
        }
    }
`;

type CommentFormFields = CreateReviewCommentMutationVariables['data'];
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
    entry: string;
    onSuccess: (value: ReviewInputFields) => void;
    review: ReviewInputFields,
}

function CommentForm(props: CommentFormProps) {
    const {
        entry,
        onSuccess,

        review,
    } = props;

    const dirtyReviews = useMemo(
        () => (
            Object.values(review)
                .filter(isDefined)
                .filter((item) => item.dirty)
        ),
        [review],
    );

    const {
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
    } = useForm(defaultFormValues, schema);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const clearForm = useCallback(() => {
        onValueChange(undefined, 'body' as const);
    }, [onValueChange]);

    const [
        createReviewComment,
        { loading: createCommentLoading },
    ] = useMutation<
        CreateReviewCommentMutation,
        CreateReviewCommentMutationVariables
    >(
        CREATE_REVIEW_COMMENT,
        {
            onCompleted: (response) => {
                const { createReviewComment: createReviewCommentRes } = response;
                if (!createReviewCommentRes) {
                    return;
                }

                const { errors, result } = createReviewCommentRes;

                if (errors) {
                    const createCommentError = transformToFormError(removeNull(errors));
                    onErrorSet(createCommentError);
                    notifyGQLError(errors);
                }
                if (result) {
                    const { entry: resEntry } = removeNull(result);
                    const prevReview = getReviewInputMap(
                        // FIXME: filtering by isDefined should not be necessary
                        resEntry?.latestReviews?.filter(isDefined).map((r) => ({
                            field: r.field,
                            figure: r.figure?.id,
                            geoLocation: r.geoLocation?.id,
                            age: r.age,
                            value: r.value,
                            comment: r.comment,
                        })),
                    );
                    notify({
                        children: 'Comment created successfully!',
                        variant: 'success',
                    });
                    clearForm();
                    onSuccess(prevReview);
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
        const reviewList = getReviewList(dirtyReviews);
        // FIXME: call handler so that comments can be re-fetched or do that refetching manually
        createReviewComment({
            variables: {
                data: {
                    body: finalValue.body,
                    entry,
                    reviews: reviewList.map((r) => ({
                        field: r.field,
                        figure: r.figure,
                        geoLocation: r.geoLocation,
                        age: r.age,
                        value: r.value,
                        entry,
                    })),
                },
            },
        });
    }, [createReviewComment, entry, dirtyReviews]);

    const loading = createCommentLoading;

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
                label="Review Comment *"
                name="body"
                onChange={onValueChange}
                value={value.body}
                disabled={loading}
                placeholder="Leave your comment here"
            />
            <FormActions className={styles.actions}>
                <Button
                    name={undefined}
                    onClick={clearForm}
                    disabled={loading || !value.body}
                >
                    Clear
                </Button>
                <Button
                    name={undefined}
                    variant="primary"
                    type="submit"
                    disabled={loading || !value.body}
                >
                    {
                        dirtyReviews.length > 0
                            ? `Submit (${dirtyReviews.length})`
                            : 'Submit'
                    }
                </Button>
            </FormActions>
        </form>
    );
}

export default CommentForm;
