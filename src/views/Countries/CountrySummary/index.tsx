import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { IoMdCreate } from 'react-icons/io';

import Container from '#components/Container';
import { CountryQuery } from '#generated/types';

import QuickActionButton from '#components/QuickActionButton';

import styles from './styles.css';

type Summary = NonNullable<CountryQuery['country']>['lastSummary'];

interface CountrySummaryProps {
    className?: string;
    summary: Summary;
    disabled: boolean;
}
function CountrySummary(props: CountrySummaryProps) {
    const {
        className,
        summary,
        disabled,
    } = props;

    return (
        <Container
            className={_cs(className, styles.summary)}
            heading="Summary"
            headerActions={(
                <QuickActionButton
                    name={undefined}
                    disabled={disabled}
                >
                    <IoMdCreate />
                </QuickActionButton>
            )}
        >
            {summary ? (
                <div className={styles.summaryText}>
                    {summary.summary}
                </div>
            ) : (
                <div className={styles.noSummary}>
                    No Summary Found.
                </div>
            )}
        </Container>
    );
}

export default CountrySummary;
