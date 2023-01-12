import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { gql, useLazyQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Checkbox,
} from '@togglecorp/toggle-ui';

import Preview from '#components/Preview';
import NotificationContext from '#components/NotificationContext';
import ButtonLikeLink from '#components/ButtonLikeLink';
import PageHeader from '#components/PageHeader';
import {
    SourcePreviewPollQueryVariables,
    SourcePreviewPollQuery,
} from '#generated/types';
import route from '#config/routes';

import EntryForm from '#components/forms/EntryForm';
import { Attachment, SourcePreview } from '#components/forms/EntryForm/types';

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
    mode: 'view' | 'edit';
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

    const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
    const [preview, setPreview] = useState<SourcePreview | undefined>(undefined);
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

    const commentFieldName = useMemo(
        () => {
            const params = new URLSearchParams(document.location.search);
            return params.get('field');
        },
        [],
    );
    const [trafficLightShown, setTrafficLightShown] = useState(true);

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
                Go to view
            </ButtonLikeLink>
        );
    } else {
        title = 'View Entry';
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

    return (
        <div className={_cs(styles.entry, className)}>
            <div className={styles.mainContent}>
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
                <EntryForm
                    className={styles.entryForm}
                    entryId={entryId}
                    parkedItemId={parkedItemId}
                    attachment={attachment}
                    preview={preview}
                    onAttachmentChange={setAttachment}
                    onSourcePreviewChange={setPreview}
                    parentNode={entryFormRef.current}
                    mode={mode}
                    trafficLightShown={trafficLightShown}
                    initialFigureId={figureId}
                    commentFieldName={commentFieldName}
                />
            </div>
            <div className={styles.sideContent}>
                <Preview
                    className={styles.stickyContainer}
                    attachment={attachment}
                    preview={preview}
                />
            </div>
        </div>
    );
}

export default Entry;
