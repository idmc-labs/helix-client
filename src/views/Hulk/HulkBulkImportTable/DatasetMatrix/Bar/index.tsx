import React from 'react';
import { _cs } from '@togglecorp/fujs';

import ExternalLink from '#components/tableHelpers/ExternalLink';

import styles from './styles.module.css';

export interface BarSegment {
    key: string;
    tone: 'success' | 'warning' | 'danger';
    // Width is proportional to this, floored by the slot's min-width.
    grow: number;
    content: string;
    link?: string | null;
}

interface Props {
    pending?: boolean;
    segments: BarSegment[];
}

function Bar(props: Props) {
    const {
        pending,
        segments,
    } = props;

    // Check pending before the segment counts: while an import is in progress
    // every count is still zero, but we want the pending placeholder rather
    // than an empty bar.
    if (pending) {
        return (
            <div className={styles.bar}>
                <div className={styles.segment}>...</div>
            </div>
        );
    }

    return (
        <div className={styles.bar}>
            {segments.map((segment) => (
                <div
                    key={segment.key}
                    className={styles.segmentSlot}
                    style={{ flexGrow: segment.grow }}
                >
                    <ExternalLink
                        className={_cs(
                            styles.segment,
                            styles[segment.tone],
                            // Only a segment with a file is clickable.
                            segment.link ? styles.link : undefined,
                        )}
                        title={segment.content}
                        link={segment.link}
                    />
                </div>
            ))}
        </div>
    );
}

export default Bar;
