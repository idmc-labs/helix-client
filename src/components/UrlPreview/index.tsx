import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { GiShrug } from 'react-icons/gi';

import { urlCondition } from '#utils/validation';

import styles from './styles.css';

interface UrlPreviewProps {
    className?: string;
    url?: string;
}

function UrlPreview(props: UrlPreviewProps) {
    const {
        url,
        className,
    } = props;

    const [previewLoaded, setPreviewLoaded] = React.useState(false);
    const isValidUrl = url && !urlCondition(url);

    React.useEffect(() => {
        setPreviewLoaded(false);
    }, [url, isValidUrl, setPreviewLoaded]);

    return (
        <div className={_cs(styles.urlPreview, className)}>
            { isValidUrl ? (
                <div className={styles.preview}>
                    <div
                        title={url}
                        className={styles.url}
                    >
                        { url }
                    </div>
                    <iframe
                        // onLoad doesn't get called on firefox
                        // related: https://bugzilla.mozilla.org/show_bug.cgi?id=1418975
                        onLoad={() => { setPreviewLoaded(true); }}
                        className={styles.previewFrame}
                        src={url}
                        title="Source preview"
                    />
                    { !previewLoaded && (
                        <div className={styles.loadingMessage}>
                            Loading preview...
                        </div>
                    )}
                </div>
            ) : (
                <div className={styles.emptyMessage}>
                    <GiShrug className={styles.icon} />
                    <div className={styles.text}>
                        Please enter a valid URL to view its preview
                    </div>
                </div>
            )}
        </div>
    );
}

export default UrlPreview;
