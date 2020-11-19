import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { IoMdCreate, IoMdDownload } from 'react-icons/io';

import Container from '#components/Container';
import { CountryQuery } from '#generated/types';

import DateCell from '#components/tableHelpers/Date';
import QuickActionButton from '#components/QuickActionButton';

import styles from './styles.css';

type ContextualUpdates = NonNullable<NonNullable<CountryQuery['country']>['contextualUpdates']>['results'];

interface CountryContextualUpdatesProps {
    className?: string;
    contextualUpdates: ContextualUpdates;
    disabled: boolean;
}
function ContextualUpdates(props: CountryContextualUpdatesProps) {
    const {
        className,
        contextualUpdates,
        disabled,
    } = props;
    return (
        <Container
            className={_cs(className, styles.contextualUpdates)}
            heading="Contextual Updates"
            headerActions={(
                <>
                    <QuickActionButton
                        name={undefined}
                        disabled={disabled}
                    >
                        <IoMdDownload />
                    </QuickActionButton>
                    <QuickActionButton
                        name={undefined}
                        disabled={disabled}
                    >
                        <IoMdCreate />
                    </QuickActionButton>
                </>
            )}
        >
            {/* TODO: Make separate component */}
            {contextualUpdates && contextualUpdates?.length > 0 ? contextualUpdates.map((cont) => (
                <div
                    key={cont.id}
                    className={styles.item}
                >
                    <div className={styles.entryOn}>
                        Entry on
                        <DateCell
                            value={cont.createdAt}
                            className={styles.createdAt}
                        />
                    </div>
                    <div className={styles.update}>
                        {cont.update}
                    </div>
                </div>
            )) : (
                <div className={styles.noUpdate}>
                    No Contextual Updates Found.
                </div>
            )}
        </Container>
    );
}

export default ContextualUpdates;
