import {
    Figure_Category_Types as FigureCategoryTypes,
    Figure_Terms as FigureTerms,
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

export const stockCategories: FigureCategoryTypes[] = [
    'IDPS',
    'RETURNEES',
    'LOCALLY_INTEGRATED_IDPS',
    'IDPS_SETTLED_ELSEWHERE',
    'PEOPLE_DISPLACED_ACROSS_BORDERS',
    'PARTIAL_STOCK',
    'UNVERIFIED_STOCK',
];

export const displacementOccuredTerms: FigureTerms[] = [
    'EVACUATED',
    'DISPLACED',
    'FORCED_TO_FLEE',
    'RELOCATED',
    'SHELTERED',
    'IN_RELIEF_CAMP',
];

export const housingRelatedTerms: FigureTerms[] = [
    'DESTROYED_HOUSING',
    'PARTIALLY_DESTROYED_HOUSING',
    'UNINHABITABLE_HOUSING',
];

export function isFlowCategory(value: FigureCategoryTypes | undefined) {
    return value && flowCategories.includes(value);
}

export function isStockCategory(value: FigureCategoryTypes | undefined) {
    return value && stockCategories.includes(value);
}

export function isHousingTerm(value: FigureTerms | undefined) {
    return value && housingRelatedTerms.includes(value);
}

export function isDisplacementTerm(value: FigureTerms | undefined) {
    return value && displacementOccuredTerms.includes(value);
}
