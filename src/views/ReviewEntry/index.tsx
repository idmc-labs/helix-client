import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';
import {
    Button,
    Tabs,
    TabList,
    Tab,
    TabPanel,
} from '@togglecorp/toggle-ui';

import ButtonLikeLink from '#components/ButtonLikeLink';
import PageHeader from '#components/PageHeader';
import EntryForm from '#components/EntryForm';
import UrlPreview from '#components/UrlPreview';

import { PartialForm } from '#types';
import { FormValues, Attachment, Preview } from '#components/EntryForm/types';

import route from '#config/routes';
import styles from './styles.css';

interface EntryProps {
    className?: string;
}

type PartialFormValues = PartialForm<FormValues>;

function Entry(props: EntryProps) {
    const { className } = props;
    const { entryId } = useParams<{ entryId: string }>();
    const entryFormRef = React.useRef<HTMLFormElement>(null);
    const [entryValue, setEntryValue] = useState<PartialFormValues>();
    const [pristine, setPristine] = useState(true);
    const [submitPending, setSubmitPending] = useState<boolean>(false);
    const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
    const [preview, setPreview] = useState<Preview | undefined>(undefined);

    const handleSubmitEntryButtonClick = React.useCallback(() => {
        if (entryFormRef?.current) {
            entryFormRef.current.requestSubmit();
        }
    }, [entryFormRef]);

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
                            onClick={handleSubmitEntryButtonClick}
                            disabled={(!attachment && !preview) || submitPending || pristine}
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

export default Entry;
