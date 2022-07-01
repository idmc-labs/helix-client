import React, { useMemo, useContext } from 'react';
import { useParams } from 'react-router-dom';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Button,
    Modal,
} from '@togglecorp/toggle-ui';

import { MarkdownPreview } from '#components/MarkdownEditor';
import DomainContext from '#components/DomainContext';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import TextBlock from '#components/TextBlock';
import NumberBlock from '#components/NumberBlock';

import CrisisForm from '#components/forms/CrisisForm';
import EventsTable from '#components/tables/EventsTable';
import useModalState from '#hooks/useModalState';

import {
    CrisisQuery,
    CrisisQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const CRISIS = gql`
    query Crisis($id: ID!) {
        crisis(id: $id) {
            countries {
                id
                idmcShortName
            }
            crisisNarrative
            crisisType
            crisisTypeDisplay
            endDate
            id
            name
            startDate
            totalFlowNdFigures
            totalStockIdpFigures
        }
    }
`;

interface CrisisProps {
    className?: string;
}

function Crisis(props: CrisisProps) {
    const { className } = props;

    const { crisisId } = useParams<{ crisisId: string }>();

    const crisisVariables = useMemo(
        (): CrisisQueryVariables => ({
            id: crisisId,
        }),
        [crisisId],
    );

    const {
        data: crisisData,
        loading,
    } = useQuery<CrisisQuery, CrisisQueryVariables>(CRISIS, {
        variables: crisisVariables,
    });

    const { user } = useContext(DomainContext);
    const crisisPermissions = user?.permissions?.crisis;

    const [
        shouldShowAddCrisisModal,
        editableCrisisId,
        showAddCrisisModal,
        hideAddCrisisModal,
    ] = useModalState();

    return (
        <div className={_cs(styles.crisis, className)}>
            <PageHeader
                title={crisisData?.crisis?.name ?? 'Crisis'}
            />
            <Container
                className={styles.container}
                contentClassName={styles.details}
                heading="Details"
                headerActions={crisisPermissions?.change && (
                    <Button
                        name={crisisData?.crisis?.id}
                        onClick={showAddCrisisModal}
                        disabled={loading || !crisisData?.crisis?.id}
                    >
                        Edit Crisis
                    </Button>
                )}
            >
                {crisisData ? (
                    <div className={styles.stats}>
                        <TextBlock
                            label="Cause"
                            value={crisisData?.crisis?.crisisTypeDisplay}
                        />
                        <NumberBlock
                            label="New displacements"
                            value={crisisData?.crisis?.totalFlowNdFigures}
                        />
                        <NumberBlock
                            label="No. of IDPs"
                            value={crisisData?.crisis?.totalStockIdpFigures}
                        />
                        <TextBlock
                            label="Start Date"
                            value={crisisData?.crisis?.startDate}
                        />
                        <TextBlock
                            label="End Date"
                            value={crisisData?.crisis?.endDate}
                        />
                        <TextBlock
                            label="Countries"
                            value={crisisData?.crisis?.countries?.map((country) => country.idmcShortName).join(', ')}
                        />
                    </div>
                ) : (
                    'Details not available'
                )}
            </Container>
            <Container
                className={styles.container}
                heading="Narrative"
            >
                <MarkdownPreview
                    markdown={crisisData?.crisis?.crisisNarrative ?? 'Narrative not available'}
                />
            </Container>
            <EventsTable
                className={styles.largeContainer}
                // NOTE: replacing with a placeholder crisis so that the id is always defined
                crisis={crisisData?.crisis ?? { id: crisisId, name: '???' }}
            />
            {shouldShowAddCrisisModal && (
                <Modal
                    onClose={hideAddCrisisModal}
                    heading={editableCrisisId ? 'Edit Crisis' : 'Add Crisis'}
                    size="large"
                    freeHeight
                >
                    <CrisisForm
                        id={editableCrisisId}
                        onCrisisCreate={hideAddCrisisModal}
                        onCrisisFormCancel={hideAddCrisisModal}
                    />
                </Modal>
            )}
        </div>
    );
}

export default Crisis;
