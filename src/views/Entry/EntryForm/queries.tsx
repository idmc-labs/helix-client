import { gql } from '@apollo/client';

export const ENTRY = gql`
    query Entry($id: ID!) {
        entry(id: $id) {
            associatedParkedItem {
                id
            }
            figures {
                results {
                    country {
                        id
                        name
                        boundingBox
                        iso2
                    }
                    excerptIdu
                    householdSize
                    id
                    includeIdu
                    isHousingDestruction
                    isDisaggregated
                    disaggregationConflict
                    disaggregationConflictCommunal
                    disaggregationConflictCriminal
                    disaggregationConflictOther
                    disaggregationConflictPolitical
                    disaggregationDisplacementRural
                    disaggregationDisplacementUrban
                    disaggregationLocationCamp
                    disaggregationLocationNonCamp
                    disaggregationSexFemale
                    disaggregationSexMale
                    disaggregationStrataJson {
                        date
                        uuid
                        value
                    }
                    disaggregationAgeJson {
                        ageFrom
                        ageTo
                        uuid
                        value
                    }
                    quantifier
                    reported
                    role
                    startDate
                    endDate
                    term
                    category {
                        id
                    }
                    unit
                    uuid
                    geoLocations {
                        results {
                            accuracy
                            alternativeNames
                            boundingBox
                            city
                            className
                            country
                            countryCode
                            displayName
                            houseNumbers
                            id
                            identifier
                            importance
                            lat
                            lon
                            moved
                            name
                            nameSuffix
                            osmId
                            osmType
                            placeRank
                            rank
                            state
                            street
                            type
                            uuid
                            wikiData
                            wikipedia
                        }
                    }
                }
            }
            articleTitle
            document {
                id
                attachment
            }
            event {
                id
                name
            }
            id
            idmcAnalysis
            calculationLogic
            caveats
            isConfidential
            preview {
                status
                id
                pdf
                remark
                url
            }
            publishDate
            publishers {
                results {
                    id
                    name
                }
            }
            reviewers {
                results {
                    id
                    email
                    fullName
                }
            }
            reviewing {
                id
                status
                createdAt
                reviewer {
                    id
                    fullName
                }
            }
            sources {
                results {
                    id
                    name
                }
            }
            sourceExcerpt
            tags {
                id
                name
            }
            url
            latestReviews {
                ageId
                field
                id
                figure {
                    id
                }
                geoLocation {
                    id
                }
                strataId
                value
                comment {
                    body
                    id
                    createdAt
                    createdBy {
                        id
                        fullName
                    }
                }
            }
        }
    }
`;

export const CREATE_ENTRY = gql`
    mutation CreateEntry($entry: EntryCreateInputType!){
        createEntry(data: $entry) {
            result {
                id
            }
            errors
        }
    }
`;

export const CREATE_ATTACHMENT = gql`
    mutation CreateAttachment($attachment: Upload!) {
        createAttachment(data: {attachment: $attachment, attachmentFor: "0"}) {
            errors
            ok
            result {
                attachment
                id
            }
        }
    }
`;

export const CREATE_SOURCE_PREVIEW = gql`
    mutation CreateSourcePreview($url: String!) {
        createSourcePreview(data: {url: $url}) {
            errors
            result {
                status
                id
                pdf
                remark
                url
            }
        }
    }
`;

export const UPDATE_ENTRY = gql`
    mutation UpdateEntry($entry: EntryUpdateInputType!){
        updateEntry(data: $entry) {
            result {
                id
            }
            errors
        }
    }
`;

export const CREATE_REVIEW_COMMENT = gql`
    mutation CreateReviewComment($data: ReviewCommentCreateInputType!){
        createReviewComment(data: $data) {
            ok
            result {
                entry {
                    id
                    latestReviews {
                        ageId
                        field
                        id
                        figure {
                            id
                        }
                        geoLocation {
                            id
                        }
                        strataId
                        value
                        comment {
                            body
                            id
                            createdAt
                            createdBy {
                                id
                                fullName
                            }
                        }
                    }
                }
            }
            errors
        }
    }
`;

export const FIGURE_OPTIONS = gql`
    query FigureOptionsForEntryForm {
        quantifierList: __type(name: "QUANTIFIER") {
            name
            enumValues {
                name
                description
            }
        }
        unitList: __type(name: "UNIT") {
            name
            enumValues {
                name
                description
            }
        }
        termList: __type(name: "TERM") {
            name
            enumValues {
                name
                description
            }
        }
        roleList: __type(name: "ROLE") {
            name
            enumValues {
                name
                description
            }
        }
        accuracyList: __type(name: "OSM_ACCURACY") {
            name
            enumValues {
                name
                description
            }
        }
        identifierList: __type(name: "IDENTIFIER") {
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
        figureTagList {
            results {
                id
                name
            }
        }
    }
`;

export const PARKED_ITEM_FOR_ENTRY = gql`
    query ParkedItemForEntry($id: ID!) {
        parkedItem(id: $id) {
            id
            title
            url
        }
    }
`;

export const EVENT_DETAILS = gql`
    query EventDetails($id: ID!) {
        event(id: $id) {
            countries {
                id
                name
            }
        }
    }
`;
