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

// TODO: add a better check
function isPdf(url: string) {
    const sanitizedUrl = url.trim().toLowerCase();
    return sanitizedUrl.endsWith('.pdf');
}

// TODO: add a better check
function isOfficeCompatible(url: string) {
    const sanitizedUrl = url.trim().toLowerCase();
    return sanitizedUrl.endsWith('.ppt')
        || sanitizedUrl.endsWith('.pptx')
        || sanitizedUrl.endsWith('.doc')
        || sanitizedUrl.endsWith('.docx')
        || sanitizedUrl.endsWith('.xls')
        || sanitizedUrl.endsWith('.xlsx');
}
function createUrlForGoogleViewer(url: string) {
    const params = prepareUrlParams({
        url,
        embedded: true,
    });
    return `https://docs.google.com/viewerng/viewer?${params}`;
}

function createUrlForOfficeViewer(url: string) {
    const params = prepareUrlParams({
        src: url,
    });
    return `https://view.officeapps.live.com/op/embed.aspx?${params}`;
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

interface FilePreviewProps {
    url: string;
}
function FilePreview(props: FilePreviewProps) {
    const { url } = props;

    // NOTE: Pdf can be previewed by browsers natively so no need to use a online previewer
    if (isPdf(url)) {
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

    const isLocal = isLocalUrl(url);
    if (isLocal) {
        return (
            <Message
                text="Please provide a valid attachment for preview"
            />
        );
    }

    return (
        <div className={styles.preview}>
            <div
                title={url}
                className={styles.url}
            >
                { url }
            </div>
            {isOfficeCompatible(url) ? (
                <iframe
                    className={styles.previewFrame}
                    title="Office Preview"
                    // NOTE: we can enable allow-scripts and allow-same-origin
                    // as we can trust this domain
                    sandbox="allow-scripts allow-same-origin allow-downloads allow-popups allow-forms"
                    src={createUrlForOfficeViewer(url)}
                />
            ) : (
                <iframe
                    className={styles.previewFrame}
                    title="Google Preview"
                    // NOTE: we can enable allow-scripts and allow-same-origin
                    // as we can trust this domain
                    sandbox="allow-scripts allow-same-origin allow-downloads allow-popups"
                    src={createUrlForGoogleViewer(url)}
                />
            )}
        </div>
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
                title="Web Preview"
                sandbox="allow-scripts allow-popups"
            />
        </div>
    );
}

interface UrlPreviewProps {
    url: string | undefined | null;
    className?: string;
    mode?: 'html' | 'file';

    missingUrlMessage?: string;
    invalidUrlMessage?: string;
}
function UrlPreview(props: UrlPreviewProps) {
    const {
        className,
        url,
        mode = 'file',
        missingUrlMessage = 'Please enter a URL for preview',
        invalidUrlMessage = 'Please enter a valid URL for preview',
    } = props;

    if (!url) {
        return (
            <div className={_cs(styles.urlPreview, className)}>
                <Message
                    text={missingUrlMessage}
                />
            </div>
        );
    }

    const urlValid = isValidUrl(url);
    if (!urlValid) {
        return (
            <div className={_cs(styles.urlPreview, className)}>
                <Message
                    text={invalidUrlMessage}
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
                <FilePreview
                    url={url}
                />
            )}
        </div>
    );
}

export default UrlPreview;
