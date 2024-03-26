// TODO: Only does authentication for now, will add authorization later
const jwt = require("jsonwebtoken");
module.exports.getAuth = async (req, res, next) => {
	// Step 1: extract the token from cookie

	const cookie = req.headers["authorization"];
	if (!cookie) {
		return res.status(403).json({
			success: false,
			message: "No JWT token provided",
		});
	}

	let token = "";
	try {
		token = cookie.split("=")[1];

		if (!token) {
			return res.status(403).json({
				success: false,
				message: "No JWT token provided",
			});
		}
	} catch (error) {
		return res.status(403).json({
			success: false,
			message: "Some Error occurded while parsing the token",
		});
	}

	// Step 2: verify the token
	try {
		jwt.verify(token, process.env.MY_SECRET);
		next();
	} catch (err) {
		if (err instanceof jwt.TokenExpiredError) {
			return res.status(403).json({
				success: false,
				message: "Token expired",
			});
		} else if (err instanceof jwt.JsonWebTokenError) {
			return res.status(403).json({
				success: false,
				message: "Invalid token",
			});
		} else {
			return res.status(500).json({
				success: false,
				message: "Internal server error",
			});
		}
	}
};
