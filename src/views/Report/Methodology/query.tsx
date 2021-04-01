import { gql } from '@apollo/client';

export const FETCH_REPORT_METHODOLOGY = gql`
    query FetchReportMethodology($id: ID!) {
        report(id: $id) {
            id
            methodology
        }
    }
`;

export const UPDATE_REPORT_METHODOLOGY = gql`
    mutation UpdateReportMethodology($report: ReportUpdateInputType!) {
        updateReport(data: $report) {
            result {
                id
                methodology
            }
            errors
        }
    }
`;
