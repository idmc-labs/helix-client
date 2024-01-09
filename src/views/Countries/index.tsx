import React from 'react';
import { _cs } from '@togglecorp/fujs';
import PageHeader from '#components/PageHeader';
import CountriesTable from '#components/tables/CountriesTable';

import styles from './styles.css';

interface CountriesProps {
    className?: string;
}

function Countries(props: CountriesProps) {
    const { className } = props;

    return (
        <div className={_cs(styles.countries, className)}>
            <PageHeader
                title="Countries"
            />
            <CountriesTable
                className={styles.container}
            />
        </div>
    );
}

export default Countries;
