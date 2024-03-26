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
// ---------------------------POST CREATE METHOD------------------------- //need to add youtube URL, and title, possible change comments array to have comment posted by, comment id.
app.post("/posts/create", async (req, res) => {
	try {
		const { username, role } = res.locals.user;
		if(role === "admin" || role === "teacher"){
			const image = req.body.image || "http://placehold.it/300x200";
			const description = req.body.description || "No description";

			const postJson = {
				postId: uuidv4(),
				createdAt: new Date(),
				comments: [],
				postedBy: req.body.userId,
				image: image,
				description: description,
			};
			const response = await db
				.collection("posts")
				.doc(postJson.postId)
				.set(postJson);
				
			console.log("Post has been created!: \n", postJson);
			res.send(response);
		}
	} catch (error) {
		res.send(error);
	}
});

// app.post("/posts/create", async (req, res) => {
//     try {
//         const { username, role } = res.locals.user;
//         if (role === "admin" || role === "teacher") {
//             const postJson = {
//                 postId: uuidv4(),
//                 createdAt: new Date(),
//                 comments: {},
//                 postedBy: req.body.userId,
//                 image: req.body.image,
//                 description: req.body.description,
//                 lectureURL: req.body.lectureURL, // Add lectureURL field
//                 title: req.body.title
//             };


//             const response = await db
//                 .collection("posts")
//                 .doc(postJson.postId)
//                 .set(postJson);

//             console.log("Post has been created!: \n", postJson);
//             res.send(response);
//         }
//     } catch (error) {
//         res.send(error);
//     }
// });


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

//----------------------------GET A POST USING USER ID------------------

app.get("/posts/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const querySnapshot = await db.collection("posts").where("postedBy", "==", userId).get();

        const posts = [];

        querySnapshot.forEach((doc) => {
            posts.push(doc.data());
        });

        res.json(posts);
    } catch (error) {
        console.error("Error fetching posts by userId:", error);
        res.status(500).json({ message: "Internal Server Error" });
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
		const { username, role } = res.locals.user;

		const query_return = await db
			.collection("posts")
			.where("postId", "==", postId)
			.get();
		
		if (!query_return.empty) {
			const doc = query_return.docs[0];
			const postData = doc.data();
			if(role === "admin" || username === postData.postedBy){
				console.log("Deleting post with postId", postId, "deleted by", username, role);
				const response = await db.collection("posts").doc(postId).delete();
				res.send(response);
			} else{
				res.send("Permission error");
			}
		} else {
			res.status(404).send("Post not found");
		}
		
		
	} catch (error) {
		res.send(error);
	}
});

// -------------------------------------UPDATING A POST BASED ON POST ID---------------------------
app.put("/posts/update/:postId", async (req, res) => {
	try {
		const { postId } = req.params;
		const { username, role } = res.locals.user;

		const updateFields = req.body;

		const postRef = db.collection("posts").doc(postId);
		const postDoc = await postRef.get();
		if (!postDoc.exists) {
			return res.status(404).send("Post not found");
		}

		const query_return = await db
			.collection("posts")
			.where("postId", "==", postId)
			.get();
		if (!query_return.empty) {
			const doc = query_return.docs[0];
			const postData = doc.data();
			if(role === admin || username === postData.postedBy){ //permissions

				const updatedPostData = { ...postDoc.data(), ...updateFields };
				await postRef.update(updatedPostData);
				console.log("Post",postId,"has been updated", postData);	
				res.status(200).send("Post updated successfully");

			} else{
				res.send("Permission error");
			}
		}

		
	} catch (error) {
		console.error("Error updating post:", error);
		res.status(500).send("Internal Server Error");
	}
});

//----------------------------------------COMMENT ON A POST--------------------------------------
app.post("/posts/:postId/addcomment", async (req, res) => {
    try {
        const { postId } = req.params;
        const { comment } = req.body;
//	
//             req.body.comments.forEach(comment => {
//             {
//                     author: req.body.userId,
//                     id: uuidv4(),
//                     comment: req.body.comment
//             }

        const postRef = db.collection("posts").doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            return res.status(404).json({ message: "Post not found" });
        }

        const updatedComments = [...postDoc.data().comments, comment];
        await postRef.update({ comments: updatedComments });

		console.log("Comment added on",postId, comment);
        return res.status(200).json({ message: "Comment added successfully" });
    } catch (error) {
        console.error("Error adding comment:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

//----------------------------------------DELETE A COMMENT--------------------------------------
app.delete("/posts/:postId/comments/:commentId/delete", async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { username, role } = res.locals.user;

        const postRef = db.collection("posts").doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comments = postDoc.data().comments;

        if (commentId === -1) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const comment = comments[commentId];

        if (role !== "admin") {
            return res.status(403).json({ message: "Unauthorized to delete this comment" });
        }

        comments.splice(commentId, 1);

        await postRef.update({ comments });

		console.log("Comment deleted on",postId, comment, "commendId:", commentId);
        return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});


app.listen(PORT, () => {
	console.log(`Post Service is listing on PORT ${PORT}...`);
});
