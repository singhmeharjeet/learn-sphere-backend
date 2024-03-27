


Post Function service Account: post-fuction@project-416223.iam.gserviceaccount.com

Welcome Message

    GET /

    Returns a welcome message indicating successful connection to the Post Service.

Authentication

Before accessing certain endpoints, authentication is required. The authentication mechanism is not explicitly defined in this documentation.
Endpoints
Create a Post

    POST /posts/create

    Creates a new post.

    Request Body:
        userId: ID of the user creating the post.
        image: URL of the image associated with the post (optional).
        description: Description text of the post.
        lectureURL: URL of the associated lecture (optional).
        title: Title of the post.

    Response:
        success: Indicates if the operation was successful.
        message: Information message.
        post: Details of the created post.

Get a Post by Post ID

    GET /posts/:postId

    Retrieves a post by its unique ID.

    Parameters:
        postId: ID of the post to retrieve.

    Response:
        success: Indicates if the operation was successful.
        message: Information message.
        post: Details of the retrieved post.

Get Posts by User ID

    GET /posts/user/:userId

    Retrieves all posts created by a specific user.

    Parameters:
        userId: ID of the user whose posts are to be retrieved.

    Response:
        success: Indicates if the operation was successful.
        message: Information message.
        post: Array of posts created by the user.

Get All Posts

    GET /posts

    Retrieves all existing posts.

    Response:
        success: Indicates if the operation was successful.
        message: Information message.
        post: Array of all existing posts.

Delete a Post by Post ID

    DELETE /posts/delete/:postId

    Deletes a post by its unique ID.

    Parameters:
        postId: ID of the post to delete.

    Response:
        success: Indicates if the operation was successful.
        message: Information message.

Update a Post by Post ID

    PUT /posts/update/:postId

    Updates a post by its unique ID.

    Parameters:
        postId: ID of the post to update.

    Request Body:
        Fields to be updated in the post.

    Response:
        success: Indicates if the operation was successful.
        message: Information message.

Add Comment to a Post

    POST /posts/:postId/addcomment

    Adds a comment to a post.

    Parameters:
        postId: ID of the post to which the comment is added.

    Request Body:
        userId: ID of the user adding the comment.
        comment: Text content of the comment.

    Response:
        success: Indicates if the operation was successful.
        message: Information message.

Delete a Comment

    DELETE /posts/:postId/comments/:commentId/delete

    Deletes a comment from a post.

    Parameters:
        postId: ID of the post containing the comment.
        commentId: ID of the comment to delete.

    Response:
        success: Indicates if the operation was successful.
        message: Information message.

Error Handling

In case of errors, appropriate HTTP status codes are returned along with error messages in the response body.
