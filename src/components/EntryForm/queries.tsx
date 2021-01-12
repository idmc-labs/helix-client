import { gql } from '@apollo/client';

export const ENTRY = gql`
    query Entry($id: ID!) {
        entry(id: $id) {
            figures {
                results {
                    country {
                        id
                        name
                        boundingBox
                        iso2
                    }
                    conflict
                    conflictCommunal
                    conflictCriminal
                    conflictOther
                    conflictPolitical
                    displacementRural
                    displacementUrban
                    district
                    excerptIdu
                    householdSize
                    id
                    includeIdu
                    isDisaggregated
                    locationCamp
                    locationNonCamp
                    quantifier
                    reported
                    role
                    sexFemale
                    sexMale
                    startDate
                    endDate
                    strataJson {
                        date
                        uuid
                        value
                    }
                    term
                    totalFigures
                    town
                    type
                    unit
                    uuid
                    ageJson {
                        ageFrom
                        ageTo
                        uuid
                        value
                    }
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
                            reportedName
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
                completed
                pdf
                url
                reason
                id
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
            tags
            totalFigures
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
                    }
                }
            }
            errors
        }
    }
`;
