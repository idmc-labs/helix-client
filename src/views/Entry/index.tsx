import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { Attachment, Preview } from '#components/EntryForm/types';
import UrlPreview from '#components/UrlPreview';
import EntryComments from '#components/EntryComments';

import route from '#config/routes';
import styles from './styles.css';

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
    const [preview, setPreview] = useState<Preview | undefined>(undefined);
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
                    onPreviewChange={setPreview}
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
                            <Tab name="comments">
                                Comments
                            </Tab>
                        </TabList>
                        <TabPanel
                            name="comments"
                            className={styles.commentsContainer}
                        >
                            {entryId && (
                                <EntryComments
                                    entryId={entryId}
                                />
                            )}
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

export default Entry;
