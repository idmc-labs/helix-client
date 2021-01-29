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
            countries {
                id
                name
            }
            crises {
                id
                name
            }
            eventAfter
            eventBefore
            figureCategories {
                id
                name
            }
            figureRoles
            figureTags {
                id
                name
            }
            id
            name
            regions {
                id
                name
            }
            articleTitle
        }
    }
`;

export const CREATE_EXTRACTION = gql`
    mutation CreateExtraction($extraction: CreateExtractInputType!){
        createExtraction(data: $extraction) {
            result {
                id
                articleTitle
                name
                countries {
                    id
                }
                crises {
                    id
                }
                eventAfter
                eventBefore
                figureCategories {
                    id
                }
                figureRoles
                figureTags {
                    id
                }
                regions {
                    id
                    name
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
                name
                articleTitle
                countries {
                    id
                }
                crises {
                    id
                }
                eventAfter
                eventBefore
                figureCategories {
                    id
                }
                figureRoles
                figureTags {
                    id
                }
                regions {
                    id
                    name
                }
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
        $countries: [String],
        $crises: [String],
        $eventAfter: Date,
        $eventBefore: Date,
        $figureCategories: [String],
        $figureRoles: [String],
        $figureTags: [String],
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $regions: [String],
        $articleTitle: String,
    ) {
        extractionEntryList(
            countries: $countries,
            crises: $crises,
            eventAfter: $eventAfter,
            eventBefore: $eventBefore,
            figureCategories: $figureCategories,
            figureRoles: $figureRoles,
            figureTags: $figureTags,
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            regions: $regions,
            articleTitle: $articleTitle,
        ) {
            page
            pageSize
            totalCount
            results {
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
                totalFigures
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
