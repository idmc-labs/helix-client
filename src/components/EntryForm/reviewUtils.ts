interface ReviewFields {
    value: string;
    figure?: string;
    ageId?: string;
    strataId?: string;
    field?: string;
}

const FIGURE_KEY = 'fig';
const AGE_KEY = 'age';
const STRATA_KEY = 'strata';

export function getReviewList(reviewMap: { [key: string]: string }) {
    const keys = Object.keys(reviewMap);

    const reviewList = keys.map((rk: string) => {
        const review: ReviewFields = {
            value: reviewMap[rk],
        };

        const frags = rk.split('-');

        if (frags.length > 1) {
            const figureFields = frags[0].split(':');
            review.figure = figureFields[1];

            if (frags.length === 3) {
                const ageOrStrataFields = frags[1].split(':');

                if (ageOrStrataFields[0] === AGE_KEY) {
                    review.ageId = ageOrStrataFields[1];
                } else if (ageOrStrataFields[0] === STRATA_KEY) {
                    review.strataId = ageOrStrataFields[1];
                }
            } else {
                review.field = frags[1];
            }
        } else {
            review.field = rk;
        }

        return review;
    });

    return reviewList;
}

export function getReviewInputName({ figure, ageId, strataId, field }: ReviewFields) {
    let name;

    if (!figure) {
        name = field;
    } else if (ageId) {
        name = `${FIGURE_KEY}:${figure}-${AGE_KEY}:${ageId}-${field}`;
    } else if (strataId) {
        name = `${FIGURE_KEY}:${figure}-${STRATA_KEY}:${strataId}-${field}`;
    } else {
        name = `${FIGURE_KEY}:${figure}-${field}`;
    }

    return name;
}

export function getReviewInputMap(reviewList: ReviewFields[]) {
    const reviewMap = {};

    reviewList.forEach((review) => {
        const {
            figure,
            ageId,
            strataId,
            field,
        } = review;

        const key = getReviewInputName({
            figure,
            ageId,
            strataId,
            field,
        });

        reviewMap[key] = review.value;
    });

    return reviewMap;
}
