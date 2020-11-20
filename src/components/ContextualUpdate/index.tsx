import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { IoMdCreate, IoMdDownload, IoMdAdd } from 'react-icons/io';
import { Modal } from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import { CountryQuery } from '#generated/types';

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
    countryId: string | undefined;
    onHandleRefetchCountry: () => void;
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
        onHandleRefetchCountry,
    } = props;
    return (
        <Container
            className={_cs(className, styles.contextualUpdate)}
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
                        onRefetchCountry={onHandleRefetchCountry}
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
                        {contextualUpdate.update}
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
