import React, { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    IoCheckmarkCircle,
    IoCloseCircle,
} from 'react-icons/io5';

import {
    BulkApiOperationQuery,
    BulkApiOperationQueryVariables,
} from '#generated/types';
import Loading from '#components/Loading';

import styles from './styles.css';

const BULK_OPERATION = gql`
    query BulkApiOperation($id: ID!) {
        bulkApiOperation(id: $id) {
            successList {
                id
                frontendUrl
            }
            failureList {
                id
                frontendUrl
            }
            action
        }
    }
`;

interface Props {
    className?: string;
    id: string;
}

function BulkActionSummary(props: Props) {
    const {
        className,
        id,
    } = props;

    const variables = useMemo(
        (): BulkApiOperationQueryVariables => ({
            id,
        }),
        [id],
    );

    const {
        data,
        loading,
    } = useQuery<BulkApiOperationQuery>(BULK_OPERATION, { variables });

    return (
        <div className={_cs(className, styles.bulkActionSummary)}>
            {loading && <Loading absolute message={null} />}
            {data?.bulkApiOperation?.successList?.map((item) => (
                <div
                    className={styles.item}
                    key={item.id}
                >
                    <IoCheckmarkCircle className={styles.successIcon} />
                    <a
                        className={styles.title}
                        href={item.frontendUrl}
                    >
                        {`Figure ${item.id}`}
                    </a>
                </div>
            ))}
            {data?.bulkApiOperation?.failureList?.map((item) => (
                <div
                    key={item.id}
                    className={styles.item}
                >
                    <IoCloseCircle className={styles.failureIcon} />
                    <a
                        className={styles.title}
                        href={item.frontendUrl}
                    >
                        {`Figure ${item.id}`}
                    </a>
                </div>
            ))}
        </div>
    );
}

export default BulkActionSummary;
