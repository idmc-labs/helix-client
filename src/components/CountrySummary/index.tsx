import React from 'react';
import { MutationUpdaterFn } from '@apollo/client';
import { IoMdAdd, IoMdCreate } from 'react-icons/io';
import { Modal } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import { CountryQuery, CreateSummaryMutation } from '#generated/types';

import Container from '#components/Container';
import QuickActionButton from '#components/QuickActionButton';

import CountrySummaryForm from './CountrySummaryForm';
import styles from './styles.css';

type Summary = NonNullable<CountryQuery['country']>['lastSummary'];

interface CountrySummaryProps {
    className?: string;
    summary: Summary;
    disabled: boolean;
    summaryFormOpened: boolean;
    onSummaryFormClose: () => void;
    onSummaryFormOpen: () => void;
    countryId: string;
    onAddNewSummaryInCache: MutationUpdaterFn<CreateSummaryMutation>;
}

function CountrySummary(props: CountrySummaryProps) {
    const {
        className,
        summary,
        disabled,
        countryId,
        onAddNewSummaryInCache,
        summaryFormOpened,
        onSummaryFormClose,
        onSummaryFormOpen,
    } = props;

    return (
        <Container
            className={_cs(className, styles.summary)}
            heading="Summary"
            headerActions={(
                <QuickActionButton
                    name={undefined}
                    disabled={disabled}
                    onClick={onSummaryFormOpen}
                >
                    {summary ? <IoMdCreate /> : <IoMdAdd />}
                </QuickActionButton>
            )}
        >
            {summaryFormOpened && (
                <Modal
                    heading="Summary Form"
                    onClose={onSummaryFormClose}
                >
                    <CountrySummaryForm
                        onSummaryFormClose={onSummaryFormClose}
                        country={countryId}
                        summary={summary?.summary}
                        onAddNewSummaryInCache={onAddNewSummaryInCache}
                    />
                </Modal>
            )}
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
