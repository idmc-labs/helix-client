import React from 'react';
import { IoMdCreate, IoMdDownload, IoMdAdd } from 'react-icons/io';
import { MutationUpdaterFn } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { Modal } from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import MarkdownEditor from '#components/MarkdownEditor';
import { CountryQuery, CreateContextualUpdateMutation } from '#generated/types';

import DateCell from '#components/tableHelpers/Date';
import QuickActionButton from '#components/QuickActionButton';

import ContextualUpdateForm from './ContextualUpdateForm';
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

    return (
        <Container
            className={_cs(className, styles.contextualUpdate)}
            heading="Contextual Updates"
            headerActions={(
                <>
                    <QuickActionButton
                        name={undefined}
                        disabled
                    >
                        <IoMdDownload />
                    </QuickActionButton>
                    <QuickActionButton
                        name={undefined}
                        disabled={disabled}
                        onClick={handleContextualFormOpen}
                    >
                        {contextualUpdate ? <IoMdCreate /> : <IoMdAdd />}
                    </QuickActionButton>
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
                <div className={styles.noUpdate}>
                    No Contextual Updates Found.
                </div>
            )}
        </Container>
    );
}

export default ContextualUpdate;
