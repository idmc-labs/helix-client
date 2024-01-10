import React from 'react';
import { Button, Modal, SelectInput } from '@togglecorp/toggle-ui';
import {
    gql, useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import Heading from '#components/Heading';
import {
    FigureRoleOptionsQuery,
    FigureRoleOptionsQueryVariables,
    TriggerBulkOperationMutationVariables,
} from '#generated/types';
import { enumKeySelector, enumLabelSelector, GetEnumOptions } from '#utils/common';

import styles from './styles.css';

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

type Role = NonNullable<NonNullable<NonNullable<TriggerBulkOperationMutationVariables['data']>['payload']>['figureRole']>['role'];

interface Props {
    className?: string;
    role: Role | null | undefined;
    totalFigureSelected?: number | null;
    handleRoleChange: React.Dispatch<React.SetStateAction<Role | null | undefined>>;
    onSubmitRole: () => void;
    onClose: () => void;
    disabled?: boolean;
}

function UpdateFigureRoleModal(props: Props) {
    const {
        className,
        role,
        totalFigureSelected,
        handleRoleChange,
        onSubmitRole,
        onClose,
        disabled,
    } = props;

    const {
        data,
        loading,
    } = useQuery<FigureRoleOptionsQuery, FigureRoleOptionsQueryVariables>(FIGURE_ROLE_OPTIONS);

    const roles = data?.figureRoleList?.enumValues;
    type RoleOptions = GetEnumOptions<
        typeof roles,
        NonNullable<typeof role>
    >;
    return (
        <div>
            <Modal
                className={_cs(className, styles.modal)}
                heading={(
                    <>
                        <Heading size="large">
                            Select figure role
                        </Heading>
                    </>
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
                            onClick={onSubmitRole}
                            variant="primary"
                            disabled={disabled}
                        >
                            Save
                        </Button>
                    </>
                )}
            >
                <Heading size="small">
                    {`No. of figures selected: ${totalFigureSelected}`}
                </Heading>
                <SelectInput
                    label="Role"
                    name="role"
                    options={roles as RoleOptions}
                    value={role}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    onChange={handleRoleChange}
                    disabled={loading}
                    readOnly={loading}
                />
            </Modal>
        </div>
    );
}

export default UpdateFigureRoleModal;
