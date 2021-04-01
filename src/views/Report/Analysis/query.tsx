import { gql } from '@apollo/client';

export const FETCH_REPORT_ANALYSIS = gql`
    query FetchReportAnalysis($id: ID!) {
        report(id: $id) {
            id
            analysis
        }
    }
`;

export const UPDATE_REPORT_ANALYSIS = gql`
    mutation UpdateReportAnalysis($report: ReportUpdateInputType!) {
        updateReport(data: $report) {
            result {
                id
                analysis
            }
            errors
        }
    }
`;
