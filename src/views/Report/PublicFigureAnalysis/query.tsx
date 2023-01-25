import { gql } from '@apollo/client';

export const FETCH_PUBLIC_FIGURE_ANALYSIS = gql`
    query ReportSummary($id: ID!) {
        report(id: $id) {
            id
            summary
        }
    }
`;

export const UPDATE_PUBLIC_FIGURE_ANALYSIS = gql`
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
