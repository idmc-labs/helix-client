import {
    Figure_Category_Types as FigureCategoryTypes,
    Figure_Terms as FigureTerms,
} from '#generated/types';

// Note: constants for figureCategory enum
export const flowCategories: FigureCategoryTypes[] = [
    'NEW_DISPLACEMENT',
    'RETURN',
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
    'FAILED_RELOCATION_ELSEWHERE',
    'BIRTH',
    'UNVERIFIED_FLOW',
    'PEOPLE_DISPLACED_ACROSS_BORDERS_FLOW',
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

export const displacementOccurredTerms: FigureTerms[] = [
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

const visibleCategories: FigureCategoryTypes[] = [
    'IDPS',
    'RETURNEES',
    'RETURN',
    'LOCALLY_INTEGRATED_IDPS',
    'IDPS_SETTLED_ELSEWHERE',
    'PEOPLE_DISPLACED_ACROSS_BORDERS',
    'NEW_DISPLACEMENT',
    'MULTIPLE_DISPLACEMENT',
    // 'PARTIAL_STOCK',
    // 'PARTIAL_FLOW',
    // 'CROSS_BORDER_FLIGHT',
    // 'CROSS_BORDER_RETURN',
    'RELOCATION_ELSEWHERE',
    // 'DEATHS',
    // 'PROVISIONAL_SOLUTIONS',
    // 'FAILED_LOCAL_INTEGRATION',
    'LOCAL_INTEGRATION',
    // 'FAILED_RETURN_RETURNEE_DISPLACEMENT',
    // 'UNVERIFIED_STOCK',
    // 'UNVERIFIED_FLOW',
    // 'BIRTH',
    // 'FAILED_RELOCATION_ELSEWHERE',
    'PEOPLE_DISPLACED_ACROSS_BORDERS_FLOW',
];
export function isVisibleCategory(value: FigureCategoryTypes) {
    return visibleCategories.includes(value);
}

export function isHousingTerm(value: FigureTerms | undefined) {
    return value && housingRelatedTerms.includes(value);
}

export function isDisplacementTerm(value: FigureTerms | undefined) {
    return value && displacementOccurredTerms.includes(value);
}
