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

import route from '#config/routes';
import styles from './styles.css';

interface NewEntryProps {
    className?: string;
}

function NewEntry(props: NewEntryProps) {
    const { className } = props;
    const entryFormRef = React.useRef<HTMLDivElement>(null);

    const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
    const [preview, setPreview] = useState<Preview | undefined>(undefined);
    const [activeTab, setActiveTab] = React.useState<'comments' | 'preview'>('preview');

    const { entryId } = useParams<{ entryId: string }>();

    return (
        <div className={_cs(styles.newEntry, className)}>
            <PageHeader
                className={styles.header}
                title={entryId ? 'Edit Entry' : 'New Entry'}
                actions={(
                    <>
                        {entryId && (
                            <ButtonLikeLink
                                route={route.entryReview}
                                attrs={{ entryId }}
                            >
                                Review Entry
                            </ButtonLikeLink>
                        )}
                        <div ref={entryFormRef} />
                    </>
                )}
            />
            <div className={styles.content}>
                <EntryForm
                    className={styles.entryForm}
                    entryId={entryId}
                    attachment={attachment}
                    preview={preview}
                    onAttachmentChange={setAttachment}
                    onPreviewChange={setPreview}
                    parentNode={entryFormRef.current}
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
                            Under construction
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

export default NewEntry;
