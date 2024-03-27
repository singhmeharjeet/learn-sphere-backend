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
        const { role } = res.locals.user;
        if (role === "admin" || role === "teacher") {
            const postJson = {
                postId: uuidv4(),
                createdAt: new Date(),
                comments: {},
                postedBy: req.body.userId,
                image: req.body.image,
                description: req.body.description,
                lectureURL: req.body.lectureURL,
                title: req.body.title
            };

            await db.collection("posts").doc(postJson.postId).set(postJson);

            console.log("Post has been created!: \n", postJson);
            return res.status(200).json({ message: "Post created successfully", post: postJson });
        } else {
            return res.status(403).json({ message: "Unauthorized to create a post" });
        }
    } catch (error) {
        console.error("Error creating post:", error);
        return res.status(500).json({ message: "Internal Server Error" });
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
            return res.json(postData);
        } else {
            console.log("No post found with PostID :", postId);
            return res.status(404).send("Post not found");
        }
    } catch (error) {
        console.error("Error fetching post:", error);
        return res.status(500).json({ message: "Internal Server Error" });
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

        return res.status(200).json(responseArr);
    } catch (error) {
        console.error("Error fetching posts:", error);
        return res.status(500).json({ message: "Internal Server Error" });
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
            if (role === "admin" || username === postData.postedBy) {
                console.log("Deleting post with postId", postId, "deleted by", username, role);
                const response = await db.collection("posts").doc(postId).delete();
                return res.status(200).json({ message: "Post deleted successfully" });
            } else {
                return res.status(403).send("Permission error");
            }
        } else {
            return res.status(404).send("Post not found");
        }
    } catch (error) {
        console.error("Error deleting post:", error);
        return res.status(500).json({ message: "Internal Server Error" });
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

        const postData = postDoc.data();

        if (role === "admin" || username === postData.postedBy) { // Check permissions
            const updatedPostData = { ...postData, ...updateFields };
            await postRef.update(updatedPostData);
            console.log("Post", postId, "has been updated", postData);   
            return res.status(200).send("Post updated successfully");
        } else {
            return res.status(403).send("Permission error");
        }
        
    } catch (error) {
        console.error("Error updating post:", error);
        return res.status(500).send("Internal Server Error");
    }
});


//----------------------------------------COMMENT ON A POST--------------------------------------
app.post("/posts/:postId/addcomment", async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId, comment } = req.body;
        const commentId = uuidv4();
        const createdAt = new Date();

        const newComment = {
            id: commentId,
            author: userId,
            createdAt: createdAt,
            comment: comment
        };

        const postRef = db.collection("posts").doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comments = postDoc.data().comments || {};
        comments[commentId] = newComment;

        await postRef.update({ comments: comments });

        console.log("Comment added on", postId, newComment);
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

        const comments = postDoc.data().comments || {};

        if (!comments[commentId]) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const comment = comments[commentId];
        if (role !== "admin" || username !== comment.author) {
            return res.status(403).json({ message: "Unauthorized to delete this comment" });
        }

        delete comments[commentId];

        await postRef.update({ comments });

        console.log("Comment deleted on", postId, "Comment:", commentId);
        return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});




app.listen(PORT, () => {
	console.log(`Post Service is listing on PORT ${PORT}...`);
});
