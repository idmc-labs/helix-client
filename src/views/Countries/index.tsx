import React, { useState, useCallback } from 'react';
import { useParams, useHistory } from 'react-router-dom';
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

    const { countryId } = useParams<{ countryId: string }>();
    const { replace: historyReplace } = useHistory();

    const handleCountryChange = useCallback(
        (value: string) => {
            historyReplace(`/countries/${value}/`);
        },
        [historyReplace],
    );

    const {
        data: countries,
        loading: countriesLoading,
        error: countriesLoadingError,
    } = useQuery<CountryListQuery>(GET_COUNTRIES_LIST);

    const {
        data: countryData,
        loading: countryDataLoading,
        error: countryDataLoadingError,
    } = useQuery<CountryQuery>(COUNTRY, {
        variables: { id: countryId },
        skip: !countryId,
    });

    const loading = countriesLoading || countryDataLoading;
    const errored = !!countriesLoadingError || !!countryDataLoadingError;
    const disabled = loading || errored;

    return (
        <div className={_cs(className, styles.countries)}>
            <PageHeader
                title={(
                    <SelectInput
                        searchPlaceholder="Search for country"
                        options={countries?.countryList?.results}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                        name="country"
                        value={countryId}
                        onChange={handleCountryChange}
                        disabled={disabled}
                        nonClearable
                    />
                )}
            />
            {!!countryId && (
                <>
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
                                    disabled
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
                                disabled
                            />
                            <MyResources
                                className={styles.container}
                                country={countryId}
                            />
                        </div>
                    </div>
                    <div className={styles.fullWidth}>
                        <EntriesTable
                            heading="Country Entries"
                            className={styles.container}
                            country={countryId}
                        />
                        <CommunicationAndPartners
                            className={styles.container}
                            country={countryId}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

export default Countries;
