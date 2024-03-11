const env = require("dotenv").config();

exports.credentials = {
	type: "service_account",
	project_id: "fir-firestore-dbfdf",
	private_key_id: process.env.private_key_id,
	private_key: process.env.private_key,
	client_email:
		"firebase-adminsdk-8gku0@fir-firestore-dbfdf.iam.gserviceaccount.com",
	client_id: "116498370440643347565",
	auth_uri: "https://accounts.google.com/o/oauth2/auth",
	token_uri: "https://oauth2.googleapis.com/token",
	auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
	client_x509_cert_url:
		"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-8gku0%40fir-firestore-dbfdf.iam.gserviceaccount.com",

	universe_domain: "googleapis.com",
};
