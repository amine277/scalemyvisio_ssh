const router = require('express').Router();
const User = require('../src/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {registerValidation,loginValidation} = require('../routes/validation');
const { exist } = require('@hapi/joi'); 
const path = require('path');







router.post('/SignUp',  async (req,res)=>{
  // Validate data

  console.log("dada");
  const { error } = registerValidation(req.body);
  if (error) return res.send(error.details[0].message);

  // check if user already exist
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.send("Email already exist !");

  //Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  // Add User
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
  });

  try {
    const savedUser = await user.save();

    res.send({ value: true, Id: user._id });
    //res.send({value:true,Id:user._id});
  } catch (err) {
    res.send(err);
  }
});


// LOGIN

router.post('/LogIn', async (req,res) => {
    console.dir(req.body)
 
    // Validate data
    const {error} = loginValidation(req.body);
    if(error) return res.send(error.details[0].message);

    // check email
    const user = await User.findOne({email:req.body.email})
    if(!user) return res.send('Email not found !');

    // check password 
    const validPass = await bcrypt.compare(req.body.password,user.password);
    if(!validPass) return res.send('Invalid password !');

    // Create and assign Token 
    const token = jwt.sign({_id: user._id},process.env.Secret_Token);
    //res.redirect('/Home.html');
    //res.header('auth-token',token).send(token);
    //home_register()    //res.send('Logged in !');
    try{
        res.send({value:true,Id:user._id});

    }
    catch(err){
        res.send(err);
    }
});



module.exports = router;