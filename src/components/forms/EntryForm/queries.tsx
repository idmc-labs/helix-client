import { gql } from '@apollo/client';

export const EVENT_FRAGMENT = gql`
    fragment EventResponse on EventType {
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
        assignee {
            id
        }
        totalFlowNdFigures
        totalStockIdpFigures

        reviewStatus
        reviewStatusDisplay
    }
`;

export const FIGURE_FRAGMENT = gql`
    ${EVENT_FRAGMENT}
    fragment FigureResponse on FigureType {
        country {
            id
            idmcShortName
            boundingBox
            iso2
        }
        excerptIdu
        sourceExcerpt
        calculationLogic
        tags {
            id
            name
        }
        sources {
            results {
                id
                name
                methodology
                countries {
                    id
                    idmcShortName
                }
                organizationKind {
                    id
                    name
                    reliability
                }
            }
        }
        event {
            ...EventResponse
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
                ageFrom
                ageTo
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
        displacementOccurred

        reviewStatusDisplay
        reviewStatus
        lastReviewCommentStatus {
            id
            field
            commentType
        }
    }
`;

export const ENTRY_FRAGMENT = gql`
    ${FIGURE_FRAGMENT}
    fragment EntryResponse on EntryType {
        associatedParkedItem {
            id
        }
        figures {
            ...FigureResponse
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
                methodology
                countries {
                    id
                    idmcShortName
                }
                organizationKind {
                    id
                    name
                    reliability
                }
            }
        }
        url
    }
`;

export const ENTRY = gql`
    ${ENTRY_FRAGMENT}
    query Entry($id: ID!) {
        entry(id: $id) {
            ...EntryResponse
        }
    }
`;

export const CREATE_ENTRY = gql`
    ${ENTRY_FRAGMENT}
    mutation CreateEntry($entry: EntryCreateInputType!) {
        createEntry(data: $entry) {
            result {
                ...EntryResponse
            }
            errors
        }
    }
`;

export const UPDATE_ENTRY = gql`
    ${ENTRY_FRAGMENT}
    mutation UpdateEntry($entry: EntryUpdateInputType!) {
        updateEntry(data: $entry) {
            result {
                ...EntryResponse
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

export const FIGURE_LIST = gql`
    ${FIGURE_FRAGMENT}
    query FigureList(
        $eventId: String,
        $page: Int,
        $pageSize: Int,
    ) {
        figureList(
            event: $eventId,
            page: $page,
            pageSize: $pageSize
            filterIsFigureToBeReviewed: true,
        ) {
            results {
                ...FigureResponse
                entry {
                    id
                    document {
                        id
                        attachment
                    }
                    preview {
                        status
                        id
                        pdf
                        remark
                        url
                    }
                }
            }
            totalCount
        }
    }
`;
