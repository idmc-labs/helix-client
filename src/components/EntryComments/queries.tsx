import { gql } from '@apollo/client';

// eslint-disable-next-line import/prefer-default-export
export const ENTRY_COMMENTS = gql`
    query EntryComments($id: ID!, $page: Int, $pageSize: Int, $ordering: String) {
        entry(id: $id) {
            id
            reviewComments(ordering: $ordering, page: $page, pageSize: $pageSize) {
                totalCount
                results {
                    body
                    id
                    createdBy {
                        id
                        fullName
                        username
                    }
                    createdAt
                }
            }
        }
    }
`;

export const COMMENT = gql`
    query ReviewComment($id: ID!) {
        reviewComment(id: $id) {
            id
            body
        }
    }
`;

export const DELETE_REVIEW_COMMENT = gql`
    mutation DeleteReviewComment($id: ID!) {
        deleteReviewComment(id: $id) {
            errors
            ok
            result {
                id
            }
        }
    }
`;

export const CREATE_GENERAL_COMMENT = gql`
    mutation CreateGeneralReviewComment($data: ReviewCommentCreateInputType!){
        createReviewComment(data: $data) {
            ok
            result {
                id
                createdBy {
                    id
                    fullName
                    username
                }
                createdAt
            }
            errors
        }
    }
`;

export const UPDATE_COMMENT = gql`
    mutation UpdateReviewComment($data: ReviewCommentUpdateInputType!){
        updateReviewComment(data: $data) {
            ok
            result {
                body
                id
                createdBy {
                    id
                    fullName
                    username
                }
                createdAt
            }
            errors
        }
    }
`;
