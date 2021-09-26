import React, { useContext } from 'react';
import { MutationUpdaterFn } from '@apollo/client';
import { IoMdAdd, IoMdCreate, IoMdEye } from 'react-icons/io';
import { Modal } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import useBasicToggle from '#hooks/toggleBasicState';

import { CountryQuery, CreateSummaryMutation } from '#generated/types';

import Message from '#components/Message';
import Container from '#components/Container';
import QuickActionButton from '#components/QuickActionButton';
import { MarkdownPreview } from '#components/MarkdownEditor';
import DomainContext from '#components/DomainContext';

import CountrySummaryForm from './CountrySummaryForm';
import SummaryHistoryList from './SummaryHistoryList';
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
    const { user } = useContext(DomainContext);

    const summaryPermission = user?.permissions?.summary;

    return (
        <Container
            className={_cs(className, styles.summary)}
            contentClassName={styles.content}
            heading="Summary"
            headerActions={(
                <>
                    <QuickActionButton
                        name={undefined}
                        disabled={disabled}
                        onClick={showSummaryHistory}
                        title="View History"
                    >
                        <IoMdEye />
                    </QuickActionButton>
                    {(summaryPermission?.add || summaryPermission?.change) && (
                        <QuickActionButton
                            name={undefined}
                            disabled={disabled}
                            onClick={onSummaryFormOpen}
                            title={summary ? 'Edit' : 'Add'}
                        >
                            {summary ? <IoMdCreate /> : <IoMdAdd />}
                        </QuickActionButton>
                    )}
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
                    <MarkdownPreview
                        markdown={summary.summary}
                    />
                </div>
            ) : (
                <Message
                    message="No summary found."
                />
            )}
            {/* TODO: fix variable column width in table */}
            {summaryHistoryOpened && (
                <Modal
                    heading="Summary Update History"
                    onClose={hideSummaryHistory}
                >
                    {/* FIXME: view SummaryHistoryList causes cache set to null */}
                    <SummaryHistoryList
                        country={countryId}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default CountrySummary;
