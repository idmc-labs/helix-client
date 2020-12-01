import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';
import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';
import {
    Button,
    Tabs,
    TabList,
    Tab,
    TabPanel,
} from '@togglecorp/toggle-ui';

import {
    CreateReviewCommentMutation,
    CreateReviewCommentMutationVariables,
} from '#generated/types';

import {
    getReviewList,
    getReviewInputMap,
} from '#components/EntryForm/reviewUtils';
import ButtonLikeLink from '#components/ButtonLikeLink';
import PageHeader from '#components/PageHeader';
import NotificationContext from '#components/NotificationContext';
import EntryForm from '#components/EntryForm';
import UrlPreview from '#components/UrlPreview';

import { PartialForm } from '#types';
import { FormValues, Attachment, Preview } from '#components/EntryForm/types';

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
    const { entryId } = useParams<{ entryId: string }>();
    const entryFormRef = React.useRef<HTMLFormElement>(null);
    const [entryValue, setEntryValue] = useState<PartialFormValues>();
    const [pristine, setPristine] = useState(true);
    const [submitPending, setSubmitPending] = useState<boolean>(false);
    const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
    const [preview, setPreview] = useState<Preview | undefined>(undefined);
    const [review, setReview] = React.useState({});
    const { notify } = React.useContext(NotificationContext);

    const handleReviewChange = React.useCallback((newValue, name) => {
        setReview((oldReview) => ({
            ...oldReview,
            [name]: newValue,
        }));
    }, [setReview]);

    const [createReviewComment] = useMutation<
        CreateReviewCommentMutation,
        CreateReviewCommentMutationVariables
    >(CREATE_REVIEW_COMMENT, {
        onCompleted: (response) => {
            if (response?.createReviewComment?.ok) {
                notify({ children: 'Review submitted successfully' });
            } else {
                notify({ children: 'Failed to submit review' });
            }
        },
    });

    const handleSubmitReviewButtonClick = React.useCallback(() => {
        const reviewList = getReviewList(review);
        const genReview = getReviewInputMap(reviewList);

        console.info(review, reviewList, genReview);
        createReviewComment({
            variables: {
                data: {
                    body: 'sample comment',
                    entry: entryId,
                    reviews: reviewList.map((r) => ({
                        ...r,
                        entry: entryId,
                    })),
                },
            },
        });
    }, [review, createReviewComment, entryId]);

    const [activeTab, setActiveTab] = React.useState<'comments' | 'preview'>('comments');

    return (
        <div className={_cs(styles.newEntry, className)}>
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
                            // disabled={(!attachment && !preview) || submitPending || pristine}
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
                            Under construction
                        </TabPanel>
                        <TabPanel
                            name="preview"
                            className={styles.previewContainer}
                        >
                            <UrlPreview
                                className={styles.preview}
                                url={entryValue?.details?.url}
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
