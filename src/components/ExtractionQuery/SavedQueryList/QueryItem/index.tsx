import React, { useCallback, useContext } from 'react';
import {
    IoMdTrash,
    IoMdCreate,
} from 'react-icons/io';

import { useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';

import QuickActionConfirmButton from '#components/QuickActionConfirmButton';
import QuickActionLink from '#components/QuickActionLink';

import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import {
    DeleteExtractionMutation,
    DeleteExtractionMutationVariables,
    ExtractionQueryListQuery,
} from '#generated/types';
import route from '#config/routes';

import styles from './styles.css';
import { DELETE_EXTRACTION } from '../../queries';

type ExtractionQuery = NonNullable<NonNullable<ExtractionQueryListQuery['extractionQueryList']>['results']>[number];

interface QueryItemProps {
    query: ExtractionQuery;
    onRefetchQueries: () => void;
    className?: string;
}

function QueryItem(props: QueryItemProps) {
    const {
        query,
        onRefetchQueries,
        className,
    } = props;

    const { user } = useContext(DomainContext);
    // TODO: Permission based action
    const { notify } = useContext(NotificationContext);

    const [
        deleteExtractionQuery,
        { loading: deleteExtractionQueryLoading },
    ] = useMutation<DeleteExtractionMutation, DeleteExtractionMutationVariables>(
        DELETE_EXTRACTION,
        {
            update: onRefetchQueries,
            onCompleted: (response) => {
                const { deleteExtraction: deleteExtractionRes } = response;
                if (!deleteExtractionRes) {
                    return;
                }
                const { errors, result } = deleteExtractionRes;
                if (errors) {
                    notify({ children: 'Sorry, the query could not be deleted!' });
                }
                if (result) {
                    notify({ children: 'Extraction Query deleted successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

    const onDeleteExtractionQuery = useCallback(() => {
        deleteExtractionQuery({
            variables: {
                id: query.id,
            },
        });
    }, [query.id]);

    return (
        <div className={_cs(styles.itemRow, className)}>
            <div
                className={styles.name}
            >
                {query.name}
            </div>
            <div className={styles.actionButtons}>
                <QuickActionLink
                    route={route.extraction}
                    attrs={{ queryId: query.id }}
                    title="Edit"
                    disabled={deleteExtractionQueryLoading}
                >
                    <IoMdCreate />
                </QuickActionLink>
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={onDeleteExtractionQuery}
                    confirmationHeader="Confirm Delete"
                    confirmationMessage="Are you sure you want to delete?"
                    className={styles.deleteButton}
                    disabled={deleteExtractionQueryLoading}
                    title="Delete"
                    variant="danger"
                >
                    <IoMdTrash />
                </QuickActionConfirmButton>
            </div>
        </div>
    );
}

export default QueryItem;
