import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    TextInput,
    TabPanel,
} from '@togglecorp/toggle-ui';

import styles from './styles.css';

function Review() {
    return (
        <>
            <div className={styles.row}>
                <TextInput
                    className={styles.reviewAssigneeInput}
                    label="Assign Colleagues for Review"
                />
            </div>
        </>
    );
}

export default Review;
