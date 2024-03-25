// TODO: Only does authentication for now, will add authorization later

module.exports.getAuth = async (req, res, next) => {
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

	try {
		const responseFromAuth = await fetch("http://localhost:8090/verify", {
			method: "GET",
			headers: {
				cookie: `token=${token}`,
			},
		});

		const { success, message, user } = await responseFromAuth.json();

		console.log(success, message);
		if (!success) {
			return res.status(403).json({
				success: false,
				message,
			});
		} else {
			next();
		}
	} catch (error) {
		console.log("Error from auth: ", error);
	}
};
