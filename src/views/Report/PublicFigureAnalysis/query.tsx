import { gql } from '@apollo/client';

export const FETCH_PUBLIC_FIGURE_ANALYSIS = gql`
    query ReportPublicFigureAnalysis($id: ID!) {
        report(id: $id) {
            id
            publicFigureAnalysis
        }
    }
`;

export const UPDATE_PUBLIC_FIGURE_ANALYSIS = gql`
    mutation UpdateReportPublicFigureAnalysis($report: ReportUpdateInputType!) {
        updateReport(data: $report) {
            result {
                id
                publicFigureAnalysis
            }
            errors
        }
    }
`;
