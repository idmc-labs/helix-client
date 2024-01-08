import React from 'react';
import { Button, Modal, SelectInput } from '@togglecorp/toggle-ui';
import {
    gql, useQuery,
} from '@apollo/client';
import { noOp, _cs } from '@togglecorp/fujs';
import Heading from '#components/Heading';
import { FigureRoleOptionsQuery, FigureRoleOptionsQueryVariables } from '#generated/types';
import { enumKeySelector, enumLabelSelector } from '#utils/common';

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

// type FigureRoleOptions = GetEnumOptions<
//     NonNullable<FigureRoleOptionsQuery['role']>['enumValues'],
//     NonNullable<FigureRoleOptionsQuery['role']>['enumValues']
// >;
interface Props {
    className?: string;
    onClose: () => void;
    handleRoleChange: React.Dispatch<React.SetStateAction<string | undefined>>;
    role: string | undefined;
}

function UpdateFigureRoleModal(props: Props) {
    const {
        className,
        onClose,
        handleRoleChange,
        role,
    } = props;

    const {
        data,
        loading,
    } = useQuery<FigureRoleOptionsQuery, FigureRoleOptionsQueryVariables>(FIGURE_ROLE_OPTIONS);

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
                            onClick={noOp}
                            variant="primary"
                        >
                            Save
                        </Button>
                    </>
                )}
            >
                { /* TODO: update dynamically */ }
                <Heading size="small">
                    No. of figures selected: 2
                </Heading>
                <SelectInput
                    label="Role"
                    name="role"
                    options={data?.figureRoleList?.enumValues}
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
