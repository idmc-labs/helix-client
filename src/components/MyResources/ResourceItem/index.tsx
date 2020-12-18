import React, { useCallback, useContext } from 'react';
import {
    IoMdTrash,
    IoMdCreate,
} from 'react-icons/io';

import { gql, useMutation, MutationUpdaterFn } from '@apollo/client';

import QuickActionButton from '#components/QuickActionButton';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';
import DateCell from '#components/tableHelpers/Date';
import Loading from '#components/Loading';
import DomainContext from '#components/DomainContext';

import styles from './styles.css';
import {
    DeleteResourceMutation,
    DeleteResourceMutationVariables,
} from '#generated/types';

const DELETE_RESOURCE = gql`
    mutation DeleteResource($id: ID!) {
        deleteResource(id: $id) {
            errors {
                field
                messages
            }
            ok
            result {
                id
            }
        }
    }
`;

interface ResourceItemProps {
    title: string;
    lastAccessedOn: string;
    onSetResourceIdOnEdit: (id: string) => void;
    url: string;
    keyValue: string;
    onRemoveResourceFromCache: MutationUpdaterFn<DeleteResourceMutation>;
}

function ResourceItem(props: ResourceItemProps) {
    const {
        title,
        lastAccessedOn,
        keyValue,
        onSetResourceIdOnEdit,
        url,
        onRemoveResourceFromCache,
    } = props;

    const { user } = useContext(DomainContext);

    const resourcePermission = user?.permissions?.resource;

    const onSetEditableResourceItemId = useCallback(() => {
        onSetResourceIdOnEdit(keyValue);
    }, [keyValue, onSetResourceIdOnEdit]);

    const [deleteResource, {
        loading: deleteResourceLoading,
    }] = useMutation<DeleteResourceMutation, DeleteResourceMutationVariables>(
        DELETE_RESOURCE,
        {
            update: onRemoveResourceFromCache,
            onCompleted: (response) => {
                const { deleteResource: deleteResourceRes } = response;
                if (!deleteResourceRes) {
                    return;
                }
                const { errors } = deleteResourceRes;
                if (errors) {
                    // TODO: handle what to do if errors?
                }
                // TODO: handle what to do if not okay?
            },
            // TODO: handle onError
        },
    );

    const onDeleteResource = useCallback((id) => {
        if (!id) {
            return;
        }
        deleteResource({
            variables: { id },
        });
    }, [deleteResource]);

    return (
        <div
            className={styles.resourceItemContainer}
        >
            {deleteResourceLoading && <Loading /> }
            <div className={styles.itemRow}>
                <a
                    href={url}
                    className={styles.title}
                    rel="noreferrer"
                    target="_blank"
                >
                    {title}
                </a>
                <div className={styles.actionButtons}>
                    {resourcePermission?.change && (
                        <QuickActionButton
                            name={undefined}
                            onClick={onSetEditableResourceItemId}
                            disabled={deleteResourceLoading}
                            title="Edit"
                        >
                            <IoMdCreate />
                        </QuickActionButton>
                    )}
                    {resourcePermission?.delete && (
                        <QuickActionConfirmButton
                            name={undefined}
                            onConfirm={() => onDeleteResource(keyValue)}
                            confirmationHeader="Confirm Delete"
                            confirmationMessage="Are you sure you want to delete?"
                            className={styles.deleteButton}
                            disabled={deleteResourceLoading}
                            title="Delete"
                        >
                            <IoMdTrash />
                        </QuickActionConfirmButton>
                    )}
                </div>
            </div>
            <DateCell
                value={lastAccessedOn}
                className={styles.lastAccessedOn}
            />
        </div>
    );
}

export default ResourceItem;
