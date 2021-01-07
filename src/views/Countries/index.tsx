import React, { useMemo, useState, useCallback } from 'react';
import produce from 'immer';
import { useParams, useHistory } from 'react-router-dom';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';
import Map, {
    MapContainer,
    MapBounds,
} from '@togglecorp/re-map';

import {
    gql,
    useQuery,
    MutationUpdaterFn,
} from '@apollo/client';
import {
    CountryQuery,
    CountryQueryVariables,
    CreateSummaryMutation,
    CreateContextualUpdateMutation,
} from '#generated/types';

import useBasicToggle from '#hooks/toggleBasicState';

import Wip from '#components/Wip';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import MyResources from '#components/MyResources';
import EntriesTable from '#components/EntriesTable';
import CommunicationAndPartners from '#components/CommunicationAndPartners';
import CountrySummary from '#components/CountrySummary';
import ContextualUpdate from '#components/ContextualUpdate';
import CountrySelectInput, { CountryOption } from '#components/CountrySelectInput';

import styles from './styles.css';

type Bounds = [number, number, number, number];

const COUNTRY = gql`
query Country($id: ID!) {
    country(id: $id) {
      lastContextualUpdate {
        id
        update
        createdAt
      }
      id
      name
      lastSummary {
        id
        summary
      }
      boundingBox
    }
  }
`;

const lightStyle = 'mapbox://styles/mapbox/light-v10';

interface CountriesProps {
    className?: string;
}

function Countries(props: CountriesProps) {
    const { className } = props;

    const { countryId } = useParams<{ countryId: string }>();
    const { replace: historyReplace } = useHistory();

    const handleCountryChange = useCallback(
        (value?: string) => {
            if (isDefined(value)) {
                historyReplace(`/countries/${value}/`);
            } else {
                historyReplace('/countries/');
            }
        },
        [historyReplace],
    );

    const [
        contextualFormOpened,
        handleContextualFormOpen,
        handleContextualFormClose,
    ] = useBasicToggle();

    const [
        summaryFormOpened,
        handleSummaryFormOpen,
        handleSummaryFormClose,
    ] = useBasicToggle();

    const countryVariables = useMemo(
        (): CountryQueryVariables | undefined => (
            countryId ? { id: countryId } : undefined
        ),
        [countryId],
    );
    const [countryOptions, setCountryOptions] = useState<CountryOption[] | undefined | null>();

    // NOTE: Find used because defaultCountryOption is the selected country
    const defaultCountryOption = countryOptions?.find((country) => country.id === countryId);

    const {
        data: countryData,
        loading: countryDataLoading,
        error: countryDataLoadingError,
    } = useQuery<CountryQuery>(COUNTRY, {
        variables: countryVariables,
        skip: !countryVariables,
        onCompleted: (response) => {
            if (response.country) {
                const { id, name } = response.country;
                setCountryOptions([{ id, name }]);
            }
        },
    });

    const loading = countryDataLoading;
    const errored = !!countryDataLoadingError;
    const disabled = loading || errored;

    const handleAddNewSummary: MutationUpdaterFn<
        CreateSummaryMutation
    > = useCallback(
        (cache, data) => {
            const summary = data?.data?.createSummary?.result;
            if (!summary) {
                return;
            }

            const cacheData = cache.readQuery<CountryQuery>({
                query: COUNTRY,
                variables: countryVariables,
            });

            const updatedValue = produce(cacheData, (safeCacheData) => {
                if (!safeCacheData?.country) {
                    return;
                }
                // eslint-disable-next-line no-param-reassign
                safeCacheData.country.lastSummary = summary;
            });

            if (updatedValue === cacheData) {
                return;
            }

            cache.writeQuery({
                query: COUNTRY,
                data: updatedValue,
                variables: countryVariables,
            });
        },
        [countryVariables],
    );

    const handleAddNewContextualUpdate: MutationUpdaterFn<
        CreateContextualUpdateMutation
    > = useCallback(
        (cache, data) => {
            const contextualUpdate = data?.data?.createContextualUpdate?.result;
            if (!contextualUpdate) {
                return;
            }

            const cacheData = cache.readQuery<CountryQuery>({
                query: COUNTRY,
                variables: countryVariables,
            });

            const updatedValue = produce(cacheData, (safeCacheData) => {
                if (!safeCacheData?.country) {
                    return;
                }
                // eslint-disable-next-line no-param-reassign
                safeCacheData.country.lastContextualUpdate = contextualUpdate;
            });

            if (updatedValue === cacheData) {
                return;
            }

            cache.writeQuery({
                query: COUNTRY,
                data: updatedValue,
                variables: countryVariables,
            });
        },
        [countryVariables],
    );

    const bounds = countryData?.country?.boundingBox ?? undefined;

    if (!countryId) {
        return (
            <div className={_cs(className, styles.countrySelection)}>
                <CountrySelectInput
                    name="country"
                    value={countryId}
                    onChange={handleCountryChange}
                    options={countryOptions}
                    onOptionsChange={setCountryOptions}
                    placeholder="Select a country"
                    nonClearable
                />
            </div>
        );
    }

    return (
        <div className={_cs(className, styles.countries)}>
            <PageHeader
                title={(
                    <CountrySelectInput
                        name="country"
                        value={countryId}
                        onChange={handleCountryChange}
                        options={countryOptions}
                        onOptionsChange={setCountryOptions}
                        placeholder="Select a country"
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
                                    <Map
                                        mapStyle={lightStyle}
                                        mapOptions={{
                                            logoPosition: 'bottom-left',
                                        }}
                                        scaleControlShown
                                        navControlShown
                                    >
                                        <MapContainer className={styles.mapContainer} />
                                        <MapBounds
                                            bounds={bounds as Bounds | undefined}
                                            padding={50}
                                        />
                                    </Map>
                                </Container>
                            </div>
                            <div className={styles.middle}>
                                <CountrySummary
                                    className={styles.container}
                                    summary={countryData?.country?.lastSummary}
                                    disabled={disabled}
                                    countryId={countryId}
                                    onAddNewSummaryInCache={handleAddNewSummary}
                                    summaryFormOpened={summaryFormOpened}
                                    onSummaryFormOpen={handleSummaryFormOpen}
                                    onSummaryFormClose={handleSummaryFormClose}
                                />
                                <Wip>
                                    <Container
                                        className={styles.container}
                                        heading="Recent Activity"
                                    />
                                </Wip>
                            </div>
                            <Wip>
                                <div>
                                    <Container
                                        className={styles.container}
                                        heading="Country Crises Overtime"
                                    />
                                </div>
                            </Wip>
                        </div>
                        <div className={styles.sideContent}>
                            <ContextualUpdate
                                className={styles.container}
                                contextualUpdate={countryData?.country?.lastContextualUpdate}
                                disabled={disabled}
                                contextualFormOpened={contextualFormOpened}
                                handleContextualFormOpen={handleContextualFormOpen}
                                handleContextualFormClose={handleContextualFormClose}
                                countryId={countryId}
                                onAddNewContextualUpdateInCache={handleAddNewContextualUpdate}
                            />
                            <MyResources
                                className={styles.container}
                                defaultCountryOption={defaultCountryOption}
                            />
                        </div>
                    </div>
                    <div className={styles.fullWidth}>
                        <EntriesTable
                            heading="Country Entries"
                            className={styles.largeContainer}
                            country={countryId}
                        />
                        <CommunicationAndPartners
                            className={styles.largeContainer}
                            defaultCountryOption={defaultCountryOption}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

export default Countries;
