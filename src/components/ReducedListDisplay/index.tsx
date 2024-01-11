import React, { Fragment } from 'react';
import { isNotDefined } from '@togglecorp/fujs';

import InfoPopup from '#components/InfoPopup';

import styles from './styles.module.css';

type Key = string | number;

function joinList<LIST_ITEM, KEY extends Key>(
    list: LIST_ITEM[],
    keySelector: (item: LIST_ITEM, i: number) => KEY,
    labelSelector: (item: LIST_ITEM, i: number) => React.ReactNode,
    separator: React.ReactNode,
) {
    return list.reduce<React.ReactNode[]>(
        (acc, child, index, array) => {
            const itemKey = keySelector(child, index);

            const item = labelSelector(child, index);

            acc.push(item);

            if (index !== array.length - 1) {
                acc.push(
                    <Fragment
                        key={`separator-${itemKey}`}
                    >
                        {separator}
                    </Fragment>,
                );
            }

            return acc;
        },
        [],
    );
}

export interface Props<LIST_ITEM, KEY extends Key> {
    list?: LIST_ITEM[];
    keySelector: (item: LIST_ITEM, i: number) => KEY,
    labelSelector: (item: LIST_ITEM, i: number) => React.ReactNode,
    title?: React.ReactNode;
    separator?: React.ReactNode;
    maxItems?: number;
    minItems?: number;
}

function ReducedListDisplay<LIST_ITEM, KEY extends Key>(props: Props<LIST_ITEM, KEY>) {
    const {
        list,
        labelSelector,
        keySelector,
        separator = ', ',
        maxItems = 4,
        minItems = 2,
    } = props;

    if (isNotDefined(list) || list.length === 0) {
        return null;
    }

    if (list.length <= maxItems) {
        const allItemList = joinList(list, keySelector, labelSelector, separator);
        return (
            <div className={styles.reducedListDisplay}>
                {allItemList}
            </div>
        );
    }

    const newList = list.slice(0, minItems);
    const infoLabel = `... and ${list.length - minItems} more`;

    const newJoinedList = joinList(newList, keySelector, labelSelector, separator);

    return (
        <div className={styles.reducedListDisplay}>
            {newJoinedList}
            <InfoPopup
                className={styles.reducedListLabel}
                infoLabel={infoLabel}
                withoutIcon
                popupClassName={styles.popup}
            >
                <ul>
                    {list.map(
                        (listItem, index) => (
                            <li key={keySelector(listItem, index)}>
                                {labelSelector(listItem, index)}
                            </li>
                        ),
                    )}
                </ul>
            </InfoPopup>
        </div>
    );
}

export default ReducedListDisplay;
