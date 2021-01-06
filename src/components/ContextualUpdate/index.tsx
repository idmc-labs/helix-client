import React, { useContext } from 'react';
import { IoMdCreate, IoMdAdd, IoMdEye } from 'react-icons/io';
import { MutationUpdaterFn } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { Modal } from '@togglecorp/toggle-ui';

import Message from '#components/Message';
import Container from '#components/Container';
import MarkdownEditor from '#components/MarkdownEditor';
import DomainContext from '#components/DomainContext';

import DateCell from '#components/tableHelpers/Date';
import QuickActionButton from '#components/QuickActionButton';

import useBasicToggle from '#hooks/toggleBasicState';
import { CountryQuery, CreateContextualUpdateMutation } from '#generated/types';

import ContextualUpdateForm from './ContextualUpdateForm';
import ContextualHistoryList from './ContextualHistoryList';
import styles from './styles.css';

type ContextualUpdate = NonNullable<CountryQuery['country']>['lastContextualUpdate'];

interface CountryContextualUpdateProps {
    className?: string;
    contextualUpdate: ContextualUpdate;
    disabled: boolean;
    contextualFormOpened: boolean,
    handleContextualFormOpen: () => void,
    handleContextualFormClose: () => void,
    countryId: string;
    onAddNewContextualUpdateInCache: MutationUpdaterFn<CreateContextualUpdateMutation>;
}

function ContextualUpdate(props: CountryContextualUpdateProps) {
    const {
        className,
        contextualUpdate,
        disabled,
        contextualFormOpened,
        handleContextualFormOpen,
        handleContextualFormClose,
        countryId,
        onAddNewContextualUpdateInCache,
    } = props;

    const [
        contextualHistoryOpened,
        showContextualHistory,
        hideContextualHistory,
    ] = useBasicToggle();

    const { user } = useContext(DomainContext);
    const addContextualPermission = user?.permissions?.contextualupdate?.add;

    return (
        <Container
            className={_cs(className, styles.contextualUpdate)}
            contentClassName={styles.content}
            heading="Contextual Updates"
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
                            title={contextualUpdate ? 'Add' : 'Edit'}
                        >
                            {contextualUpdate ? <IoMdCreate /> : <IoMdAdd />}
                        </QuickActionButton>
                    )}
                </>
            )}
        >
            {contextualFormOpened && (
                <Modal
                    heading="Contextual Update"
                    onClose={handleContextualFormClose}
                >
                    <ContextualUpdateForm
                        onContextualUpdateFormClose={handleContextualFormClose}
                        country={countryId}
                        update={contextualUpdate?.update}
                        onAddNewContextualUpdateInCache={onAddNewContextualUpdateInCache}
                    />
                </Modal>
            )}
            {contextualUpdate ? (
                <>
                    <div className={styles.entryOn}>
                        Entry on
                        <DateCell
                            value={contextualUpdate.createdAt}
                            className={styles.createdAt}
                        />
                    </div>
                    <div className={styles.update}>
                        <MarkdownEditor
                            value={contextualUpdate.update}
                            name="update"
                            readOnly
                        />
                    </div>
                </>
            ) : (
                <Message
                    message="No contextual updates found."
                />
            )}
            {/* TODO: fix variable column width in table */}
            {contextualHistoryOpened && (
                <Modal
                    heading="Contextual Update History"
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

export default ContextualUpdate;
