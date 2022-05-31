import { gql } from '@apollo/client';

export const ENTRY = gql`
    query Entry($id: ID!) {
        entry(id: $id) {
            associatedParkedItem {
                id
            }
            figures {
                country {
                    id
                    idmcShortName
                    boundingBox
                    iso2
                }
                excerptIdu
                sourceExcerpt
                calculationLogic
                caveats
                tags {
                    id
                    name
                }
                event {
                    id
                    name
                    eventType
                    countries {
                        id
                        idmcShortName
                        boundingBox
                        iso2
                    }
                    violenceSubType {
                        id
                        name
                    }
                    osvSubType {
                        id
                        name
                    }
                    otherSubType {
                        id
                        name
                    }
                    disasterSubType {
                        id
                        name
                    }
                    contextOfViolence {
                        id
                        name
                    }
                }
                figureCause
                violenceSubType {
                    id
                    name
                }
                osvSubType {
                    id
                    name
                }
                otherSubType {
                    id
                    name
                }
                disasterSubType {
                    id
                    name
                }
                contextOfViolence {
                    id
                    name
                }
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
                disaggregationLgbtiq
                disaggregationIndigenousPeople
                disaggregationDisability
                disaggregationAge {
                    results{
                        category {
                            id
                            name
                        }
                        sex
                        uuid
                        value
                        id
                    }
                }
                quantifier
                reported
                role
                startDate
                endDate
                startDateAccuracy
                endDateAccuracy
                term
                category
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
            articleTitle
            document {
                id
                attachment
            }
            documentUrl
            id
            idmcAnalysis
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
                    breakdown
                    methodology
                }
            }
            reviewers {
                results {
                    id
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
                    breakdown
                    methodology
                }
            }
            url
            latestReviews {
                age
                field
                id
                figure {
                    id
                }
                geoLocation {
                    id
                }
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
            totalFlowNdFigures
            totalStockIdpFigures
        }
    }
`;

export const CREATE_ENTRY = gql`
    mutation CreateEntry($entry: EntryCreateInputType!) {
        createEntry(data: $entry) {
            result {
                id
                totalFlowNdFigures
                totalStockIdpFigures
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
    mutation UpdateEntry($entry: EntryUpdateInputType!) {
        updateEntry(data: $entry) {
            result {
                id
                reviewing {
                    id
                    status
                    createdAt
                    reviewer {
                        id
                        fullName
                    }
                }
                totalFlowNdFigures
                totalStockIdpFigures
            }
            errors
        }
    }
`;

export const FIGURE_OPTIONS = gql`
    query FigureOptionsForEntryForm {
        crisisType: __type(name: "CRISIS_TYPE") {
            name
            enumValues {
                name
                description
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
        osvSubTypeList {
            results {
                id
                name
            }
        }
        otherSubTypeList {
            results {
                id
                name
            }
        }
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
        figureTermList: __type(name: "FIGURE_TERMS") {
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
        dateAccuracy: __type(name: "DATE_ACCURACY") {
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
        displacementOccurence: __type(name: "DISPLACEMENT_OCCURRED") {
            name
            enumValues {
                name
                description
            }
        }
        figureCategoryList: __type(name: "FIGURE_CATEGORY_TYPES") {
            name
            enumValues {
                name
                description
            }
        }
        figureTagList {
            results {
                id
                name
            }
        }
        disaggregatedAgeCategoryList {
            results {
                id
                name
            }
        }
        disaggregatedGenderList: __type(name: "GENDER_TYPE") {
            name
            enumValues {
                name
                description
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
            id
            countries {
                id
                idmcShortName
                iso2
                boundingBox
                geojsonUrl
            }
            totalFlowNdFigures
            totalStockIdpFigures
            crisis {
                id
                totalFlowNdFigures
                totalStockIdpFigures
            }
        }
    }
`;
