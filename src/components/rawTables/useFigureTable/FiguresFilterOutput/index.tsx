import React from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { isDefined, isNotDefined } from '@togglecorp/fujs';

import { hasNoData } from '#utils/common';
import {
    ExtractionEntryListFiltersQueryVariables,
    ExtractionFormOptionsQuery,
} from '#generated/types';
import { EnumEntity, PurgeNull } from '#types';
import FilterOutput from '#components/FilterOutput';
import useOptions from '#hooks/useOptions';
import { formatDate } from '#components/DateTime';

function boolToStr(value: boolean | null | undefined) {
    if (isNotDefined(value)) {
        return undefined;
    }
    return String(value);
}

const FORM_OPTIONS = gql`
    query ExtractionFormOptions {
        figureCategoryList: __type(name: "FIGURE_CATEGORY_TYPES") {
            name
            enumValues {
                name
                description
            }
        }
        figureTermList: __type(name: "FIGURE_TERMS") {
            name
            enumValues {
                name
                description
            }
        }
        figureRoleList: __type(name: "ROLE") {
            name
            enumValues {
                name
                description
            }
        }
        crisisType: __type(name: "CRISIS_TYPE") {
            name
            enumValues {
                name
                description
            }
        }
        figureReviewStatus: __type(name: "FIGURE_REVIEW_STATUS") {
            name
            enumValues {
                name
                description
            }
        }
        violenceList {
            results {
                id
                name
                subTypes {
                    results {
                        id
                        name
                    }
                }
            }
        }
        contextOfViolenceList {
            results {
              id
              name
            }
        }
        disasterCategoryList {
            results {
                id
                name
                subCategories {
                    results {
                        id
                        name
                        types {
                            results {
                                id
                                name
                                subTypes {
                                    results {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`;

type Filter = PurgeNull<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>;

const categoryTypeOptions = [
    { name: 'FLOW', description: 'Flow' },
    { name: 'STOCK', description: 'Stock' },
];

const booleanOptions = [
    {
        name: 'true',
        description: 'Yes',
    },
    {
        name: 'false',
        description: 'No',
    },
];

const enumKeySelector = <T extends string | number>(d: EnumEntity<T>) => (
    d.name
);
const enumLabelSelector = <T extends string | number>(d: EnumEntity<T>) => (
    d.description ?? String(d.name)
);

interface Props {
    className?: string;
    filterState: Filter,
}

