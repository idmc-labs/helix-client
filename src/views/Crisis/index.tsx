import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';

import EventsTable from '#components/EventsTable';
import {
    CrisisQuery,
    CrisisQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const CRISIS = gql`
    query Crisis($id: ID!) {
        crisis(id: $id) {
            id
            crisisNarrative
            name
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

    const { data: crisisData } = useQuery<CrisisQuery, CrisisQueryVariables>(CRISIS, {
        variables: crisisVariables,
    });

    return (
        <div className={_cs(styles.crisis, className)}>
            <PageHeader
                title={crisisData?.crisis?.name ?? 'Crisis'}
            />
            <Container
                className={styles.container}
                heading="Summary"
            >
                {crisisData?.crisis?.crisisNarrative ?? 'Summary not available'}
            </Container>
            <>
                <PageHeader
                    title="Events"
                />
                <EventsTable
                    defaultCrisis={crisisData?.crisis}
                    showCrisisColumn={false}
                />
            </>
        </div>
    );
}

export default Crisis;
