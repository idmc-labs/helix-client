import React, { useState } from 'react';
import { _cs } from '@togglecorp/fujs';
import { PartialForm } from '@togglecorp/toggle-form';
import {
    IoAlertOutline,
    IoTimeOutline,
} from 'react-icons/io5';
import {
    Tab,
    TabList,
    TabPanel,
    Tabs,
} from '@togglecorp/toggle-ui';

import {
    Attachment,
    SourcePreview,
} from '#views/Entry/EntryForm/types';
import UrlPreview from '#components/UrlPreview';

import styles from './styles.css';

type PreviewType = PartialForm<SourcePreview>
type AttachmentType = PartialForm<Attachment>

interface Props {
    preview?: PreviewType;
    attachment?: AttachmentType;
}

function Preview(props: Props) {
    const {
        attachment,
        preview,
    } = props;

    const [activeTab, setActiveTab] = useState<'preview' | 'cached-preview' | undefined>('preview');

    return (
        <div className={styles.previewContent}>
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
