import React, { useState, useCallback, useContext } from 'react';
import { Button, Modal, SelectInput } from '@togglecorp/toggle-ui';
import {
    gql, useMutation, useQuery,
} from '@apollo/client';
import { getOperationName } from 'apollo-link';
import { isDefined, _cs } from '@togglecorp/fujs';

import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import Heading from '#components/Heading';
import {
    ExtractionEntryListFiltersQueryVariables,
    FigureRoleOptionsQuery,
    FigureRoleOptionsQueryVariables,
    TriggerBulkOperationMutation,
    TriggerBulkOperationMutationVariables,
} from '#generated/types';
import { enumKeySelector, enumLabelSelector, GetEnumOptions } from '#utils/common';
import NotificationContext from '#components/NotificationContext';

import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

const FIGURE_ROLE_OPTIONS = gql`
    query FigureRoleOptions {
        figureRoleList : __type(name: "ROLE") {
            enumValues {
                name
                description
            }
        }
    }
`;

const FIGURES_ROLE_UPDATE = gql`
    mutation TriggerBulkOperation ($data: BulkApiOperationInputType!) {
        triggerBulkOperation(data: $data) {
            ok
            errors
            result {
                id
            }
        }
    }
`;

type Role = NonNullable<NonNullable<NonNullable<TriggerBulkOperationMutationVariables['data']>['payload']>['figureRole']>['role'];

interface Props {
    className?: string;
    filters: ExtractionEntryListFiltersQueryVariables['filters'] | null | undefined;
    mode: 'SELECT' | 'DESELECT';
    selectedFigures: string[];
    // NOTE: We cannot take the length of the selectedFigures as the mode might
    // be deselect
    totalSelectedFigures?: number | null;
    onClose: () => void;
    onSuccess: () => void;
}

function UpdateFigureRoleModal(props: Props) {
    const {
        className,
        mode,
        selectedFigures,
        totalSelectedFigures,
        filters,
        onClose,
        onSuccess,
    } = props;

    const [role, setRole] = useState<Role | undefined>();

    const {
        data,
        loading,
    } = useQuery<FigureRoleOptionsQuery, FigureRoleOptionsQueryVariables>(FIGURE_ROLE_OPTIONS);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const roles = data?.figureRoleList?.enumValues;
    type RoleOptions = GetEnumOptions<
        typeof roles,
        NonNullable<typeof role>
    >;

    const [
        triggerUpdateFigureRole,
        { loading: figureRoleUpdating },
    ] = useMutation<TriggerBulkOperationMutation, TriggerBulkOperationMutationVariables>(
        FIGURES_ROLE_UPDATE,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { triggerBulkOperation: figureResponse } = response;
                if (figureResponse?.ok) {
                    notify({
                        children: 'Changing role of selected figures started successfully',
                        variant: 'success',
                    });
                    onSuccess();
                    onClose();
                }
                if (figureResponse?.errors) {
                    notifyGQLError(figureResponse.errors);
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

    const handleRoleUpdate = useCallback(
        () => {
            if (isDefined(role)) {
                triggerUpdateFigureRole({
                    variables: {
                        data: {
                            action: 'FIGURE_ROLE',
                            payload: {
                                figureRole: {
                                    role,
                                },
                            },
                            filters: {
                                figureRole: {
                                    figure: {
                                        ...filters,
                                        filterFigureIds: mode !== 'DESELECT'
                                            ? selectedFigures
                                            : [],
                                        filterFigureExcludeIds: mode === 'DESELECT'
                                            ? selectedFigures
                                            : [],
                                    },
                                },
                            },
                        },
                    },
                });
            }
        },
        [
            role,
            filters,
            triggerUpdateFigureRole,
            mode,
            selectedFigures,
        ],
    );

    return (
        <div>
            <Modal
                className={_cs(className, styles.modal)}
                heading={(
                    <Heading size="large">
                        {`Change roles for ${totalSelectedFigures} figure(s)`}
                    </Heading>
                )}
                onClose={onClose}
                freeHeight
                footerClassName={styles.footer}
                footer={(
                    <>
                        <Button
                            name={undefined}
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            name={undefined}
                            onClick={handleRoleUpdate}
                            variant="primary"
                            disabled={figureRoleUpdating}
                        >
                            Save
                        </Button>
                    </>
                )}
            >
                <SelectInput
                    label="Role"
                    name="role"
                    options={roles as RoleOptions}
                    value={role}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    onChange={setRole}
                    disabled={loading || figureRoleUpdating}
                    readOnly={loading}
                />
            </Modal>
        </div>
    );
}

export default UpdateFigureRoleModal;
