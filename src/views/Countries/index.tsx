import React, { useState, useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';

import { SelectInput } from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';
import {
    BasicEntity,
} from '#types';
import {
    CountryListQuery,
    CountryQuery,
} from '#generated/types';

import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import MyResources from '#components/MyResources';
import EntriesTable from '#components/EntriesTable';
import CommunicationAndPartners from '#components/CommunicationAndPartners';

import CountrySummary from './CountrySummary';
import ContextualUpdates from './ContextualUpdates';
import styles from './styles.css';

const GET_COUNTRIES_LIST = gql`
query CountryList {
    countryList {
      results {
        id
        name
      }
    }
  }
`;

const COUNTRY = gql`
query Country($id: ID!) {
    country(id: $id) {
      contextualUpdates {
        results {
          id
          update
          createdAt
        }
      }
      lastSummary {
        id
        summary
      }
    }
  }
`;

interface CountriesProps {
    className?: string;
}

function Countries(props: CountriesProps) {
    const { className } = props;

    // TODO: initialize selectedCountry from user's data
    const [selectedCountry, setSelectedCountry] = useState<BasicEntity['id']>('1');
    const {
        data: countries,
        loading: countriesLoading,
        error: countriesLoadingError,
    } = useQuery<CountryListQuery>(GET_COUNTRIES_LIST);

    const countriesList = countries?.countryList?.results;

    const contactsVariables = useMemo(
        () => ({
            id: selectedCountry,
        }),
        [selectedCountry],
    );

    const {
        data: countryData,
        loading: countryDataLoading,
        error: countryDataLoadingError,
    } = useQuery<CountryQuery>(COUNTRY, {
        variables: contactsVariables,
    });

    const loading = countriesLoading || countryDataLoading;
    const errored = !!countriesLoadingError || !!countryDataLoadingError;
    const disabled = loading || errored;

    return (
        <div className={_cs(className, styles.countries)}>
            <PageHeader
                title="Countries"
                actions={(
                    <SelectInput
                        options={countriesList}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                        name="country"
                        value={selectedCountry}
                        onChange={setSelectedCountry}
                        disabled={disabled}
                    />
                )}
            />
            <div className={styles.content}>
                <div className={styles.leftContent}>
                    <div className={styles.top}>
                        <Container
                            className={styles.container}
                            heading="IDP Map"
                        >
                            <div className={styles.dummyContent} />
                        </Container>
                    </div>
                    <div className={styles.middle}>
                        <CountrySummary
                            className={styles.container}
                            summary={countryData?.country?.lastSummary}
                            disabled={disabled}
                        />
                        <Container
                            className={styles.container}
                            heading="Recent Activity"
                        >
                            <div className={styles.dummyContent} />
                        </Container>
                    </div>
                    <div>
                        <Container
                            className={styles.container}
                            heading="Country Crises Overtime"
                        >
                            <div className={styles.dummyContent} />
                        </Container>
                    </div>
                </div>
                <div className={styles.sideContent}>
                    <ContextualUpdates
                        className={styles.container}
                        contextualUpdates={countryData?.country?.contextualUpdates?.results}
                        disabled={disabled}
                    />
                    <MyResources
                        className={styles.container}
                        country={selectedCountry}
                    />
                </div>
            </div>
            <div className={styles.fullWidth}>
                <EntriesTable
                    heading="Country Entries"
                    className={styles.container}
                    country={selectedCountry}
                />
                <CommunicationAndPartners
                    className={styles.container}
                />
            </div>
        </div>
    );
}

export default Countries;
