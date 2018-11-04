import {
        reduce as fl_reduce,
        bimap as fl_bimap,
} from "fantasy-land";

function factory({
        Right,
        Left,
}) {
        // maybeToEither :: e -> Maybe a -> Either e a
        const maybeToEither = e => m => m[fl_reduce]((_, a) => Right(a), Left(e));

        // bimap :: (f, g) -> Bifunctor a b -> Bifunctor f(a) g(b)
        const bimap = (f, g) => x => x[fl_bimap](f, g);

        return {
                bimap,
                maybeToEither,
        };
};

export {factory};
