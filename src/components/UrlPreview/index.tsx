import React from 'react';
import { _cs, isDefined, isNotDefined } from '@togglecorp/fujs';
import { GiShrug } from 'react-icons/gi';

import { isValidUrl, isLocalUrl } from '#utils/common';

import styles from './styles.css';

type Maybe<T> = T | undefined | null;

interface UrlParams {
    [key: string]: Maybe<string | number | boolean | (string | number | boolean)[]>;
}

export function prepareUrlParams(params: UrlParams) {
    return Object.keys(params)
        .filter((k) => isDefined(params[k]))
        .map((k) => {
            const param = params[k];
            if (isNotDefined(param)) {
                return undefined;
            }
            let val: string;
            if (Array.isArray(param)) {
                val = param.join(',');
            } else if (typeof param === 'number' || typeof param === 'boolean') {
                val = String(param);
            } else {
                val = param;
            }
            return `${encodeURIComponent(k)}=${encodeURIComponent(val)}`;
        })
        .filter(isDefined)
        .join('&');
}

function createUrlForGoogleViewer(url: string) {
    const params = prepareUrlParams({
        url,
        pid: 'explorer',
        efh: false,
        a: 'v',
        chrome: false,
        embedded: true,
    });
    return `https://drive.google.com/viewerng/viewer?${params}`;
}

interface MessageProps {
    text: string;
}
function Message(props: MessageProps) {
    const { text } = props;
    return (
        <div className={styles.emptyMessage}>
            <GiShrug className={styles.icon} />
            <div className={styles.text}>
                {text}
            </div>
        </div>
    );
}

interface OtherPreviewProps {
    url: string;
}
function OtherPreview(props: OtherPreviewProps) {
    const { url } = props;
    const isLocal = isLocalUrl(url);

    if (!isLocal) {
        return (
            <div className={styles.preview}>
                <div
                    title={url}
                    className={styles.url}
                >
                    { url }
                </div>
                <iframe
                    className={styles.previewFrame}
                    src={url}
                    title="Source preview"
                />
                <iframe
                    className={styles.previewFrame}
                    title="Google Preview"
                    sandbox="allow-scripts allow-same-origin"
                    src={createUrlForGoogleViewer(url)}
                />
            </div>
        );
    }

    // FIXME: this is a hack
    const isPdf = url.endsWith('.pdf');

    if (isPdf) {
        return (
            <div className={styles.preview}>
                <div
                    title={url}
                    className={styles.url}
                >
                    { url }
                </div>
                <object
                    className={styles.previewFrame}
                    type="application/pdf"
                    data={url}
                    title="Pdf preview"
                />
            </div>
        );
    }
    return (
        <Message
            text="Please enter a valid attachment for preview"
        />
    );
}

interface HtmlPreviewProps {
    url: string;
}
function HtmlPreview(props: HtmlPreviewProps) {
    const { url } = props;
    return (
        <div className={styles.preview}>
            <div
                title={url}
                className={styles.url}
            >
                { url }
            </div>
            <iframe
                className={styles.previewFrame}
                src={url}
                title="Source preview"
            />
        </div>
    );
}

interface PreviewProps {
    url?: string;
    className?: string;
    mode?: 'html' | 'other';
}
function Preview(props: PreviewProps) {
    const {
        url,
        className,
        mode,
    } = props;

    if (!url) {
        return (
            <div className={_cs(styles.urlPreview, className)}>
                <Message
                    text="Please enter a URL for preview"
                />
            </div>
        );
    }

    const urlValid = isValidUrl(url);
    if (!urlValid) {
        return (
            <div className={_cs(styles.urlPreview, className)}>
                <Message
                    text="Please enter a valid URL for preview"
                />
            </div>
        );
    }

    return (
        <div className={_cs(styles.urlPreview, className)}>
            {mode === 'html' ? (
                <HtmlPreview
                    url={url}
                />
            ) : (
                <OtherPreview
                    url={url}
                />
            )}
        </div>
    );
}

interface UrlPreviewProps {
    className?: string;
    url?: string;
    attachmentUrl?: string;
}

function UrlPreview(props: UrlPreviewProps) {
    const {
        url,
        attachmentUrl,
        className,
    } = props;

    const myUrl = url ?? attachmentUrl;
    const mode = url ? ('html' as const) : ('other' as const);

    return (
        <Preview
            url={myUrl}
            className={className}
            mode={mode}
        />
    );
}

export default UrlPreview;
