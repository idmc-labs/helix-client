import { gql } from '@apollo/client';

export const FORM_OPTIONS = gql`
    query FormOptions {
        filterFigureRoles: __type(name: "ROLE") {
            name
            enumValues {
                name
                description
            }
        }
        figureCategoryList {
            results {
                id
                name
                type
            }
        }
        crisisType: __type(name: "CRISIS_TYPE") {
            name
            enumValues {
                name
                description
            }
        }
        entryReviewStatus: __type(name: "REVIEW_STATUS") {
            name
            enumValues {
                name
                description
            }
        }
    }
`;

export const GET_SAVED_QUERY_LIST = gql`
    query ExtractionQueryList($search: String, $ordering: String, $page: Int, $pageSize: Int) {
        extractionQueryList(name_Icontains: $search, ordering: $ordering, page: $page, pageSize: $pageSize) {
            results {
                id
                name
            }
            totalCount
            pageSize
            page
        }
    }
`;

export const EXTRACTION_FILTER = gql`
    query ExtractionForForm($id: ID!) {
        extractionQuery(id: $id) {
            filterFigureCountries {
                id
                idmcShortName
            }
            filterEventCrises {
                id
                name
            }
            filterFigureStartAfter
            filterFigureEndBefore
            filterFigureCategories {
                id
                name
            }
            filterFigureRoles
            filterEntryTags {
                id
                name
            }
            id
            name
            filterFigureRegions {
                id
                name
            }
            filterFigureGeographicalGroups {
                id
                name
            }
            filterEntrySources {
                id
                name
            }
            filterEntryPublishers {
                id
                name
            }
            filterEntryArticleTitle
            filterEventCrisisTypes
        }
    }
`;

export const CREATE_EXTRACTION = gql`
    mutation CreateExtraction($extraction: CreateExtractInputType!){
        createExtraction(data: $extraction) {
            result {
                id
                filterFigureCountries {
                    id
                    idmcShortName
                }
                filterEventCrises {
                    id
                    name
                }
                filterFigureStartAfter
                filterFigureEndBefore
                filterFigureCategories {
                    id
                    name
                }
                filterFigureRoles
                filterEntryTags {
                    id
                    name
                }
                id
                name
                filterFigureRegions {
                    id
                    name
                }
                filterEntryArticleTitle
                filterEventCrisisTypes
            }
            errors
        }
    }
`;

export const UPDATE_EXTRACTION = gql`
    mutation UpdateExtraction($extraction: UpdateExtractInputType!) {
        updateExtraction(data: $extraction) {
            result {
                id
                filterFigureCountries {
                    id
                    idmcShortName
                }
                filterEventCrises {
                    id
                    name
                }
                filterFigureStartAfter
                filterFigureEndBefore
                filterFigureCategories {
                    id
                    name
                }
                filterFigureRoles
                filterEntryTags {
                    id
                    name
                }
                id
                name
                filterFigureRegions {
                    id
                    name
                }
                filterEntryArticleTitle
                filterEventCrisisTypes
            }
            errors
        }
    }
`;

export const DELETE_EXTRACTION = gql`
    mutation DeleteExtraction($id: ID!) {
        deleteExtraction(id: $id) {
            errors
            ok
            result {
                id
            }
        }
    }
`;

export const ENTRIES_DOWNLOAD = gql`
    mutation ExportEntries(
        $filterFigureStartAfter: Date,
        $filterFigureRoles: [String!],
        $filterFigureRegions: [ID!],
        $filterFigureGeographicalGroups: [ID!],
        $filterFigureEndBefore: Date,
        $filterFigureCountries: [ID!],
        $filterFigureCategories: [ID!],
        $filterEventCrisisTypes: [String!],
        $filterEventCrises: [ID!],
        $filterEntryTags: [ID!],
        $filterEntryArticleTitle: String
    ) {
       exportEntries(
        filterFigureStartAfter: $filterFigureStartAfter,
        filterFigureRoles: $filterFigureRoles,
        filterFigureRegions: $filterFigureRegions,
        filterFigureGeographicalGroups: $filterFigureGeographicalGroups,
        filterFigureEndBefore: $filterFigureEndBefore,
        filterFigureCountries: $filterFigureCountries,
        filterFigureCategories: $filterFigureCategories,
        filterEventCrisisTypes: $filterEventCrisisTypes,
        filterEventCrises: $filterEventCrises,
        filterEntryTags: $filterEntryTags,
        filterEntryArticleTitle: $filterEntryArticleTitle
        ){
           errors
            ok
        }
    }
`;

