import React from 'react';
import { _cs } from '@togglecorp/fujs';

import PageHeader from '#components/PageHeader';
import ContactsTable from '#components/tables/ContactsTable';

import styles from './styles.css';

interface ContactsProps {
    className?: string;
}
function Contacts(props: ContactsProps) {
    const { className } = props;
    return (
        <div className={_cs(styles.contacts, className)}>
            <PageHeader
                title="Contacts"
            />
            <ContactsTable
                className={styles.container}
            />
        </div>
    );
}

export default Contacts;
