import React from 'react';
// import { _cs } from '@togglecorp/fujs';
import {
    TextInput,
    // TabPanel,
} from '@togglecorp/toggle-ui';

import styles from './styles.css';

interface Props {
    disabled?: boolean;
}

function Review(props: Props) {
    const { disabled } = props;
    return (
        <>
            <div className={styles.row}>
                <TextInput
                    name="assignee"
                    value=""
                    className={styles.reviewAssigneeInput}
                    label="Assign Colleagues for Review"
                    disabled={disabled}
                />
            </div>
        </>
    );
}

export default Review;
