import { gql } from '@apollo/client';

export const FORM_OPTIONS = gql`
    query ExtractionFormOptions {
        figureCategoryList {
            results {
                id
                name
                type
            }
        }
        figureTermList {
            results {
                id
                name
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
        entryReviewStatus: __type(name: "REVIEW_STATUS") {
            name
            enumValues {
                name
                description
            }
        }
        displacementType: __type(name: "DISPLACEMENT_TYPE") {
            name
            enumValues {
                name
                description
            }
        }
        genderList: __type(name: "GENDER") {
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
            filterEntryReviewStatus
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
            filterFigureSexTypes
            filterFigureDisplacementTypes
            filterEventGlideNumber
            filterEntryCreatedBy {
              id
              fullName
            }
            filterFigureTerms {
                id
                isHousingRelated
                name
            }
            createdAt
            createdBy {
              fullName
              id
            }
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
                filterEntryReviewStatus
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
                filterEntryCreatedBy {
                    id
                    fullName
                }
                filterEventGlideNumber
                filterFigureSexTypes
                filterFigureDisplacementTypes
                filterFigureTerms {
                    id
                    name
                    isHousingRelated
                }
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
        $filterEntryArticleTitle: String,
        $filterEntryCreatedBy: [ID!],
        $filterEntryPublishers: [ID!],
        $filterEntryReviewStatus: [String!],
        $filterEntrySources: [ID!],
        $filterEventGlideNumber: String,
        $filterFigureCategoryTypes: [String!],
        $filterFigureDisplacementTypes: [String!],
        $filterFigureSexTypes: [String!],
        $filterFigureTerms: [ID!],
        $filterEvents: [ID!],
        $report: String
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
        filterEntryArticleTitle: $filterEntryArticleTitle,
        filterEntryCreatedBy: $filterEntryCreatedBy,
        filterEntryPublishers: $filterEntryPublishers,
        filterEntryReviewStatus: $filterEntryReviewStatus,
        filterEntrySources: $filterEntrySources,
        filterEventGlideNumber: $filterEventGlideNumber,
        filterFigureCategoryTypes: $filterFigureCategoryTypes,
        filterFigureDisplacementTypes: $filterFigureDisplacementTypes,
        filterFigureSexTypes: $filterFigureSexTypes,
        filterFigureTerms: $filterFigureTerms,
        filterEvents: $filterEvents,
        report: $report
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
        $filterEvents: [ID!],
        $filterEntryCreatedBy: [ID!],
        $filterEntryPublishers: [ID!],
        $filterEntryReviewStatus: [String!],
        $filterEntrySources: [ID!],
        $filterEventGlideNumber: String,
        $filterFigureCategoryTypes: [String!],
        $filterFigureDisplacementTypes: [String!],
        $filterFigureSexTypes: [String!],
        $filterFigureTerms: [ID!],
        $entry: ID
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
        filterEvents: $filterEvents,
        filterEntryCreatedBy: $filterEntryCreatedBy,
        filterEntryPublishers: $filterEntryPublishers,
        filterEntryReviewStatus: $filterEntryReviewStatus,
        filterEntrySources: $filterEntrySources,
        filterEventGlideNumber: $filterEventGlideNumber,
        filterFigureCategoryTypes: $filterFigureCategoryTypes,
        filterFigureDisplacementTypes: $filterFigureDisplacementTypes,
        filterFigureSexTypes: $filterFigureSexTypes,
        filterFigureTerms: $filterFigureTerms,
        entry: $entry
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
        $filterFigureCategoryTypes: [String!],
        $filterEventGlideNumber: String,
        $filterFigureSexTypes: [String!],
        $filterEntryCreatedBy: [ID!],
        $filterFigureTerms: [ID!],
        $filterFigureDisplacementTypes: [String!],
        $filterEntryReviewStatus: [String!],

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
            filterFigureTerms: $filterFigureTerms,
            filterFigureGeographicalGroups: $filterFigureGeographicalGroups,
            filterFigureCategoryTypes: $filterFigureCategoryTypes,
            filterEventGlideNumber: $filterEventGlideNumber,
            filterFigureSexTypes: $filterFigureSexTypes,
            filterEntryCreatedBy: $filterEntryCreatedBy,
            filterFigureDisplacementTypes: $filterFigureDisplacementTypes,
            filterEntryReviewStatus: $filterEntryReviewStatus,

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

export const FIGURE_LIST = gql`
query ExtractionFigureList(
    $ordering: String,
    $page: Int,
    $pageSize: Int,
    $event: String,
    $filterEntryArticleTitle: String,
    $filterEntryPublishers:[ID!],
    $filterEntrySources: [ID!],
    $filterEntryReviewStatus: [String!],
    $filterEntryCreatedBy: [ID!],
    $filterFigureCountries: [ID!],
    $filterFigureStartAfter: Date,
    $filterFigureEndBefore: Date,
    $filterFigureTerms: [ID!],
    $filterFigureSexTypes: [String!],
    $filterFigureRoles: [String!],
    $filterFigureRegions: [ID!],
    $filterFigureGeographicalGroups: [ID!],
    $filterFigureDisplacementTypes: [String!],
    $filterFigureCategoryTypes: [String!],
    $filterFigureCategories: [ID!],
    $filterEvents: [ID!],
    $filterEventGlideNumber: String,
    $filterEventCrisisTypes: [String!],
    $filterEventCrises: [ID!],
    $filterEntryTags: [ID!]
    ) {
    figureList(
        ordering: $ordering,
        page: $page,
        pageSize: $pageSize,
        event: $event,
        filterEntryArticleTitle: $filterEntryArticleTitle,
        filterEntryPublishers: $filterEntryPublishers,
        filterEntrySources: $filterEntrySources,
        filterEntryReviewStatus: $filterEntryReviewStatus,
        filterEntryCreatedBy: $filterEntryCreatedBy,
        filterFigureCountries: $filterFigureCountries,
        filterFigureStartAfter: $filterFigureStartAfter,
        filterFigureEndBefore: $filterFigureEndBefore,
        filterFigureTerms: $filterFigureTerms,
        filterFigureSexTypes: $filterFigureSexTypes,
        filterFigureRoles: $filterFigureRoles,
        filterFigureRegions: $filterFigureRegions,
        filterFigureGeographicalGroups: $filterFigureGeographicalGroups,
        filterFigureDisplacementTypes: $filterFigureDisplacementTypes,
        filterFigureCategoryTypes: $filterFigureCategoryTypes,
        filterFigureCategories: $filterFigureCategories,
        filterEvents: $filterEvents,
        filterEventGlideNumber: $filterEventGlideNumber,
        filterEventCrisisTypes: $filterEventCrisisTypes,
        filterEventCrises: $filterEventCrises,
        filterEntryTags: $filterEntryTags
        ) {
            page
            pageSize
            totalCount
            results {
                id
                createdAt
                createdBy {
                    id
                    fullName
                }
                category {
                    id
                    name
                }
                country {
                    id
                    name
                }
                entry {
                    id
                    articleTitle
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
                    event {
                        id
                        name
                        eventType
                        crisis {
                            id
                            name
                        }
                    }
                    isReviewed
                    isSignedOff
                    isUnderReview
                    totalStockIdpFigures(data: {categories: $filterFigureCountries, roles: $filterEntryReviewStatus, startDate: $filterFigureStartAfter, endDate: $filterFigureStartAfter})
                    totalFlowNdFigures(data: {categories: $filterFigureCountries, roles: $filterEntryReviewStatus, startDate: $filterFigureStartAfter, endDate: $filterFigureStartAfter})
                }
                role
                totalFigures
                term {
                    id
                    name
                }
                endDate
                startDate
            }
        }
    }
`;

export const FIGURE_DELETE = gql`
    mutation DeleteFigure($id: ID!) {
        deleteFigure(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;
