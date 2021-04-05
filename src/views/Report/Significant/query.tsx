import { gql } from '@apollo/client';

export const FETCH_REPORT_SIGNIFICANT = gql`
    query ReportSignificantUpdates($id: ID!) {
        report(id: $id) {
            id
            significantUpdates
        }
    }
`;

export const UPDATE_REPORT_SIGNIFICANT = gql`
    mutation UpdateReportSignificantUpdates($report: ReportUpdateInputType!) {
        updateReport(data: $report) {
            result {
                id
                significantUpdates
            }
            errors
        }
    }
`;
