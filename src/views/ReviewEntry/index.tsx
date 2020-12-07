import React, { useState } from 'react';
import { useParams, Prompt } from 'react-router-dom';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    gql,
    useMutation,
} from '@apollo/client';
import {
    Button,
    Tabs,
    TabList,
    Tab,
    TabPanel,
    TextArea,
    Avatar,
} from '@togglecorp/toggle-ui';

import {
    CreateReviewCommentMutation,
    CreateReviewCommentMutationVariables,
} from '#generated/types';

import { getReviewList } from '#components/EntryForm/utils';
import ButtonLikeLink from '#components/ButtonLikeLink';
import PageHeader from '#components/PageHeader';
import NotificationContext from '#components/NotificationContext';
import EntryForm from '#components/EntryForm';
import UrlPreview from '#components/UrlPreview';
import DateCell from '#components/tableHelpers/Date';

import {
    PartialForm,
} from '#types';
import {
    FormValues,
    Attachment,
    Preview,
    ReviewInputFields,
    CommentFields,
    EntryReviewStatus,
} from '#components/EntryForm/types';

import route from '#config/routes';
import styles from './styles.css';

export const CREATE_REVIEW_COMMENT = gql`
    mutation CreateReviewComment($data: ReviewCommentCreateInputType!){
        createReviewComment(data: $data) {
            ok
            errors {
                arrayErrors {
                    key
                    messages
                    objectErrors {
                        field
                        messages
                    }
                }
                field
                messages
                objectErrors {
                    field
                    messages
                }
            }
        }
    }
`;

export const REVIEW_LIST = gql`
    query ReviewList($entry: ID!) {
        reviewList(entry: $entry) {
            results {
                field
                ageId
                strataId
                value
                figure {
                    id
                }
            }
        }
    }
`;

interface ReviewEntryProps {
    className?: string;
}

type PartialFormValues = PartialForm<FormValues>;

function ReviewEntry(props: ReviewEntryProps) {
    const { className } = props;
    const entryFormRef = React.useRef<HTMLFormElement>(null);
    const [, setEntryValue] = useState<PartialFormValues>();
    const [pristine, setPristine] = useState(true);
    const [submitPending, setSubmitPending] = useState<boolean>(false);
    const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
    const [preview, setPreview] = useState<Preview | undefined>(undefined);
    const [activeTab, setActiveTab] = React.useState<'comments' | 'preview'>('comments');
    const [review, setReview] = React.useState<ReviewInputFields>({});
    const [commentList, setCommentList] = React.useState<CommentFields[]>([]);
    const [comment, setComment] = React.useState<string | undefined>();

    const { entryId } = useParams<{ entryId: string }>();
    const { notify } = React.useContext(NotificationContext);

    const handleReviewChange = React.useCallback(
        (newValue: EntryReviewStatus, name: string) => {
            setReview((oldReview) => ({
                ...oldReview,
                [name]: {
                    ...oldReview[name],
                    value: newValue,
                    dirty: true,
                    key: name,
                },
            }));
            setPristine(false);
        },
        [setReview, setPristine],
    );

    const handleCommentInputChange = React.useCallback(
        (newComment: string | undefined) => {
            setComment(newComment);
            setPristine(false);
        },
        [setPristine, setComment],
    );

    const [createReviewComment] = useMutation<
        CreateReviewCommentMutation,
        CreateReviewCommentMutationVariables
    >(CREATE_REVIEW_COMMENT, {
        onCompleted: (response) => {
            if (response?.createReviewComment?.ok) {
                notify({ children: 'Review submitted successfully' });
                setPristine(true);
                setComment(undefined);
            } else {
                console.error(response);
                notify({ children: 'Failed to submit review' });
            }
        },
    });

    // FIXME: use memo
    const dirtyReviews = Object.values(review)
        .filter(isDefined)
        .filter((item) => item.dirty);

    const handleSubmitReviewButtonClick = React.useCallback(() => {
        const reviewList = getReviewList(dirtyReviews);

        if (entryId) {
            createReviewComment({
                variables: {
                    data: {
                        body: comment,
                        entry: entryId,
                        reviews: reviewList.map((r) => ({
                            ...r,
                            entry: entryId,
                        })),
                    },
                },
            });
        }
    }, [dirtyReviews, createReviewComment, entryId, comment]);

    return (
        <div className={_cs(styles.newEntry, className)}>
            <Prompt
                when={!pristine}
                message="There are unsaved changes. Are you sure you want to leave?"
            />
            <PageHeader
                className={styles.header}
                title="Review Entry"
                actions={(
                    <>
                        <ButtonLikeLink
                            route={route.entry}
                            attrs={{ entryId }}
                        >
                            Edit Entry
                        </ButtonLikeLink>
                        <Button
                            name={undefined}
                            variant="primary"
                            onClick={handleSubmitReviewButtonClick}
                            disabled={submitPending || pristine}
                        >
                            Submit review
                        </Button>
                    </>
                )}
            />
            <div className={styles.content}>
                <EntryForm
                    className={styles.entryForm}
                    elementRef={entryFormRef}
                    onChange={setEntryValue}
                    onPristineChange={setPristine}
                    entryId={entryId}
                    attachment={attachment}
                    preview={preview}
                    onAttachmentChange={setAttachment}
                    onPreviewChange={setPreview}
                    onRequestCallPendingChange={setSubmitPending}
                    reviewMode
                    review={review}
                    onReviewChange={handleReviewChange}
                    setReview={setReview}
                    setCommentList={setCommentList}
                />
                <div className={styles.aside}>
                    <Tabs
                        value={activeTab}
                        onChange={setActiveTab}
                    >
                        <TabList className={styles.tabList}>
                            <Tab name="comments">
                                Comments
                            </Tab>
                            <Tab name="preview">
                                Preview
                            </Tab>
                        </TabList>
                        <TabPanel
                            name="comments"
                            className={styles.commentsContainer}
                        >
                            <div className={styles.commentInputContainer}>
                                {dirtyReviews.length > 0 && (
                                    <div>
                                        {`You have marked ${dirtyReviews.length} fields`}
                                    </div>
                                )}
                                <TextArea
                                    label="Comment"
                                    name="comment"
                                    onChange={handleCommentInputChange}
                                    value={comment}
                                />
                            </div>
                            <div className={styles.commentList}>
                                {commentList.map((c) => (
                                    <div
                                        key={c.id}
                                        className={styles.comment}
                                    >
                                        <div
                                            className={styles.avatar}
                                        >
                                            <Avatar
                                                // FIXME: createdBy should always be defined
                                                alt={c.createdBy.fullName ?? c.createdBy.username}
                                            />
                                        </div>
                                        <div className={styles.box}>
                                            <div>
                                                <span>
                                                    {c.createdBy.fullName ?? c.createdBy.username}
                                                </span>
                                                <DateCell
                                                    value={c.createdAt}
                                                    format="datetime"
                                                />
                                            </div>
                                            <div>
                                                { c.body }
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabPanel>
                        <TabPanel
                            name="preview"
                            className={styles.previewContainer}
                        >
                            <UrlPreview
                                className={styles.preview}
                                url={preview?.url}
                                attachmentUrl={attachment?.attachment}
                            />
                        </TabPanel>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

export default ReviewEntry;
