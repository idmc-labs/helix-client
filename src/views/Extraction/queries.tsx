import { gql } from '@apollo/client';

export const FORM_OPTIONS = gql`
    query FormOptions {
        figureRoles: __type(name: "ROLE") {
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
            eventCountries {
                id
                name
            }
            eventCrises {
                id
                name
            }
            figureStartAfter
            figureEndBefore
            figureCategories {
                id
                name
            }
            figureRoles
            entryTags {
                id
                name
            }
            id
            name
            eventRegions {
                id
                name
            }
            entryArticleTitle
            eventCrisisType
        }
    }
`;

export const CREATE_EXTRACTION = gql`
    mutation CreateExtraction($extraction: CreateExtractInputType!){
        createExtraction(data: $extraction) {
            result {
                id
                eventCountries {
                    id
                    name
                }
                eventCrises {
                    id
                    name
                }
                figureStartAfter
                figureEndBefore
                figureCategories {
                    id
                    name
                }
                figureRoles
                entryTags {
                    id
                    name
                }
                id
                name
                eventRegions {
                    id
                    name
                }
                entryArticleTitle
                eventCrisisType
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
                eventCountries {
                    id
                    name
                }
                eventCrises {
                    id
                    name
                }
                figureStartAfter
                figureEndBefore
                figureCategories {
                    id
                    name
                }
                figureRoles
                entryTags {
                    id
                    name
                }
                id
                name
                eventRegions {
                    id
                    name
                }
                entryArticleTitle
                eventCrisisType
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

export const EXTRACTION_ENTRY_LIST = gql`
    query ExtractionEntryListFilters(
        $eventCountries: [ID!],
        $eventCrises: [ID!],
        $eventCrisisType: String,
        $eventRegions: [ID!],
        $entryArticleTitle: String,
        $entryTags: [ID!],
        $figureCategories: [ID!],
        $figureEndBefore: Date,
        $figureStartAfter: Date,
        $figureRoles: [String!],

        $ordering: String,
        $page: Int,
        $pageSize: Int,
    ) {
        extractionEntryList(
            eventCountries: $eventCountries,
            eventCrises: $eventCrises,
            eventCrisisType: $eventCrisisType,
            eventRegions: $eventRegions,
            entryArticleTitle: $entryArticleTitle,
            entryTags: $entryTags,
            figureCategories: $figureCategories,
            figureEndBefore: $figureEndBefore,
            figureStartAfter: $figureStartAfter,
            figureRoles: $figureRoles,
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
        ) {
            page
            pageSize
            totalCount
            results {
                totalStockFigures(data: {categories: $figureCategories, roles: $figureRoles, startDate: $figureStartAfter, endDate: $figureEndBefore})
                totalFlowFigures(data: {categories: $figureCategories, roles: $figureRoles, startDate: $figureStartAfter, endDate: $figureEndBefore})
                articleTitle
                createdAt
                id
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
