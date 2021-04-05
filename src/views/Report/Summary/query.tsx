import { gql } from '@apollo/client';

export const FETCH_REPORT_SUMMARY = gql`
    query ReportSummary($id: ID!) {
        report(id: $id) {
            id
            summary
        }
    }
`;

export const UPDATE_REPORT_SUMMARY = gql`
    mutation UpdateReportSummary($report: ReportUpdateInputType!) {
        updateReport(data: $report) {
            result {
                id
                summary
            }
            errors
        }
    }
`;
