require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
//const encrypt = require('mongoose-encryption')
//const md5 = require('md5')
const bcrypt = require('bcrypt')
const saltRounds = 10

const app = express()
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs')
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true})

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})
//Encryption keys in .env

//it is important to add thid plugin above part1 bcoz in part1 we are paSSing userSchema to User model.
//For more to get on encryption read mongoose-encryption npm package in npmjs.com
//userSchema.plugin(encrypt, {secret: process.env.SECRETCODE, encryptedFields: ['password']})
//plugins give more functionality to schemas. For further details check mogoosejs.com/docs/plugins.html

//part1
const User = mongoose.model('user', userSchema)

app.get('/', (req, res)=>{
    res.render('home')
})

app.route('/login')
.get((req, res)=>{
    res.render('login')
})
.post((req, res)=>{
    
    username = req.body.username
    password = req.body.password

    User.findOne({email: username}, (err, result)=>{

        if(!err){
            // Load hash from your password DB.
            if(result){
                bcrypt.compare(password, result.password, function(err, hashResult) {
                    //this fn automatically converts password to its corresponding hash.
                    // result == true
                    if(hashResult){
                        res.render('secrets')
                    } else{
                        res.send("Invalid Password")
                    }
                }) 
            }  else{
                res.send("User does not exist.")
            } 
        } else{
            console.log(err)
        }
    })
})

app.route('/register')
.get((req, res)=>{
    res.render('register')
})
.post((req, res)=>{

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        const registrer = new User({
            email: req.body.username,
            password: hash
            
        })
        registrer.save()
        res.redirect('/login')
    });


})



app.listen('3000', ()=>{
    console.log("Server started on 3000....")
})

