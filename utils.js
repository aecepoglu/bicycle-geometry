import {
	equals,
	reduce
} from "fantasy-land";

function factory({
	Just,
	Nothing,
	Right,
	Left
}) {
	var O = {};

	// maybeToEither :: a -> Maybe b -> Either a b
	O.maybeToEither = a => (b => 
		b[equals](Nothing) ?
			Left(a) :
			b[reduce]((_, y) => Right(y), undefined)
	);

	return O;
};

export {
	factory,
};
