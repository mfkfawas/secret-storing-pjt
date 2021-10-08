require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
//const encrypt = require('mongoose-encryption')
//const md5 = require('md5')
//const bcrypt = require('bcrypt')
//const saltRounds = 10
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const session = require('express-session')
const connectEnsureLogin = require('connect-ensure-login');// authorization
const GoogleStrategy = require('passport-google-oauth20').Strategy;//check - https://www.passportjs.org/packages/passport-google-oauth20/
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require("mongoose-findorcreate");


const app = express()
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs')
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true})

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
})
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

//Encryption keys in .env

//it is important to add thid plugin above part1 bcoz in part1 we are paSSing userSchema to User model.
//For more to get on encryption read mongoose-encryption npm package in npmjs.com
//userSchema.plugin(encrypt, {secret: process.env.SECRETCODE, encryptedFields: ['password']})
//plugins give more functionality to schemas. For further details check mogoosejs.com/docs/plugins.html

//part1
const User = mongoose.model('user', userSchema)

app.use(session({
    secret: process.env.EXPRESS_SESSION_SECRETCODE,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 }
  }))
  app.use(passport.initialize())
  app.use(passport.session())


  passport.use(User.createStrategy());

  passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

  //check - https://www.passportjs.org/packages/passport-google-oauth20/
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile)
      //from findOrCreate package.i.e findOrCreate() is not a mongoose/mongoDB method
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//check - 
passport.use(new FacebookStrategy({
    clientID: process.env.CLIENT_ID_FB,
    clientSecret: process.env.CLIENT_SECRET_FB,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/', (req, res)=>{
    res.render('home')
})

app.get('/logout', (req, res)=>{
    req.logout()
    res.redirect('/')
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

//callbackURL: "http://localhost:3000/auth/google/secrets". This URL is which we provided
//on google developer console(google developer console is a webpage where we provide our app's details for using google as authentication for login, this page also contains complete details of google APis for developers. )
//which means when google authentication is successful, it redirects to this route.
  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect here.
    res.redirect('/secrets');
  })

  app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

// app.route('/secrets')
// .get((req, res)=>{
//     if(req.isAuthenticated()){
//         res.render('secrets')
//     } else{
//         console.log("Not authenticated")
//         res.redirect('/login')
//     }
// })

//This codes are not from Angela Yu.Two days gone on above secrets route.
//This code i from https://heynode.com/tutorial/authenticate-users-node-expressjs-and-passportjs/
//This get() only allows authenticated users to see the secrets.
// app.get('/secrets', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
//     res.render('secrets')
//   });

//Now all users can see the written secrets, but cant see who written
app.get('/secrets', (req, res)=>{
    User.find({'secret': {$ne: null}}, (err, foundUsers)=>{
        res.render('secrets', {usersWithSecrets: foundUsers})
    })
    
})


  app.get('/submit', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    res.render('submit')
  });
  app.post('/submit', (req, res)=>{
      submittedSecret = req.body.secret
      console.log(req.user._id)

      User.findById(req.user._id, (err, foundUser)=>{
          if(err){
              console.log(err)
          } else{
              if(foundUser){
                  foundUser.secret = submittedSecret
                  foundUser.save(()=>{
                      res.redirect('/secrets')
                  })
              }
          }
      })
  })


app.route('/login')
.get((req, res)=>{
    res.render('login')
})
.post((req, res)=>{

    const user = new User({
        email: req.body.username,
        password: req.body.password
    })


//     // User.findOne({email: username}, (err, result)=>{

//     //     if(!err){
//     //         // Load hash from your password DB.
//     //         if(result){
//     //             bcrypt.compare(password, result.password, function(err, hashResult) {
//     //                 //this fn automatically converts password to its corresponding hash.
//     //                 // result == true
//     //                 if(hashResult){
//     //                     res.render('secrets')
//     //                 } else{
//     //                     res.send("Invalid Password")
//     //                 }
//     //             }) 
//     //         }  else{
//     //             res.send("User does not exist.")
//     //         } 
//     //     } else{
//     //         console.log(err)
//     //     }
//     // })

//     //aUTHENTICATION using passport.js
    req.login(user, (err)=>{
        if(err){
            console.log(err)
        } else{
                passport.authenticate('local')(req, res, ()=>{
                res.redirect('/secrets')
                })
        }
    })
})

app.route('/register')
.get((req, res)=>{
    res.render('register')
})
.post((req, res)=>{

    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     // Store hash in your password DB.
    //     const registrer = new User({
    //         email: req.body.username,
    //         password: hash
            
    //     })
    //     registrer.save()
    //     res.redirect('/login')
    // });

    //Passport.js authentication
    User.register({username: req.body.username}, req.body.password, (err, user)=>{
        if(err){
            console.log(err)
            res.redirect('/register')
        } else{
            passport.authenticate('local')(req, res, ()=>{
                res.redirect('/secrets')
            })
        }
    })
})                           



app.listen('3000', ()=>{
    console.log("Server started on 3000....")
})

