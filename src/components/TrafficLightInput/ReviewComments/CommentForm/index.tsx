import React, {
    useCallback,
    useContext,
    useMemo,
    Dispatch,
    SetStateAction,
} from 'react';
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
import { EventListOption } from '#components/selections/EventListSelectInput';
import {
    FigureMetadata,
} from '#components/forms/EntryForm/types';
import {
    WithId,
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';
import { EVENT_FRAGMENT } from '#components/forms/EntryForm/queries';

import styles from './styles.css';

const colors = [
    {
        name: 'RED' as const,
        description: 'Red - Submit feedback that should be addressed',
    },
    {
        name: 'GREEN' as const,
        description: 'Green - Submit feedback and approve this field',
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
    ${EVENT_FRAGMENT}
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

                # When comment is updated, the figure review status and
                # lastReviewCommentStatus will change
                figure {
                    id
                    uuid
                    reviewStatusDisplay
                    reviewStatus
                    lastReviewCommentStatus {
                        id
                        field
                        commentType
                    }
                    event {
                        ...EventResponse
                    }
                }
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
        comment: [],
        commentType: [],
    }),
};

const defaultFormValuesForAssignee: PartialForm<FormType> = {
    commentType: 'GREEN',
};

const defaultFormValuesForNonAssignee: PartialForm<FormType> = {
    commentType: 'GREY',
};

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
    assigneeMode?: boolean;

    setEvents: Dispatch<SetStateAction<EventListOption[] | null | undefined>>;
    setFigureMetadata: (
        value: FigureMetadata
            | ((oldValue: FigureMetadata | undefined) => FigureMetadata)
            | undefined,
        key: string,
    ) => void;
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
        assigneeMode,
        setEvents,
        setFigureMetadata,
    } = props;

    const {
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
        onValueSet,
    } = useForm(
        assigneeMode
            ? defaultFormValuesForAssignee
            : defaultFormValuesForNonAssignee,
        schema,
    );

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
                const { result, errors } = createReviewCommentRes;
                if (errors) {
                    const createReviewCommentError = transformToFormError(removeNull(errors));
                    onErrorSet(createReviewCommentError);
                    notifyGQLError(errors);
                    return;
                }
                if (result) {
                    const { figure } = result;
                    if (figure) {
                        setEvents([figure.event]);
                        setFigureMetadata((oldValue) => ({
                            role: oldValue?.role,
                            fieldStatuses: figure.lastReviewCommentStatus,
                            reviewStatus: figure.reviewStatus,
                        }), figure.uuid);
                    }
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
                name="comment"
                onChange={onValueChange}
                value={value.comment}
                disabled={loading}
                placeholder="Leave your comment here"
            />
            {!editMode && assigneeMode && (
                <RadioInput
                    listContainerClassName={styles.radioInput}
                    name="commentType"
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    value={value.commentType}
                    onChange={onValueChange}
                    options={colors}
                />
            )}
            <FormActions>
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
                    disabled={loading || (value.commentType !== 'GREEN' && !value.comment)}
                >
                    Submit
                </Button>
            </FormActions>
        </form>
    );
}

export default CommentForm;
