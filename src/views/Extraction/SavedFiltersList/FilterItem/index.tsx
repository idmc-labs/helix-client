import React, { useCallback, useContext } from 'react';
import {
    IoMdTrash,
} from 'react-icons/io';

import { useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';

import QuickActionConfirmButton from '#components/QuickActionConfirmButton';
import SmartLink from '#components/SmartLink';

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

interface FilterItemProps {
    query: ExtractionQuery;
    onRefetchQueries?: () => void;
    className?: string;
    onDelete: (id: string) => void;
}

function FilterItem(props: FilterItemProps) {
    const {
        query,
        onRefetchQueries,
        onDelete,
        className,
    } = props;

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
                    notify({ children: 'Query deleted successfully!' });
                    onDelete(query.id);
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
    }, [query.id, deleteExtractionQuery]);

    return (
        <div className={_cs(styles.itemRow, className)}>
            <SmartLink
                className={styles.name}
                route={route.extraction}
                attrs={{ queryId: query.id }}
            >
                {query.name}
            </SmartLink>
            <div className={styles.actionButtons}>
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

export default FilterItem;