function FiguresFilterOutput(props: Props) {
    const {
        className,
        filterState,
    } = props;

    const rawFiguresFilter = filterState;

    const [eventOptions] = useOptions('event');
    const [countryOptions] = useOptions('country');
    const [crisisOptions] = useOptions('crisis');
    const [regionOptions] = useOptions('region');
    const [geographicGroupOptions] = useOptions('geographicGroup');
    const [contextOfViolenceOptions] = useOptions('contextOfViolence');
    const [userOptions] = useOptions('user');
    const [organizationOptions] = useOptions('organization');
    const [tagOptions] = useOptions('tag');

    const noData = hasNoData(rawFiguresFilter);

    const {
        data: filterOptions,
        // loading: queryOptionsLoading,
        // error: queryOptionsError,
    } = useQuery<ExtractionFormOptionsQuery>(FORM_OPTIONS);

    const violenceOptions = filterOptions?.violenceList?.results?.flatMap((violenceType) => (
        violenceType.subTypes?.results?.map((violenceSubType) => ({
            ...violenceSubType,
            violenceTypeId: violenceType.id,
            violenceTypeName: violenceType.name,
        }))
    )).filter(isDefined);

    // eslint-disable-next-line max-len
    const disasterSubTypeOptions = filterOptions?.disasterCategoryList?.results?.flatMap((disasterCategory) => (
        disasterCategory.subCategories?.results?.flatMap((disasterSubCategory) => (
            disasterSubCategory.types?.results?.flatMap((disasterType) => (
                disasterType.subTypes?.results?.map((disasterSubType) => ({
                    ...disasterSubType,
                    disasterTypeId: disasterType.id,
                    disasterTypeName: disasterType.name,
                    disasterSubCategoryId: disasterSubCategory.id,
                    disasterSubCategoryName: disasterSubCategory.name,
                    disasterCategoryId: disasterCategory.id,
                    disasterCategoryName: disasterCategory.name,
                }))
            ))
        ))
    )).filter(isDefined);

    if (noData) {
        return null;
    }

    return (
        <div className={className}>
            <FilterOutput
                label="Search"
                options={undefined}
                value={rawFiguresFilter.filterEntryArticleTitle}
                // FIXME: Do not use inline functions
                keySelector={() => '1'}
                labelSelector={() => rawFiguresFilter.filterEntryArticleTitle}
            />
            <FilterOutput
                label="Causes"
                options={filterOptions?.crisisType?.enumValues}
                value={rawFiguresFilter.filterFigureCrisisTypes}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                multi
            />
            <FilterOutput
                label="Crises"
                options={crisisOptions}
                value={rawFiguresFilter.filterFigureCrises}
                // FIXME: Do not use inline functions
                keySelector={(d) => d.id}
                labelSelector={(d) => d.name}
                multi
            />
            <FilterOutput
                label="Events"
                options={eventOptions}
                value={rawFiguresFilter.filterFigureEvents}
                // FIXME: Do not use inline functions
                keySelector={(d) => d.id}
                labelSelector={(d) => d.name}
                multi
            />
            <FilterOutput
                label="Terms"
                options={filterOptions?.figureTermList?.enumValues}
                value={rawFiguresFilter.filterFigureTerms}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                multi
            />
            <FilterOutput
                label="Roles"
                options={filterOptions?.figureRoleList?.enumValues}
                value={rawFiguresFilter.filterFigureRoles}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                multi
            />
            <FilterOutput
                label="Date from"
                options={undefined}
                value={rawFiguresFilter.filterFigureStartAfter}
                // FIXME: Do not use inline functions
                keySelector={() => '1'}
                labelSelector={() => formatDate(rawFiguresFilter.filterFigureStartAfter)}
            />
            <FilterOutput
                label="Date to"
                options={undefined}
                value={rawFiguresFilter.filterFigureEndBefore}
                // FIXME: Do not use inline functions
                keySelector={() => '1'}
                labelSelector={() => formatDate(rawFiguresFilter.filterFigureEndBefore)}
            />
            <FilterOutput
                label="Countries"
                options={countryOptions}
                value={rawFiguresFilter.filterFigureCountries}
                // FIXME: Do not use inline functions
                keySelector={(d) => d.id}
                labelSelector={(d) => d.idmcShortName}
                multi
            />
            <FilterOutput
                label="Regions"
                options={regionOptions}
                value={rawFiguresFilter.filterFigureRegions}
                // FIXME: Do not use inline functions
                keySelector={(d) => d.id}
                labelSelector={(d) => d.name}
                multi
            />
            <FilterOutput
                label="Geographic Regions"
                options={geographicGroupOptions}
                value={rawFiguresFilter.filterFigureGeographicalGroups}
                // FIXME: Do not use inline functions
                keySelector={(d) => d.id}
                labelSelector={(d) => d.name}
                multi
            />
            <FilterOutput
                label="Violence Types"
                options={violenceOptions}
                value={rawFiguresFilter.filterFigureViolenceSubTypes}
                // FIXME: Do not use inline functions
                keySelector={(d) => d.id}
                labelSelector={(d) => d.name}
                multi
            />
            <FilterOutput
                label="Context of Violence"
                options={contextOfViolenceOptions}
                value={rawFiguresFilter.filterFigureContextOfViolence}
                // FIXME: Do not use inline functions
                keySelector={(d) => d.id}
                labelSelector={(d) => d.name}
                multi
            />
            <FilterOutput
                label="Hazard Types"
                options={disasterSubTypeOptions}
                value={rawFiguresFilter.filterFigureDisasterSubTypes}
                // FIXME: Do not use inline functions
                keySelector={(d) => d.id}
                labelSelector={(d) => d.name}
                multi
            />
            <FilterOutput
                label="Created By"
                options={userOptions}
                value={rawFiguresFilter.filterFigureCreatedBy}
                // FIXME: Do not use inline functions
                keySelector={(d) => d.id}
                labelSelector={(d) => d.fullName}
                multi
            />
            <FilterOutput
                label="Publishers"
                options={organizationOptions}
                value={rawFiguresFilter.filterEntryPublishers}
                // FIXME: Do not use inline functions
                keySelector={(d) => d.id}
                labelSelector={(d) => d.name}
                multi
            />
            <FilterOutput
                label="Sources"
                options={organizationOptions}
                value={rawFiguresFilter.filterFigureSources}
                // FIXME: Do not use inline functions
                keySelector={(d) => d.id}
                labelSelector={(d) => d.name}
                multi
            />
            <FilterOutput
                label="Review Status"
                options={filterOptions?.figureReviewStatus?.enumValues}
                value={rawFiguresFilter.filterFigureReviewStatus}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                multi
            />
            <FilterOutput
                label="Tags"
                options={tagOptions}
                value={rawFiguresFilter.filterFigureTags}
                // FIXME: Do not use inline functions
                keySelector={(d) => d.id}
                labelSelector={(d) => d.name}
                multi
            />
            <FilterOutput
                label="Category Types"
                options={categoryTypeOptions}
                value={rawFiguresFilter.filterFigureCategoryTypes}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                multi
            />
            <FilterOutput
                label="Categories"
                options={filterOptions?.figureCategoryList?.enumValues}
                value={rawFiguresFilter.filterFigureCategories}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                multi
            />
            <FilterOutput
                label="Has Disaggregated Data"
                options={booleanOptions}
                value={boolToStr(rawFiguresFilter.filterFigureHasDisaggregatedData)}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
            />
            <FilterOutput
                label="Has Excerpt IDU"
                options={booleanOptions}
                value={boolToStr(rawFiguresFilter.filterFigureHasExcerptIdu)}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
            />
            <FilterOutput
                label="Has Housing Destruction"
                options={booleanOptions}
                value={boolToStr(rawFiguresFilter.filterFigureHasHousingDestruction)}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
            />
        </div>
    );
}
export default FiguresFilterOutput;
