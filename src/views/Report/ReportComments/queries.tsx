import { gql } from '@apollo/client';

export const REPORT_COMMENTS = gql`
    query ReportComments($id: ID!, $page: Int, $pageSize: Int, $ordering: String) {
        report(id: $id) {
            id
            comments(ordering: $ordering, page: $page, pageSize: $pageSize) {
                totalCount
                results {
                    body
                    id
                    createdBy {
                        id
                        fullName
                    }
                    createdAt
                }
            }
        }
    }
`;

export const COMMENT = gql`
    query ReportComment($id: ID!) {
        reportComment(id: $id) {
            id
            body
        }
    }
`;
export const CREATE_COMMENT = gql`
    mutation CreateReportComment($data: ReportCommentCreateInputType!){
        createReportComment(data: $data) {
            ok
            result {
                id
                createdBy {
                    id
                    fullName
                }
                createdAt
            }
            errors
        }
    }
`;

export const UPDATE_COMMENT = gql`
    mutation UpdateReportComment($data: ReportCommentUpdateInputType!){
        updateReportComment(data: $data) {
            ok
            result {
                body
                id
                createdBy {
                    id
                    fullName
                }
                createdAt
            }
            errors
        }
    }
`;
