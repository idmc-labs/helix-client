import {
    Figure_Category_Types as FigureCategoryTypes,
} from '#generated/types';

// Note: constants for figureCategory enum
export const flowCategories: FigureCategoryTypes[] = [
    'NEW_DISPLACEMENT',
    'MULTIPLE_DISPLACEMENT',
    'PARTIAL_FLOW',
    'CROSS_BORDER_FLIGHT',
    'CROSS_BORDER_RETURN',
    'RELOCATION_ELSEWHERE',
    'DEATHS',
    'PROVISIONAL_SOLUTIONS',
    'FAILED_LOCAL_INTEGRATION',
    'LOCAL_INTEGRATION',
    'FAILED_RETURN_RETURNEE_DISPLACEMENT',
    'UNVERIFIED_FLOW',
];

export const stockCategories = [
    'IDPS',
    'RETURNEES',
    'LOCALLY_INTEGRATED_IDPS',
    'IDPS_SETTLED_ELSEWHERE',
    'PEOPLE_DISPLACED_ACROSS_BORDERS',
    'PARTIAL_STOCK',
    'UNVERIFIED_STOCK',
];

export const displacementOccuredCategories = [
    'EVACUATED',
    'DISPLACED',
    'FORCED_TO_FLEE',
    'RELOCATED',
    'SHELTERED',
    'IN_RELIEF_CAMP',
];

export const housingRelatedTerms = [
    'DESTROYED HOUSING',
    'PARTIALLY_DESTROYED_HOUSING',
    'UNINHABITABLE_HOUSING',
];

// Note: Below are the constants for figureTerms enum
export const terms = [
    'EVACUATED',
    'DISPLACED',
    'FORCED_TO_FLEE',
    'RELOCATED',
    'SHELTERED',
    'IN_RELIEF_CAMP',
    'DESTROYED_HOUSING',
    'PARTIALLY_DESTROYED_HOUSING',
    'UNINHABITABLE_HOUSING',
    'HOMELESS',
    'AFFECTED',
    'RETURNS',
    'MULTIPLE_OR_OTHER',
];

export function isFlowCategory(value: FigureCategoryTypes | undefined) {
    return value && flowCategories.includes(value);
}

export function isStockCategory(value: FigureCategoryTypes | undefined) {
    return value && stockCategories.includes(value);
}

export function isHousingCategory(value: FigureCategoryTypes | undefined) {
    return value && housingRelatedTerms.includes(value);
}

export function isDisplacementCategory(value: FigureCategoryTypes | undefined) {
    return value && displacementOccuredCategories.includes(value);
}

export function isTermCategory(value: FigureCategoryTypes | undefined) {
    return value && terms.includes(value);
}
