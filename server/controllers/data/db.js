// const uri = require('./greyjoy.js');

const KEYS = require('../../keys/keys.js');
const uri = KEYS.POSTGRES_URI;
const pgp = require('pg-promise')();
const db = pgp(uri);
const bcrypt = require('bcrypt');
const cookieController = require('../cookie/cookieController.js');
const sessionController = require('../cookie/sessionController.js')

module.exports = {
  // User Sign Up
  createUser: (req, res, next) => {
    console.log(req.body)
    const saltRounds = 10;
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
      if (err) {
        throw new Error(err);
      }

      db.none('INSERT INTO users(username, password) VALUES($1, $2)', [`${req.body.username}`, `${hash}`])
        .then(() => {
          console.log('user created')
        })
        .catch(error => {
          console.log(error)
          next()
        })
      // Add user to 'users' table. Table has columns (_id, username (varchar(20)), password varchar(256))
     
      db.one('SELECT * FROM users WHERE username = ${req.body.username}')
        .then(data => {
          console.log(data)
          cookieController.setSSIDCookie(res, data._id) //set SSIDCookie after user created to their _id
          sessionController.startSession(data._id)
          next();
        })
        .catch(err => console.log(err));
        next()
    });
  },

  // User Log In
  loginUser: (req, res, next) => {
    db.any(
      `SELECT users._id, password FROM users WHERE username = '${req.body.username}';`,[true]
    )
      .then(data => {
        console.log(data)
        if (data.length === 0) {
          return res.redirect('/api/signup');
        }
        bcrypt.compare(req.body.password, data[0].password, (err, response) => {
          try {
            if (response) {
              cookieController.setSSIDCookie(res, data[0]._id)
              next();

            } else return res.redirect('/api/signup');
          } catch (err) {
            console.log('Bcrypt Error:', err);
          }
        });
      })
      .catch(err => {
        console.log(err);
      });
  }
};
