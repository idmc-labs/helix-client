import React, { useContext } from 'react';
import { IoMdCreate, IoMdAdd, IoMdEye } from 'react-icons/io';
import { MutationUpdaterFn } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { Modal, DateTime } from '@togglecorp/toggle-ui';

import Message from '#components/Message';
import Container from '#components/Container';
import MarkdownEditor from '#components/MarkdownEditor';
import DomainContext from '#components/DomainContext';

import QuickActionButton from '#components/QuickActionButton';
import Row from '#components/Row';

import useBasicToggle from '#hooks/toggleBasicState';
import { CountryQuery, CreateContextualAnalysisMutation } from '#generated/types';

import ContextualAnalysisForm from './ContextualAnalysisForm';
import ContextualHistoryList from './ContextualHistoryList';
import styles from './styles.css';

type ContextualAnalysis = NonNullable<CountryQuery['country']>['lastContextualAnalysis'];

interface CountryContextualAnalysisProps {
    className?: string;
    contextualAnalysis: ContextualAnalysis;
    disabled: boolean;
    contextualFormOpened: boolean,
    handleContextualFormOpen: () => void,
    handleContextualFormClose: () => void,
    countryId: string;
    onAddNewContextualAnalysisInCache: MutationUpdaterFn<CreateContextualAnalysisMutation>;
}

function ContextualAnalysis(props: CountryContextualAnalysisProps) {
    const {
        className,
        contextualAnalysis,
        disabled,
        contextualFormOpened,
        handleContextualFormOpen,
        handleContextualFormClose,
        countryId,
        onAddNewContextualAnalysisInCache,
    } = props;

    const [
        contextualHistoryOpened,
        showContextualHistory,
        hideContextualHistory,
    ] = useBasicToggle();

    const { user } = useContext(DomainContext);
    const addContextualPermission = user?.permissions?.contextualanalysis?.add;

    return (
        <Container
            className={_cs(className, styles.contextualAnalysis)}
            contentClassName={styles.content}
            heading="Contextual Analyses"
            headerActions={(
                <>
                    <QuickActionButton
                        name={undefined}
                        disabled={disabled}
                        onClick={showContextualHistory}
                        title="View History"
                    >
                        <IoMdEye />
                    </QuickActionButton>
                    {addContextualPermission && (
                        <QuickActionButton
                            name={undefined}
                            disabled={disabled}
                            onClick={handleContextualFormOpen}
                            title={contextualAnalysis ? 'Edit' : 'Add'}
                        >
                            {contextualAnalysis ? <IoMdCreate /> : <IoMdAdd />}
                        </QuickActionButton>
                    )}
                </>
            )}
        >
            {contextualFormOpened && (
                <Modal
                    heading="Contextual Analysis"
                    onClose={handleContextualFormClose}
                >
                    <ContextualAnalysisForm
                        onContextualAnalysisFormClose={handleContextualFormClose}
                        country={countryId}
                        onAddNewContextualAnalysisInCache={onAddNewContextualAnalysisInCache}
                        contextualAnalysis={contextualAnalysis}
                    />
                </Modal>
            )}
            {contextualAnalysis ? (
                <>
                    {contextualAnalysis.crisisType && (
                        <Row className={styles.row}>
                            {contextualAnalysis.crisisType}
                        </Row>
                    )}
                    {contextualAnalysis.createdAt && (
                        <Row className={styles.row}>
                            Entry on
                            <DateTime
                                value={contextualAnalysis.createdAt}
                                className={styles.createdAt}
                            />
                        </Row>
                    )}
                    {contextualAnalysis.publishDate && (
                        <Row className={styles.row}>
                            Published on
                            <DateTime
                                value={contextualAnalysis.publishDate}
                                className={styles.publishedOn}
                            />
                        </Row>
                    )}
                    {contextualAnalysis.update && (
                        <Row className={_cs(styles.row, styles.update)}>
                            <MarkdownEditor
                                value={contextualAnalysis.update}
                                name="update"
                                readOnly
                            />
                        </Row>
                    )}
                </>
            ) : (
                <Message
                    message="No contextual analyses found."
                />
            )}
            {/* TODO: fix variable column width in table */}
            {contextualHistoryOpened && (
                <Modal
                    heading="Contextual Analysis History"
                    onClose={hideContextualHistory}
                >
                    {/* FIXME: view ContextualHistoryList sets cache to null */}
                    <ContextualHistoryList
                        country={countryId}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default ContextualAnalysis;
