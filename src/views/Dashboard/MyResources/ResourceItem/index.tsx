import React, { useCallback } from 'react';
import {
    IoIosCreate, IoIosRemove,
} from 'react-icons/io';
import { _cs } from '@togglecorp/fujs';
import {
    ConfirmButton,
} from '@togglecorp/toggle-ui';

import { gql, useMutation, MutationUpdaterFn } from '@apollo/client';

import QuickActionButton from '#components/QuickActionButton';
import DateCell from '#components/tableHelpers/Date';

import styles from './styles.css';
import { Resource } from '../myResources.interface';

interface DeleteResourceVariables {
    id: string | undefined,
}

interface DeleteResourceResponse {
    deleteResource:
    {
        ok: boolean,
        errors?: {
            field: string,
            message: string,
        }[],
        resource: {
            id: string,
        },
    }
}

const DELETE_RESOURCE = gql`
    mutation DeleteResource($id: ID!) {
        deleteResource(id: $id) {
            errors {
                field
                messages
            }
            ok
            resource {
                id
            }
        }
    }
`;

interface GetResoucesListResponse {
    resourceList: {
        results: Resource[],
    };
}

const GET_RESOURCES_LIST = gql`
    query MyQuery {
        resourceList {
          results {
            id
            name
            url
            createdAt
            lastAccessedOn
            group {
              id
              name
            }
            countries {
                id
            }
          }
        }
      }
`;

const handleRemoveResourceFromCache: MutationUpdaterFn<{
    deleteResource: { resource: { id: Resource['id']} }
}> = (cache, data) => {
    const resId = data.data?.deleteResource.resource.id;

    if (!resId) {
        return;
    }

    const cacheResources = cache.readQuery<GetResoucesListResponse>({
        query: GET_RESOURCES_LIST,
    });
    const results = cacheResources?.resourceList.results ?? [];

    const newResults = [...results].filter((res) => res.id !== resId);
    cache.writeQuery({
        query: GET_RESOURCES_LIST,
        data: {
            resourceList: {
                __typename: 'ResourceListType', // TODO figure out way for this
                results: newResults,
            },
        },
    });
};

interface ResourceItemProps {
    title: string,
    lastAccessedOn: string,
    onSetResourceIdOnEdit: (id: string) => void,
    url: string,
    keyValue: string,
}

function ResourceItem(props: ResourceItemProps) {
    const {
        title,
        lastAccessedOn,
        keyValue,
        onSetResourceIdOnEdit,
        url,
    } = props;

    const onSetEditableResourceItemId = useCallback(() => {
        onSetResourceIdOnEdit(keyValue);
    }, [keyValue, onSetResourceIdOnEdit]);

    const [deleteResource,
        {
            loading: deleteResourceLoading, // TODO: Handle loading
        },
    ] = useMutation<DeleteResourceResponse, DeleteResourceVariables>(
        DELETE_RESOURCE,
        {
            update: handleRemoveResourceFromCache,
            onCompleted: (response: DeleteResourceResponse) => {
                if (response.deleteResource.errors) {
                    // FIXME: handle error
                }
            },
            // FIXME: handle error
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
            <div className={styles.firstRow}>
                <a
                    href={url}
                    className={styles.title}
                    rel="noreferrer"
                    target="_blank"
                >
                    {title}
                </a>
                <div className={styles.actionButtons}>
                    <QuickActionButton
                        onClick={onSetEditableResourceItemId}
                        name="edit-resource"
                    >
                        <IoIosCreate />
                    </QuickActionButton>
                    <ConfirmButton
                        name="delete-resource"
                        onConfirm={() => onDeleteResource(keyValue)}
                        confirmationHeader="Confirm Delete"
                        confirmationMessage="Are you sure you want to delete?"
                        className={styles.deleteButton}
                    >
                        <IoIosRemove />
                    </ConfirmButton>
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
