import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { IoServerOutline, IoRocketOutline } from 'react-icons/io5';

import styles from './styles.module.css';

export interface Props {
    className?: string;
    // entity was migrated from the old Helix 1.0 system (has an oldId)
    fromHelixOne?: boolean;
    // entity was created through pyhelix
    fromHulk?: boolean;
}

function SourceIndicators(props: Props) {
    const {
        className,
        fromHelixOne,
        fromHulk,
    } = props;

    if (!fromHelixOne && !fromHulk) {
        return null;
    }

    return (
        <>
            {fromHelixOne && (
                <span
                    className={_cs(className, styles.indicator, styles.helixOne)}
                    title="Imported from Helix 1.0"
                >
                    <IoServerOutline />
                </span>
            )}
            {fromHulk && (
                <span
                    className={_cs(className, styles.indicator, styles.bulk)}
                    title="Imported using Hulk"
                >
                    <IoRocketOutline />
                </span>
            )}
        </>
    );
}

export default SourceIndicators;
