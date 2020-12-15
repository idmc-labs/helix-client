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
