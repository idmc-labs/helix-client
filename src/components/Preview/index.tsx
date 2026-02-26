import React, { useState } from 'react';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';
import { PartialForm } from '@togglecorp/toggle-form';
import {
    IoAlertOutline,
    IoTimeOutline,
} from 'react-icons/io5';
import {
    Button,
    Tab,
    TabList,
    TabPanel,
    Tabs,
} from '@togglecorp/toggle-ui';

import {
    Attachment,
    SourcePreview,
} from '#components/forms/EntryForm/types';
import Message from '#components/Message';
import UrlPreview from '#components/UrlPreview';
import useBooleanState from '#utils/useBooleanState';

import styles from './styles.module.css';

const MAX_FILE_SIZE_FOR_PREVIEW = 50 * 1024 * 1024; // filesize in bytes

type PreviewType = PartialForm<SourcePreview>
type AttachmentType = PartialForm<Attachment>

interface Props {
    className?: string;
    preview?: PreviewType;
    attachment?: AttachmentType;
}

function Preview(props: Props) {
    const {
        className,
        attachment,
        preview,
    } = props;

    const [activeTab, setActiveTab] = useState<'preview' | 'cached-preview' | undefined>('preview');
    const [forcePreview, setForcePreviewTrue] = useBooleanState(false);

    if (!preview && (!attachment || !attachment.isFileUploaded)) {
        return (
            <Message
                className={_cs(className, styles.error)}
                message="No preview available!"
            />
        );
    }

    const isLargeFile = isDefined(attachment)
        && isDefined(attachment.fileSize)
        && attachment.fileSize > MAX_FILE_SIZE_FOR_PREVIEW;

    if (isLargeFile && !forcePreview) {
        return (
            <Message
                className={_cs(className, styles.previewPrompt)}
                heading="Preview is disabled!"
                message="The file is too large, so we’ve disabled the preview to keep things running smoothly. You can still enable it if you’d like."
                actions={(
                    <Button
                        name={undefined}
                        onClick={setForcePreviewTrue}
                    >
                        Enable preview
                    </Button>
                )}
            />
        );
    }

    return (
        <div className={_cs(className, styles.previewContent)}>
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
                                <IoAlertOutline className={styles.statusIcon} />
                            )}
                            {(preview.status === 'PENDING' || preview.status === 'IN_PROGRESS') && (
                                <IoTimeOutline className={styles.statusIcon} />
                            )}
                        </Tab>
                    )}
                </TabList>
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
    );
}

export default Preview;