export const FIGURES_DOWNLOAD = gql`
    mutation ExportFigures(
        $filterFigureStartAfter: Date,
        $filterFigureRoles: [String!],
        $filterFigureRegions: [ID!],
        $filterFigureGeographicalGroups: [ID!],
        $filterFigureEndBefore: Date,
        $filterFigureCountries: [ID!],
        $filterFigureCategories: [ID!],
        $filterEventCrisisTypes: [String!],
        $filterEventCrises: [ID!],
        $filterEntryTags: [ID!],
        $filterEntryArticleTitle: String,
        $report: String,
        $filterEvents: [ID!]
    ) {
       exportFigures(
        filterFigureStartAfter: $filterFigureStartAfter,
        filterFigureRoles: $filterFigureRoles,
        filterFigureRegions: $filterFigureRegions,
        filterFigureGeographicalGroups: $filterFigureGeographicalGroups,
        filterFigureEndBefore: $filterFigureEndBefore,
        filterFigureCountries: $filterFigureCountries,
        filterFigureCategories: $filterFigureCategories,
        filterEventCrisisTypes: $filterEventCrisisTypes,
        filterEventCrises: $filterEventCrises,
        filterEntryTags: $filterEntryTags,
        filterEntryArticleTitle: $filterEntryArticleTitle,
        report: $report,
        filterEvents: $filterEvents
        ){
           errors
            ok
        }
    }
`;

export const EXTRACTION_ENTRY_LIST = gql`
    query ExtractionEntryListFilters(
        $filterFigureCountries: [ID!],
        $filterEventCrises: [ID!],
        $filterEventCrisisTypes: [String!],
        $filterFigureRegions: [ID!],
        $filterEntryArticleTitle: String,
        $filterEntryTags: [ID!],
        $filterFigureCategories: [ID!],
        $filterFigureEndBefore: Date,
        $filterFigureStartAfter: Date,
        $filterFigureRoles: [String!],
        $filterEntryPublishers: [ID!],
        $filterEntrySources: [ID!],
        $filterFigureGeographicalGroups: [ID!],

        $ordering: String,
        $page: Int,
        $pageSize: Int,
    ) {
        extractionEntryList(
            filterFigureCountries: $filterFigureCountries,
            filterEventCrises: $filterEventCrises,
            filterEventCrisisTypes: $filterEventCrisisTypes,
            filterFigureRegions: $filterFigureRegions,
            filterEntryArticleTitle: $filterEntryArticleTitle,
            filterEntryTags: $filterEntryTags,
            filterFigureCategories: $filterFigureCategories,
            filterFigureEndBefore: $filterFigureEndBefore,
            filterFigureStartAfter: $filterFigureStartAfter,
            filterFigureRoles: $filterFigureRoles,
            filterEntryPublishers: $filterEntryPublishers,
            filterEntrySources: $filterEntrySources,
            filterFigureGeographicalGroups: $filterFigureGeographicalGroups,

            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
        ) {
            page
            pageSize
            totalCount
            results {
                totalStockIdpFigures(data: {categories: $filterFigureCategories, roles: $filterFigureRoles, startDate: $filterFigureStartAfter, endDate: $filterFigureEndBefore})
                totalFlowNdFigures(data: {categories: $filterFigureCategories, roles: $filterFigureRoles, startDate: $filterFigureStartAfter, endDate: $filterFigureEndBefore})
                articleTitle
                createdAt
                id
                isReviewed
                isSignedOff
                isUnderReview
                createdBy {
                    fullName
                }
                publishDate
                publishers {
                    results {
                        id
                        name
                    }
                }
                sources {
                    results {
                        id
                        name
                    }
                }
                url
                event {
                    id
                    name
                    eventType
                    crisis {
                        id
                        name
                    }
                }
            }
        }
    }
`;

export const ENTRY_DELETE = gql`
    mutation DeleteEntry($id: ID!) {
        deleteEntry(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;
