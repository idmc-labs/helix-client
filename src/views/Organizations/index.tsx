import React from 'react';
import { _cs } from '@togglecorp/fujs';

import PageHeader from '#components/PageHeader';
import OrganizationTable from '#components/OrganizationTable';

import styles from './styles.css';

interface OrganizationsProps {
    className?: string;
}
function Organizations(props: OrganizationsProps) {
    const { className } = props;
    return (
        <div className={_cs(styles.organizations, className)}>
            <PageHeader
                title="Organizations"
            />
            <OrganizationTable
                className={styles.container}
            />
        </div>
    );
}

export default Organizations;
