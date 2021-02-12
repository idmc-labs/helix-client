import React, { useState, useMemo, useEffect } from 'react';
import { IoMdAlert, IoMdTime } from 'react-icons/io';
import { useParams } from 'react-router-dom';
import { gql, useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Tabs,
    TabList,
    Tab,
    TabPanel,
} from '@togglecorp/toggle-ui';

import ButtonLikeLink from '#components/ButtonLikeLink';
import PageHeader from '#components/PageHeader';
import EntryForm from '#components/EntryForm';
import { Attachment, SourcePreview } from '#components/EntryForm/types';
import UrlPreview from '#components/UrlPreview';
import EntryComments from '#components/EntryComments';
import {
    SourcePreviewPollQueryVariables,
    SourcePreviewPollQuery,
} from '#generated/types';

import route from '#config/routes';
import styles from './styles.css';

const SOURCE_PREVIEW_POLL = gql`
    query SourcePreviewPoll($id: ID!){
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
    reviewMode?: boolean;
}

function Entry(props: EntryProps) {
    const {
        className,
        reviewMode,
    } = props;
    const entryFormRef = React.useRef<HTMLDivElement>(null);

    const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
    const [preview, setPreview] = useState<SourcePreview | undefined>(undefined);
    const [activeTab, setActiveTab] = React.useState<'comments' | 'preview'>(
        reviewMode ? 'comments' : 'preview',
    );
    const { entryId, parkedItemId } = useParams<{ entryId?: string, parkedItemId?: string }>();

    let title: string;
    let link: React.ReactNode | undefined;
    if (!entryId) {
        title = 'New Entry';
    } else if (reviewMode) {
        title = 'Review Entry';
        link = (
            <ButtonLikeLink
                route={route.entry}
                attrs={{ entryId }}
            >
                Edit Entry
            </ButtonLikeLink>
        );
    } else {
        title = 'Edit Entry';
        link = (
            <ButtonLikeLink
                route={route.entryReview}
                attrs={{ entryId }}
            >
                Review Entry
            </ButtonLikeLink>
        );
    }

    const variables = useMemo(
        (): SourcePreviewPollQueryVariables | undefined => (
            preview?.id
                ? ({ id: preview?.id })
                : undefined
        ),
        [preview?.id],
    );

    const {
        stopPolling,
    } = useQuery<SourcePreviewPollQuery, SourcePreviewPollQueryVariables>(SOURCE_PREVIEW_POLL, {
        skip: !variables,
        pollInterval: 3000,
        variables,
        // NOTE: onCompleted is only called once if the following option is not set
        // https://github.com/apollographql/apollo-client/issues/5531
        notifyOnNetworkStatusChange: true,
        onCompleted: (response) => {
            const { sourcePreview } = response;
            if (!sourcePreview) {
                return;
            }
            setPreview(sourcePreview);
        },
    });

    // FIXME: get a better way to stop polling
    useEffect(
        () => {
            if (preview?.status === 'COMPLETED' || preview?.status === 'FAILED') {
                stopPolling();
            }
        },
        [preview?.status, stopPolling],
    );

    return (
        <div className={_cs(styles.entry, className)}>
            <PageHeader
                className={styles.header}
                title={title}
                actions={(
                    <>
                        {link}
                        <div ref={entryFormRef} />
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
                    reviewMode={reviewMode}
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
                                <Tab name="cached-preview">
                                    Cached Preview
                                    {preview.status === 'FAILED' && (
                                        <IoMdAlert className={styles.statusIcon} />
                                    )}
                                    {(preview.status === 'PENDING' || preview.status === 'IN_PROGRESS') && (
                                        <IoMdTime className={styles.statusIcon} />
                                    )}

                                </Tab>
                            )}
                            <Tab name="comments">
                                Comments
                            </Tab>
                        </TabList>
                        {entryId && (
                            <TabPanel
                                name="comments"
                                className={styles.commentsContainer}
                            >
                                <EntryComments
                                    entryId={entryId}
                                    className={styles.entryComment}
                                />
                            </TabPanel>
                        )}
                        {preview && (
                            <>
                                <TabPanel
                                    name="cached-preview"
                                    className={styles.previewContainer}
                                >
                                    <UrlPreview
                                        className={styles.preview}
                                        url={preview.pdf}
                                        missingUrlMessage={(
                                            ((preview.status === 'PENDING' || preview.status === 'IN_PROGRESS') && 'Generating Preview...')
                                            || (preview.status === 'FAILED' && 'Failed to generate preview')
                                            || undefined
                                        )}
                                    />
                                </TabPanel>
                            </>
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
