interface ReviewFields {
    value: string;
    figure?: string;
    ageId?: string;
    strataId?: string;
    field?: string;
}

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

                if (ageOrStrataFields[0] === 'age') {
                    review.ageId = ageOrStrataFields[1];
                } else if (ageOrStrataFields[0] === 'strata') {
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

export function getReviewInputMap(reviewList) {
    const reviewMap = {};

    reviewList.forEach((review) => {
        let key;

        if (!review.figure) {
            key = review.field;
        } else if (review.ageId) {
            key = `fig:${review.figure}-age:${review.ageId}-${review.field}`;
        } else if (review.strataId) {
            key = `fig:${review.figure}-strata:${review.strataId}-${review.field}`;
        } else {
            key = `fig:${review.figure}-${review.field}`;
        }

        reviewMap[key] = review.value;
    });

    return reviewMap;
}
