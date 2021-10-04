require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')

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
userSchema.plugin(encrypt, {secret: process.env.SECRETCODE, encryptedFields: ['password']})
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
            if(result){
                if(result.password === password){
                    res.render('secrets')
                } else{
                    res.send("Password Incorrect!!!!!!")
                }
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
    const registrer = new User({
        email: req.body.username,
        password: req.body.password
    })
    registrer.save()
    res.redirect('/login')
})



app.listen('3000', ()=>{
    console.log("Server started on 3000....")
})

