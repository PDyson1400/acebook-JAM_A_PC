const User = require("../models/user");

const UsersController = {
  New: (req, res) => {
    res.render("users/new", {error: req.session.error, session_user: req.session.user});
  },

  Create: (req, res) => {
    const user = new User(req.body);

    User.findOne({email : user.email}, (err, founduser) => {
      if (err) {
        throw err;
      }

      if (user.email === "" || user.password.length < 8 || founduser != null) {
        req.session.error = "INVALID USERNAME OR PASSWORD";
        res.redirect("/users/new");
      } else if (founduser === null) {
        user.save((err) => {
          if (err) {
            throw err;
          }
          res.status(201).redirect("/sessions/new");
        });
      }
    })
  },

  Search: (req, res) => {
    let search = req.body.username
    let regex = new RegExp(search)
    User.find({email: regex}, (err, user) => {
      if (err) {
        throw err;
      }

      req.session.search = user;
      res.status(201).redirect(`/users/result`);
    })
  },

  Result: async (req, res) => {
    let result = await req.session.search
    res.render("users/result", {users: result, session_user: req.session.user});
  },
  
  Details: (req, res) => {
    if (!req.session.user && !req.cookies.user_sid) {
      res.redirect("/sessions/new");
    } else {
      const userId = req.params.id;
    const sessionId = req.session.user._id;

    User.findById(userId, (err, user) => {
      if (err) {
        throw err;
      }
  
      const isSessionUser = userId !== sessionId;

      const regex = /^\w*[^@]/g;
      const username = user.email.match(regex);
      
      if(userId != sessionId) {
        user.friends = [];
      }

      if (user.friends) {
        user.friends = user.friends.filter(friend => friend.status === "pending");
      }

      res.render("users/details", {
        user: user,
        session_user: req.session.user,
        is_session_user: isSessionUser,
        username: username,
      });
    });
    }
  },

  Request: (req, res) => {
    const currentId = req.session.user._id;
    const targetId = req.params.id;

    User.findById(currentId, (err) => {
      if (err) {
        throw err;
      }
    }).then((current_user) => {
      User.findById(targetId, (err, user) => {
        if (err) {
          throw err;
        }
        if (current_user.friends.filter(object => object.user_id === targetId).length === 0 && targetId != currentId)
        {
          if (user.friends.filter(object => object.user_id === currentId).length === 0) {
            user.friends.push({user_id: `${currentId}`, status: "pending"})
    
            user.save((err) => {
              if (err) {
                throw err;
              }
            });
          }
        }
        res.status(201).redirect(`/users/${targetId}`);
      });
    })
  },

  Confirm: (req, res) => {
    const theirId = req.params.id;
    const hostId = req.session.user._id;

    User.findOneAndUpdate({"_id": hostId, "friends.user_id": theirId}, {"$set": {"friends.$.status": "confirmed"}}, (err) => {
      if (err) {
        throw err;
      }
    }).then(
      User.findById(theirId, (err, user) => {
      if (err) {
        throw err;
      }
      if (user.friends.filter(object => object.user_id === hostId).length === 0) {
        user.friends.push({user_id: `${hostId}`, status: "confirmed"})

        user.save((err) => {
          if (err) {
            throw err;
          }
          res.status(201).redirect(`/users/${hostId}`);
        });
      } else {
        res.status(201).redirect(`/users/${hostId}`);
      }
      })
    );

    
  },

  Deny: (req, res) => {
    const theirId = req.params.id;
    const hostId = req.session.user._id;

    User.findOneAndUpdate({"_id": hostId, "friends.user_id": theirId}, {"$set": {"friends.$.status": "denied"}}, (err) => {
      if (err) {
        throw err;
      }
      res.status(201).redirect(`/users/${hostId}`);
    });
  },

  Picture: (req, res) => {
    const hostId = req.params.id;
    const currentId = req.session.user._id;
    
    User.findById(hostId, (err, user) => {
      const pic = req.body.picture
      const regex = /(https:\/\/.*\.(?:png|jpg|tif|tiff|bmp|jpeg|gif|JPG))/g
      if (regex.test(pic)) {
        user.picture = pic;
      }
      if (currentId === hostId) {
        user.save((err) => {
          if (err) {
            throw err;
          }
          req.session.user = user;
          res.status(201).redirect(`/users/${hostId}`);
        });
      } else {
        res.status(201).redirect(`/users/${hostId}`);
      }
    });
  },
};

module.exports = UsersController;
