import React, { useCallback, useContext } from 'react';
import {
    IoTrashOutline,
} from 'react-icons/io5';

import { useMutation, gql } from '@apollo/client';

import BasicItem from '#components/BasicItem';
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
    selected?: boolean,
}

function FilterItem(props: FilterItemProps) {
    const {
        query,
        onRefetchQueries,
        onDelete,
        className,
        selected,
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
        <BasicItem
            className={className}
            selected={selected}
            actions={(
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={onDeleteExtractionQuery}
                    confirmationHeader="Confirm Delete"
                    confirmationMessage="Are you sure you want to delete?"
                    disabled={deleteExtractionQueryLoading}
                    title="Delete"
                    variant="danger"
                    transparent
                >
                    <IoTrashOutline />
                </QuickActionConfirmButton>
            )}
        >
            <SmartLink
                className={styles.name}
                route={route.extraction}
                attrs={{ queryId: query.id }}
            >
                {query.name}
            </SmartLink>
        </BasicItem>
    );
}

export default FilterItem;
