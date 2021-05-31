import React, { useCallback, useContext, useMemo } from 'react';
import {
    TextArea,
    Button,
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
import { useMutation, useQuery } from '@apollo/client';

import { transformToFormError } from '#utils/errorTransform';

import Row from '#components/Row';
import Loading from '#components/Loading';
import FormActions from '#components/FormActions';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';

import {
    CreateReportCommentMutation,
    CreateReportCommentMutationVariables,
    ReportCommentQuery,
    ReportCommentQueryVariables,
    UpdateReportCommentMutation,
    UpdateReportCommentMutationVariables,
} from '#generated/types';

import {
    CREATE_COMMENT,
    COMMENT,
    UPDATE_COMMENT,
} from '../queries';
import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type CommentFormFields = CreateReportCommentMutationVariables['data'];
type UpdateCommentFromFields = UpdateReportCommentMutationVariables['data'];
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
    report: string;
    onCommentCreate?: () => void;
    clearable?: boolean;
    cancelable?: boolean;
    minimal?: boolean;
}

function CommentForm(props: CommentFormProps) {
    const {
        id,
        onCommentFormCancel,
        report,
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

    const commentFormVariables = useMemo(
        (): ReportCommentQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: commentLoading,
    } = useQuery<ReportCommentQuery>(
        COMMENT,
        {
            skip: !commentFormVariables,
            variables: commentFormVariables,
            onCompleted: (response) => {
                const { reportComment } = response;
                if (!reportComment) {
                    return;
                }
                onValueSet(removeNull({ ...reportComment }));
            },
        },
    );

    const [
        createComment,
        { loading: createCommentLoading },
    ] = useMutation<
        CreateReportCommentMutation,
        CreateReportCommentMutationVariables
    >(
        CREATE_COMMENT,
        {
            update: onCommentCreate,
            onCompleted: (response) => {
                const { createReportComment: createReportCommentRes } = response;
                if (!createReportCommentRes) {
                    return;
                }
                const { errors } = createReportCommentRes;
                if (errors) {
                    const createReportCommentError = transformToFormError(removeNull(errors));
                    onErrorSet(createReportCommentError);
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
        UpdateReportCommentMutation,
        UpdateReportCommentMutationVariables
    >(
        UPDATE_COMMENT,
        {
            onCompleted: (response) => {
                const { updateReportComment: updateReportCommentRes } = response;
                if (!updateReportCommentRes) {
                    return;
                }
                const { errors } = updateReportCommentRes;
                if (errors) {
                    const updateReportCommentError = transformToFormError(removeNull(errors));
                    onErrorSet(updateReportCommentError);
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
                        report,
                    },
                },
            });
        }
    }, [createComment, report, id, updateComment]);

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
            <Row>
                <TextArea
                    label="Comment"
                    name="body"
                    onChange={onValueChange}
                    value={value.body}
                    disabled={loading}
                    placeholder="Leave your comment here"
                />
            </Row>
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
