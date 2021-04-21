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
                name
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
                    name
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
                    name
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
        $sourcesByIds: [ID!],
         $publishersByIds: [ID!],
         $isConfidential: Boolean,
         $event: ID,
         $createdByIds: [ID!],
         $countries: [ID!],
         $articleTitleContains: String
    ) {
       exportEntries(
           sourcesByIds: $sourcesByIds,
           publishersByIds: $publishersByIds,
           isConfidential: $isConfidential,
           event: $event,
           createdByIds: $createdByIds,
           countries: $countries, 
           articleTitleContains: $articleTitleContains
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
