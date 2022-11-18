import React, { useCallback, useContext } from 'react';
import {
    IoTrashOutline,
    IoCreateOutline,
} from 'react-icons/io5';
import { DateTime } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import { gql, useMutation, MutationUpdaterFn } from '@apollo/client';

import BasicItem from '#components/BasicItem';
import QuickActionButton from '#components/QuickActionButton';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';
import DomainContext from '#components/DomainContext';

import styles from './styles.css';
import {
    DeleteResourceMutation,
    DeleteResourceMutationVariables,
} from '#generated/types';

const DELETE_RESOURCE = gql`
    mutation DeleteResource($id: ID!) {
        deleteResource(id: $id) {
            errors
            ok
            result {
                id
            }
        }
    }
`;

interface ResourceItemProps {
    title: string;
    lastAccessedOn: string | null | undefined;
    onSetResourceIdOnEdit: (id: string) => void;
    url: string;
    keyValue: string;
    onRemoveResourceFromCache: MutationUpdaterFn<DeleteResourceMutation>;
    className?: string;
}

function ResourceItem(props: ResourceItemProps) {
    const {
        title,
        lastAccessedOn,
        keyValue,
        onSetResourceIdOnEdit,
        url,
        onRemoveResourceFromCache,
        className,
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
        <BasicItem
            className={_cs(className, styles.resourceItemContainer)}
            actions={(
                <>
                    {resourcePermission?.change && (
                        <QuickActionButton
                            name={undefined}
                            onClick={onSetEditableResourceItemId}
                            disabled={deleteResourceLoading}
                            title="Edit"
                            transparent
                        >
                            <IoCreateOutline />
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
                            variant="danger"
                            transparent
                        >
                            <IoTrashOutline />
                        </QuickActionConfirmButton>
                    )}
                </>
            )}
        >
            <a
                className={styles.title}
                href={url}
                rel="noreferrer"
                target="_blank"
            >
                {title}
            </a>
            <DateTime
                value={lastAccessedOn}
                className={styles.lastAccessedOn}
            />
        </BasicItem>
    );
}

export default ResourceItem;
