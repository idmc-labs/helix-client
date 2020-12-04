import React from 'react';
import { MutationUpdaterFn } from '@apollo/client';
import { IoMdAdd, IoMdCreate, IoMdEye } from 'react-icons/io';
import { Modal } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import useBasicToggle from '#hooks/toggleBasicState';

import { CountryQuery, CreateSummaryMutation } from '#generated/types';

import Container from '#components/Container';
import QuickActionButton from '#components/QuickActionButton';
import MarkdownEditor from '#components/MarkdownEditor';

import CountrySummaryForm from './CountrySummaryForm';
import SummaryHistoryTable from './SummaryHistoryTable';
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

    const [
        summaryHistoryOpened,
        showSummaryHistory,
        hideSummaryHistory,
    ] = useBasicToggle();

    return (
        <Container
            className={_cs(className, styles.summary)}
            heading="Summary"
            headerActions={(
                <>
                    <QuickActionButton
                        name={undefined}
                        disabled={disabled}
                        onClick={onSummaryFormOpen}
                    >
                        {summary ? <IoMdCreate /> : <IoMdAdd />}
                    </QuickActionButton>
                    <QuickActionButton
                        name={undefined}
                        disabled={disabled}
                        onClick={showSummaryHistory}
                    >
                        <IoMdEye />
                    </QuickActionButton>
                </>
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
                    <MarkdownEditor
                        value={summary.summary}
                        name="update"
                        readOnly
                    />
                </div>
            ) : (
                <div className={styles.noSummary}>
                    No Summary Found.
                </div>
            )}
            {/* TODO: fix variable column width in table */}
            {summaryHistoryOpened && (
                <Modal
                    heading="Summary Update History"
                    onClose={hideSummaryHistory}
                >
                    {/* FIXME: view SummaryHistoryTable causes cache set to null */}
                    <SummaryHistoryTable
                        country={countryId}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default CountrySummary;
