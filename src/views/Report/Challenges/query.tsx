import { gql } from '@apollo/client';

export const FETCH_REPORT_CHALLENGES = gql`
    query FetchReportChallenges($id: ID!) {
        report(id: $id) {
            id
            challenges
        }
    }
`;

export const UPDATE_REPORT_CHALLENGES = gql`
    mutation UpdateReportChallenges($report: ReportUpdateInputType!) {
        updateReport(data: $report) {
            result {
                id
                challenges
            }
            errors
        }
    }
`;
