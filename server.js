const env = require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

const admin = require("firebase-admin");

const credentials = require("./key.js");
const { v4: uuidv4 } = require("uuid");
const { getAuth } = require("./middleware.js");

const PORT = process.env.PORT || 8080;

admin.initializeApp({
	credential: admin.credential.cert(credentials.credentials),
});

const db = admin.firestore();

// Middleware--------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(getAuth);
// ------------------------------------------

app.get("/", (req, res) => {
	res.json({
		message: "Welcome to the Post Service of Learn Sphere!",
	});
});
// ---------------------------POST CREATE METHOD-------------------------
app.post("/posts/create", async (req, res) => {
	try {
		console.log(req.body);
		const postJson = {
			postId: uuidv4(),
			createdAt: new Date(),
			comments: [],
			postedBy: req.body.teacherId,
			image: req.body.image,
			description: req.body.description,
		};
		const response = await db
			.collection("posts")
			.doc(postJson.postId)
			.set(postJson);
		res.send(response);
	} catch (error) {
		res.send(error);
	}
});

// ----------------------------GET A POST USING POST ID METHOD------------------

app.get("/posts/:postId", async (req, res) => {
	try {
		console.log(req.params);
		const { postId } = req.params;
		const query_return = await db
			.collection("posts")
			.where("postId", "==", postId)
			.get();
		if (!query_return.empty) {
			const doc = query_return.docs[0];
			const postData = doc.data();
			res.json(postData);
		} else {
			console.log("No post found with PostID :", postId);
			res.status(404).send("Post not found");
		}
	} catch (error) {
		res.send(error);
	}
});

// ---------------------------------GETTING ALL POSTS THAT EXIST------------------------

app.get("/posts", async (req, res) => {
	try {
		const userRef = db.collection("posts");
		const response = await userRef.get();
		let responseArr = [];

		response.forEach((doc) => {
			responseArr.push(doc.data());
		});
		res.send(responseArr);
	} catch (error) {
		res.send(error);
	}
});

// ------------------------------------DELETING A POST BASED ON POST ID-------------------------
app.delete("/posts/delete/:postId", async (req, res) => {
	try {
		const { postId } = req.params;
		console.log("Deleting post that his this postId: ", postId);
		const response = await db.collection("posts").doc(postId).delete();
		res.send(response);
	} catch (error) {
		res.send(error);
	}
});

// -------------------------------------UPDATING A POST BASED ON POST ID---------------------------
app.put("/posts/update/:postId", async (req, res) => {
	try {
		const { postId } = req.params;
		const updateFields = req.body;

		const postRef = db.collection("posts").doc(postId);
		const postDoc = await postRef.get();

		if (!postDoc.exists) {
			return res.status(404).send("Post not found");
		}

		const updatedPostData = { ...postDoc.data(), ...updateFields };

		await postRef.update(updatedPostData);

		res.status(200).send("Post updated successfully");
	} catch (error) {
		console.error("Error updating post:", error);
		res.status(500).send("Internal Server Error");
	}
});

app.listen(PORT, () => {
	console.log(`Post Service is listing on PORT ${PORT}...`);
});
