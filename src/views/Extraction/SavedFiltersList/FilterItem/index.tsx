import React, { useCallback, useContext } from 'react';
import {
    IoMdTrash,
} from 'react-icons/io';

import { useMutation, gql } from '@apollo/client';
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

const DELETE_EXTRACTION = gql`
    mutation DeleteExtraction($id: ID!) {
        deleteExtraction(id: $id) {
            errors
            ok
            result {
                id
            }
        }
    }
`;

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

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

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
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: 'Query deleted successfully!',
                        variant: 'success',
                    });
                    onDelete(query.id);
                }
            },
            onError: (error) => {
                notify({
                    children: error.message,
                    variant: 'error',
                });
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
