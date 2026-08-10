import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { PiArchiveBox, PiHandFist } from 'react-icons/pi';

import styles from './styles.module.css';

export interface Props {
    className?: string;
    // entity was migrated from the old Helix 1.0 system (has an oldId)
    fromHelixOne?: boolean;
    // UUID of the hulk relation row; present iff the entity was created through
    // pyhelix. Shown on hover to tally against the bulk-import input dataset.
    hulkUuid?: string | null;
}

function SourceIndicators(props: Props) {
    const {
        className,
        fromHelixOne,
        hulkUuid,
    } = props;

    if (!fromHelixOne && !hulkUuid) {
        return null;
    }

    return (
        <>
            {fromHelixOne && (
                <span
                    className={_cs(className, styles.indicator, styles.helixOne)}
                    title="Imported from Helix 1.0"
                >
                    <PiArchiveBox />
                </span>
            )}
            {hulkUuid && (
                <span
                    className={_cs(className, styles.indicator, styles.bulk)}
                    title={`Imported using HULK (${hulkUuid})`}
                >
                    <PiHandFist />
                </span>
            )}
        </>
    );
}

export default SourceIndicators;
