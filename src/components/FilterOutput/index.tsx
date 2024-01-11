import React, { useMemo } from 'react';
import { isNotDefined, listToMap, isDefined } from '@togglecorp/fujs';

import ReducedListDisplay from '#components/ReducedListDisplay';

import styles from './styles.css';

type Key = string | number;

interface BaseProps<DATUM, KEY extends Key> {
    options: DATUM[] | undefined | null;
    keySelector: (datum: DATUM) => KEY;
    labelSelector: (datum: DATUM) => React.ReactNode;
    label: React.ReactNode;
}

interface SingleProps<KEY extends Key> {
    multi?: false;
    value: KEY | undefined | null;
    // onChange: (newValue: KEY | undefined) => void;
}

interface ListProps<KEY extends Key> {
    multi: true;
    value: KEY[] | undefined | null;
    // onChange: (newValue: KEY[]) => void;
}

type Props<DATUM, KEY extends Key> = BaseProps<DATUM, KEY>
    & (SingleProps<KEY> | ListProps<KEY>);

function FilterOutput<DATUM, KEY extends Key>(props: Props<DATUM, KEY>) {
    const {
        options,
        keySelector,
        labelSelector,
        label,
    } = props;

    const optionsByKey = useMemo(
        () => (
            listToMap<DATUM>(
                options,
                keySelector,
            )
        ),
        [keySelector, options],
    );

    // eslint-disable-next-line react/destructuring-assignment
    if (isNotDefined(props.value)) {
        return null;
    }

    // eslint-disable-next-line react/destructuring-assignment
    if (props.multi && props.value?.length === 0) {
        return null;
    }

    return (
        <div className={styles.filterOutput}>
            <div className={styles.label}>
                {label}
            </div>
            <div>
                {/* eslint-disable-next-line react/destructuring-assignment */}
                {props.multi === true ? (
                    <ReducedListDisplay
                        // FIXME: memoize this
                        list={(
                            // eslint-disable-next-line react/destructuring-assignment
                            props.value
                                .map((valueItem) => optionsByKey[valueItem])
                                .filter(isDefined)
                        )}
                        keySelector={keySelector}
                        labelSelector={labelSelector}
                    />
                ) : (
                    // eslint-disable-next-line react/destructuring-assignment
                    labelSelector(optionsByKey[props.value])
                )}
            </div>
        </div>
    );
}

export default FilterOutput;
