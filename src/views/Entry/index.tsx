import React, { useState, useEffect, useContext, useMemo } from 'react';
import { IoMdAlert, IoMdTime } from 'react-icons/io';
import { useParams } from 'react-router-dom';
import { gql, useLazyQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Tabs,
    TabList,
    Tab,
    TabPanel,
    Checkbox,
} from '@togglecorp/toggle-ui';

import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import ButtonLikeLink from '#components/ButtonLikeLink';
import PageHeader from '#components/PageHeader';
import UrlPreview from '#components/UrlPreview';
import {
    SourcePreviewPollQueryVariables,
    SourcePreviewPollQuery,
} from '#generated/types';
import route from '#config/routes';

import EntryComments from './EntryComments';
import EntryForm from './EntryForm';
import { Attachment, SourcePreview, ReviewInputFields } from './EntryForm/types';
import styles from './styles.css';

const SOURCE_PREVIEW_POLL = gql`
    query SourcePreviewPoll($id: ID!) {
        sourcePreview(id: $id) {
            url
            status
            remark
            pdf
            id
        }
    }
`;

interface EntryProps {
    className?: string;
    mode: 'review' | 'edit';
}

function Entry(props: EntryProps) {
    const {
        className,
        mode,
    } = props;
    const entryFormRef = React.useRef<HTMLDivElement>(null);

    const {
        notify,
    } = useContext(NotificationContext);

    const [reviewPristine, setReviewPristine] = useState(true);
    const [review, setReview] = useState<ReviewInputFields>({});

    const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
    const [preview, setPreview] = useState<SourcePreview | undefined>(undefined);
    const [activeTab, setActiveTab] = React.useState<'comments' | 'preview' | undefined>(
        mode === 'review'
            ? 'comments'
            : 'preview',
    );
    const {
        entryId,
        parkedItemId,
    } = useParams<{ entryId?: string, parkedItemId?: string }>();

    const figureId = useMemo(
        () => {
            const params = new URLSearchParams(document.location.search);
            return params.get('id');
        },
        [],
    );
    // NOTE: show traffic light by default only on review mode
    const [trafficLightShown, setTrafficLightShown] = useState(mode === 'review');

    let title: string;
    let link: React.ReactNode | undefined;
    if (!entryId) {
        title = 'New Entry';
    } else if (mode === 'edit') {
        title = 'Edit Entry';
        link = (
            <ButtonLikeLink
                route={route.entryView}
                attrs={{ entryId }}
            >
                Go to review
            </ButtonLikeLink>
        );
    } else {
        title = 'Review Entry';
        link = (
            <ButtonLikeLink
                route={route.entryEdit}
                attrs={{ entryId }}
            >
                Go to edit
            </ButtonLikeLink>
        );
    }

    const [
        start,
        { stopPolling },
    ] = useLazyQuery<SourcePreviewPollQuery, SourcePreviewPollQueryVariables>(SOURCE_PREVIEW_POLL, {
        pollInterval: 3_000,
        // NOTE: onCompleted is only called once if the following option is not set
        // https://github.com/apollographql/apollo-client/issues/5531
        notifyOnNetworkStatusChange: true,
        onCompleted: (response) => {
            const { sourcePreview } = response;
            if (!sourcePreview) {
                return;
            }
            if (sourcePreview.status === 'FAILED') {
                notify({
                    children: 'The preview could not be generated!',
                    variant: 'error',
                });
            }
            setPreview(sourcePreview);
        },
    });

    const previewId = preview?.id;
    const previewEnded = preview?.status === 'FAILED' || preview?.status === 'COMPLETED' || preview?.status === 'KILLED';

    useEffect(
        () => {
            if (previewId && !previewEnded) {
                start({
                    variables: { id: previewId },
                });
            } else if (stopPolling) {
                stopPolling();
            }
        },
        [previewId, previewEnded, start, stopPolling],
    );

    const { user } = useContext(DomainContext);
    const reviewPermission = user?.permissions?.review?.add;

    // FIXME: similarly set view mode for edit when no edit permission
    const modeAfterPermissionCheck = !reviewPermission && mode === 'review'
        ? 'view'
        : mode;

    return (
        <div className={_cs(styles.entry, className)}>
            <PageHeader
                className={styles.header}
                title={title}
                actions={(
                    <>
                        {entryId && (
                            <Checkbox
                                name="trafficLightShown"
                                value={trafficLightShown}
                                onChange={setTrafficLightShown}
                                label="Show review"
                            />
                        )}
                        {link}
                        <div
                            className={styles.portalContainer}
                            ref={entryFormRef}
                        />
                    </>
                )}
            />
            <div className={styles.content}>
                <EntryForm
                    className={styles.entryForm}
                    entryId={entryId}
                    parkedItemId={parkedItemId}
                    attachment={attachment}
                    preview={preview}
                    onAttachmentChange={setAttachment}
                    onSourcePreviewChange={setPreview}
                    parentNode={entryFormRef.current}
                    mode={modeAfterPermissionCheck}
                    trafficLightShown={trafficLightShown}
                    review={review}
                    reviewPristine={reviewPristine}
                    onReviewChange={setReview}
                    onReviewPristineChange={setReviewPristine}
                    initialFigureId={figureId}
                    // readOnly
                />
                <div className={styles.aside}>
                    <Tabs
                        value={activeTab}
                        onChange={setActiveTab}
                    >
                        <TabList className={styles.tabList}>
                            <Tab name="preview">
                                Preview
                            </Tab>
                            {preview && (
                                <Tab
                                    name="cached-preview"
                                    className={_cs((preview.status === 'FAILED' || preview.status === 'KILLED') && styles.previewFailed)}
                                >
                                    Cached Preview
                                    {(preview.status === 'FAILED' || preview.status === 'KILLED') && (
                                        <IoMdAlert className={styles.statusIcon} />
                                    )}
                                    {(preview.status === 'PENDING' || preview.status === 'IN_PROGRESS') && (
                                        <IoMdTime className={styles.statusIcon} />
                                    )}
                                </Tab>
                            )}
                            {entryId && (
                                <Tab name="comments">
                                    Comments
                                </Tab>
                            )}
                        </TabList>
                        {entryId && (
                            <TabPanel
                                name="comments"
                                className={styles.commentsContainer}
                            >
                                <EntryComments
                                    entryId={entryId}
                                    className={styles.entryComment}
                                    review={review}
                                    reviewPristine={reviewPristine}
                                    onReviewChange={setReview}
                                    onReviewPristineChange={setReviewPristine}
                                />
                            </TabPanel>
                        )}
                        {preview && (
                            <TabPanel
                                name="cached-preview"
                                className={styles.previewContainer}
                            >
                                <UrlPreview
                                    className={styles.preview}
                                    url={preview.pdf}
                                    missingUrlMessage={(
                                        ((preview.status === 'PENDING' || preview.status === 'IN_PROGRESS') && 'Generating Preview...')
                                        || ((preview.status === 'FAILED' || preview.status === 'KILLED') && 'Failed to generate preview')
                                        || undefined
                                    )}
                                />
                            </TabPanel>
                        )}
                        {preview && (
                            <TabPanel
                                name="preview"
                                className={styles.previewContainer}
                            >
                                <UrlPreview
                                    className={styles.preview}
                                    url={preview?.url}
                                    mode="html"
                                />
                            </TabPanel>
                        )}
                        {attachment && (
                            <TabPanel
                                name="preview"
                                className={styles.previewContainer}
                            >
                                <UrlPreview
                                    className={styles.preview}
                                    url={attachment?.attachment}
                                />
                            </TabPanel>
                        )}
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

export default Entry;
