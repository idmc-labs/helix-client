import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { IoMdCreate, IoMdDownload } from 'react-icons/io';

import Container from '#components/Container';
import { CountryQuery } from '#generated/types';

import DateCell from '#components/tableHelpers/Date';
import QuickActionButton from '#components/QuickActionButton';

import styles from './styles.css';

type Summary = NonNullable<NonNullable<CountryQuery['country']>['contextualUpdates']>['results'];

interface CountrySummaryProps {
    className?: string;
    contextualUpdates: Summary;
}
function ContextualUpdates(props: CountrySummaryProps) {
    const {
        className,
        contextualUpdates,
    } = props;
    if (!contextualUpdates) {
        return null;
    }
    return (
        <Container
            className={_cs(className, styles.contextualUpdates)}
            heading="Contextual Updates"
            headerActions={(
                <>
                    <QuickActionButton
                        name={undefined}
                    >
                        <IoMdDownload />
                    </QuickActionButton>
                    <QuickActionButton
                        name={undefined}
                    >
                        <IoMdCreate />
                    </QuickActionButton>
                </>
            )}
        >
            {/* // TODO: Make separate component */}
            {contextualUpdates.map((context) => (
                <div
                    key={context.id}
                    className={styles.item}
                >
                    <div className={styles.entryOn}>
                        Entry on
                        <DateCell
                            value={context.createdAt}
                            className={styles.createdAt}
                        />
                    </div>
                    <div className={styles.update}>
                        {context.update}
                    </div>
                </div>
            ))}
        </Container>
    );
}

export default ContextualUpdates;
