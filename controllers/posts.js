const Post = require("../models/post");
const Comment = require("../models/comment");
const User = require("../models/user");

const PostsController = {
  Index: async (req, res) => {
      const currentUser = await User.findById(req.session.user._id);
      // uses filter to fetch the IDs of all the confirmed friends of the current user, then uses map 
      // to only include the user_id within the array
      const confirmedFriendIds = currentUser.friends.filter(friend => friend.status === "confirmed").map(friend => friend.user_id);
      // forgot that we want to also include the current logged in users posts on the timeline,
      // so their ID has also been pushed to the confirmedFriendsId var.
      confirmedFriendIds.push(currentUser._id);
      
      // the post variable finds all posts that were made by users who's IDs are in the confirnmedFriendsId array
      // while sorting them in desending order via date.
      const posts = await Post.find({ user_id: { $in: confirmedFriendIds } }).sort({ date: -1 });

      const collection = [];
      // we run a for loop that iterates over the posts array 
      for (const post of posts) {
        const user = await User.findById(post.user_id);
        const regex = /^\w*[^@]/g;
        const username = user.email.match(regex);
        const isPicture = post.picture !== "";
        collection.push({
          post: post,
          picture: user.picture,
          username: username,
          isPicture: isPicture
        });
      }
      res.render("posts/index", { collection: collection, session_user: req.session.user });
    },

  New: (req, res) => {
    res.render("posts/new", {session_user: req.session.user});
  },
  Create: (req, res) => {
    const post = new Post(req.body);
    post.date = Date.now();
    post.user_id = req.session.user._id;
    console.log(post);
    const regex = /(https:\/\/.*\.(?:png|jpg|tif|tiff|bmp|jpeg|gif))/g
    if (post.message === "" || post.message.length > 250 || (post.picture != "" && !regex.test(post.picture))) {
      res.status(201).redirect("/posts/new");
    } else if (post.message[0] === " ") {
      const trimmed_post = post.message.trim();
      if (trimmed_post.length != 0) {
        post.message = trimmed_post;
        post.save((err) => {
          if (err) {
            throw err;
          }

          res.status(201).redirect(`/posts/`);
        });
      } else {
        res.status(201).redirect(`/posts/new`);
      }
    } else {
      post.save((err) => {
        if (err) {
          throw err;
        }
  
        res.status(201).redirect("/posts");
      });
    }
  },
 
  Like: (req, res) => {
    const postId = req.params.id;
    const userId = req.session.user._id
  
    Post.findById(postId, (err, post) => {
      if (err) {
        throw err;
      }
  
      const alreadyLiked = post.liked_by.includes(userId);
  
      if (!alreadyLiked) {
        post.likes = post.likes + 1;
        post.liked_by.push(userId);
      } else {
        post.likes = post.likes - 1;
        post.liked_by = post.liked_by.filter(id => id !== userId);
      }
  
      post.save((err) => {
        if (err) {
          throw err;
        }
  
        res.redirect("/posts");
      });
    });
  },

  Details: (req, res) => {
    const postId = req.params.id;
    Post.findById(postId, (err, post) => {
      if (err) {
        throw err;
      }
      return post;
    }).then((post) => (
      Comment.find((err, comments) => {
        if (err) {
          throw err;
        }

        let isPicture = post.picture !== "";

        res.render("posts/details", {comments: comments, post: post, session_user: req.session.user, isPicture: isPicture});
      }).where({post_id: postId})
    ));
  },

  CreateComment: (req, res) => {
      const postId = req.params.id;
      const userId = req.session.user._id

      const comment = new Comment(req.body);
      comment.post_id = postId;
      comment.user_id = userId;

      if (comment.message === "" || comment.message.length > 250) { 
        res.status(201).redirect(`/posts/${postId}`); 
      } else if (comment.message[0] === " ") {
        const trimmed = comment.message.trim();
        if (trimmed.length != 0) {
          comment.message = trimmed;
          comment.save((err) => {
            if (err) {
              throw err;
            }
            
            res.status(201).redirect(`/posts/${postId}`);
          });
        } else {
          res.status(201).redirect(`/posts/${postId}`);
        }
      } else {
        comment.save((err) => {
          if (err) {
            throw err;
          }
          
          res.status(201).redirect(`/posts/${postId}`);
        });
      }
  }
};

module.exports = PostsController;
