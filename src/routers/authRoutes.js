const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const requireAuth = require("../middleware/requireAuth");
const dotenv = require("dotenv");
const passport = require("passport");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const FacebookStrategy = require("passport-facebook").Strategy;
const fetch = require("node-fetch");
dotenv.config({
  path: "./config.env",
});
//Verify token
const googleAuth = async (token) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: [process.env.GOOGLE_CLIENT_ID],
  });

  return ticket.getPayload();
};

// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: "877302712882660",
//       clientSecret: "bb08ee2f5f9c72d9b9a17ca26052e90f",
//       callbackURL: "http://localhost:5000/auths/login/facebook/callback",
//       profileFields: ["id", "displayname"],
//     },
//     function (accessToken, refreshToken, profile, cb) {
//       // User.findOrCreate({ facebookId: profile.id }, function (err, user) {
//       //   return cb(err, user);
//       // });
//       // const { email, first_name, last_name } = profile._json;
//       // const userData = {
//       //   email,
//       //   firstName: first_name,
//       //   lastName: last_name
//       // };
//       // console.log(profile.id);
//       console.log(accessToken, refreshToken, profile);
//       const userData = {};
//       cb(null, userData);
//     }
//   )
// );
//Create new user by email and password
router.post("/register", async (req, res) => {
  //genarate new password with salt = 10
  try {
    const salt = await bcrypt.genSaltSync(10);
    const createHashPassword = await bcrypt.hashSync(req.body.password, salt);
    let user = new User({
      fullName: req.body.fullName,
      email: req.body.email,
      password: createHashPassword,
    });
    const snapshot = await User.find({
      email: req.body.email,
    });
    if (snapshot.length > 0) {
      return res.status(400).json({
        message: "Username already taken",
        success: false,
      });
    }
    user = await user.save();

    return res.status(200).json({
      message: "User created successfully",
      success: true,
      user: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

//Login with email and password
router.post("/login/users", async (req, res) => {
  //simple check validation
  if (req.query.userRole) {
    try {
      const snapshot = await User.findOne({
        email: req.body.email,
      });
      if (!snapshot) {
        console.log(snapshot);
        return res.status(401).json({
          success: false,
          message: "Account not exist",
        });
      }

      const passwordHash = snapshot.password;
      const enterPassword = req.body.password;

      bcrypt.compare(enterPassword, passwordHash, function (err, result) {
        if (result == true) {
          if (req.query.userRole == String(snapshot.isUser)) {
            if (!snapshot.isHidden) {
              const tokenGenerate = jwt.sign(
                {
                  userAuth: {
                    id: snapshot.id,
                    email: snapshot.email,
                    isUser: snapshot.isUser,
                    picture: snapshot.image,
                    name: snapshot.fullName,
                  },
                },
                process.env.SECRET_KEY,
                {
                  expiresIn: "8h",
                }
              );
              return res.status(200).json({
                success: true,
                message: "Login successfully",
                token: tokenGenerate,
              });
            } else {
              res.status(403).json({
                message: "Your account is blocked",
                success: false,
              });
            }
          } else {
            return res.status(500).json({
              message: "Role of user is not allowed",
              success: false,
            });
          }
        } else {
          return res.status(401).json({
            success: false,
            message: "Username or password are incorrect",
          });
        }
      });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({
        message: "Internal server error",
        success: false,
      });
    }
  } else {
    return res.status(500).json({
      message: "Role of user is not allowed",
      successful: false,
    });
  }
});

//Login with  google api
router.post("/login/google", async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({
        message: "Access token not found",
      });
    }
    const token = authorization.split(" ")[1];

    const user = await googleAuth(token);

    const snapshot = await User.findOne({
      email: user.email,
    });

    if (!snapshot) {
      if (String(req.query.userRole) === "true") {
        let newUser = new User({
          fullName: user.name,
          email: user.email,
          password: "",
          image: user.picture,
        });

        newUser = await newUser.save();

        if (!newUser) {
          return res.status(500).json({
            message: "Cannot create user",
            success: false,
          });
        } else {
          return res.status(200).json({
            message: "Create user successfully",
            success: true,
            user: newUser,
            token: token,
          });
        }
      } else {
        res.status(401).json({
          message: "Permission deny",
          success: false,
        });
      }
    } else {
      if (req.query.userRole) {
        if (String(snapshot.isUser) == req.query.userRole) {
          if (!snapshot.isHidden) {
            return res.status(200).json({
              message: "User login",
              success: true,
              user: snapshot,
              token: req.headers.authorization,
            });
          } else {
            res.status(403).json({
              message: "Your account is blocked",
              success: false,
            });
          }

          //TODO: Update user
        } else {
          return res.status(500).json({
            message: "Bad information",
            count: 0,
            users: [],
          });
        }
      } else {
        return res.status(500).json({
          message: "Missing role of user ",
        });
      }
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
});

router.get("/verify", requireAuth, async (req, res) => {
  try {
    return res.status(200).json({
      message: "Token is valid",
      success: true,
      user: req.body.userAuth,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});

router.post("/login/facebook", async (req, res) => {
  try {
    const { userID, accessToken } = req.body;
    // let checkUrl = `https://graph.facebook.com/debug_token/?input_token=${accessToken}&
    // access_token=[app_token_or_admin_token]`;
    // fetch(checkUrl, { method: "GET" })
    //   .then((res) => res.json())
    //   .then(async (response) => {

    //   });

    let urlGraphFacebook = `https://graph.facebook.com/${userID}?fields=id,name,email,picture&access_token=${accessToken}`;

    fetch(urlGraphFacebook, {
      method: "GET",
    })
      .then((res) => res.json())
      .then(async (resspone) => {
        const { name, id } = resspone;
        if (typeof name == "undefined" || typeof id == "undefined") {
          return res.status(401).json({
            message: "Authentication failed",
            success: false,
          });
        }
        console.log(name, id);
        const snapshot = await User.findOne({
          email: id,
        });
        //If facebook user id not exist, create one
        if (!snapshot) {
          let newUser = new User({
            fullName: name,
            email: id,
            password: "",
          });

          newUser = await newUser.save();
          if (!newUser) {
            return res.status(500).json({
              message: "Cannot create user",
              success: false,
            });
          } else {
            return res.status(200).json({
              message: "Create user successfully",
              success: true,
              user: newUser,
              token: accessToken,
            });
          }
        } else {
          if (req.query.userRole) {
            if (String(snapshot.isUser) == req.query.userRole) {
              //TODO: Update user
              return res.status(200).json({
                message: "User login successfully",
                success: true,
                user: snapshot,
                token: accessToken,
              });
            } else {
              return res.status(500).json({
                message: "Permission deny",
                success: false,
              });
            }
          } else {
            return res.status(500).json({
              message: "Permission deny",
              success: false,
            });
          }
        }
      })
      .catch((err) => {
        console.log(err.message);
        return res.status(500).json({
          success: false,
          message: "Invalid connection",
        });
      });
  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: "Internal error server",
    });
  }
});
module.exports = router;
