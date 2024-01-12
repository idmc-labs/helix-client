import { createContext } from 'react';
import {
    GetActorQuery,
    GetCountryQuery,
    GetEventQuery,
    GetReportQuery,
    GetCrisisQuery,
    GetUserQuery,
    GetOrganizationQuery,
    ApiClientListQuery,
    GetFigureTagListQuery,
    GetGeographicGroupQuery,
    GetRegionQuery,
    GetViolenceContextQuery,
} from '#generated/types';

type ActorOption = NonNullable<NonNullable<GetActorQuery['actorList']>['results']>[number];
type CountryOption = NonNullable<NonNullable<GetCountryQuery['countryList']>['results']>[number];
type EventOption = NonNullable<NonNullable<GetEventQuery['eventList']>['results']>[number];
type ReportOption = NonNullable<NonNullable<GetReportQuery['reportList']>['results']>[number];
type CrisisOption = NonNullable<NonNullable<GetCrisisQuery['crisisList']>['results']>[number];
type UserOption = NonNullable<NonNullable<GetUserQuery['users']>['results']>[number];
type OrganizationOption = NonNullable<NonNullable<GetOrganizationQuery['organizationList']>['results']>[number];
type ClientCodeOption = NonNullable<NonNullable<ApiClientListQuery['clientList']>['results']>[number];
type FigureTagOption = NonNullable<NonNullable<GetFigureTagListQuery['figureTagList']>['results']>[number];
type GeographicOption = NonNullable<NonNullable<GetGeographicGroupQuery['geographicalGroupList']>['results']>[number];
type RegionOption = NonNullable<NonNullable<GetRegionQuery['countryRegionList']>['results']>[number];
type ViolenceContextOption = NonNullable<NonNullable<GetViolenceContextQuery['contextOfViolenceList']>['results']>[number];

/*
interface X {
    [key: string]: { id: string }[] | null | undefined;
}
*/

export interface Options {
    country?: CountryOption[] | null;
    actor?: ActorOption[] | null;
    event?: EventOption[] | null;
    report?: ReportOption[] | null;
    crisis?: CrisisOption[] | null;
    user?: UserOption[] | null;
    organization?: OrganizationOption[] | null;
    client?: ClientCodeOption[] | null;
    tag?: FigureTagOption[] | null;
    geographicGroup?: GeographicOption[] | null;
    region?: RegionOption[] | null;
    contextOfViolence?: ViolenceContextOption[] | null;
}

interface OptionContext {
    options: Options;
    setOptions: React.Dispatch<React.SetStateAction<Options>>;
}

const OptionContext = createContext<OptionContext>({
    options: {},
    setOptions: (options: unknown) => {
        console.warn('Trying to set options to ', options);
    },
});

export default OptionContext;
