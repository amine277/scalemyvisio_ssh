const router = require('express').Router();
const path = require('path');
const { v4: uuidV4 } = require('uuid');
const shell = require('shelljs');
const exec = require('child_process').exec;
const { spawn } = require('child_process');
const cp = require('child_process')

const {socket_disconnect} = require('./BackEndScripts')


const User = require('../src/User');
const Room = require('../src/Rooms');

var child;


//const { joinRoom } = require('../public/index');



function data_roomCreated(user, RoomId) {


}


router.post('/ChooseStream', async function (req, res) {

    const rooms = await Room.find({ "streamed": 1 }, 'name');

    //const rooms=cursor.toArray()
    var liste = [];
    rooms.forEach(element => {

        liste.push(element.name);

    });
    console.log(liste);
    res.send(liste)

});




router.post('/RoomClientList', async function(req,res){
    var Id = req.body.Id;
    var roomId = req.body.roomId;

    const room = await Room.findOne({ name: roomId })
    var   role = await User.find
    if (room) {
        var list = room.participant
        var list2 = room.viewer
        console.log(list)


        try {

            res.send({ value: true, list: list })
        }
        catch (err) {
            res.send(err);
        }
    }



});


router.post('/infoRequest', async function (req, res) {

    console.log("infoRequest")
    const user = await User.findOne({ email: req.body.email })

    res.send(user._id)
});


router.post('/exitRoom', async function (req, res) {
    var user_name = req.body.name;
    var roomName = req.body.roomId;
    var Id = req.body.Id;

    const room = await Room.findOne({ name: roomName })

    if (room) {
        room.participant.pop({ Id: Id, username: !null });
        const savedRoom = await room.save();
    }
    res.send({ value: true });
});


router.post('/exit', function (req, res) {
    //res.send({value:true});

    //joinRoom("yahya", "11");




});


router.post('/creatRoom', async function (req, res) {
    var user_name = req.body.name;
    var roomName = req.body.roomId;
    var Id = req.body.Id;
    var type = req.body.type;
    var password = req.body.password;
    const roomexist = await Room.findOne({ name: roomName })
    if (!roomexist) {
        const room = new Room({
            admin: Id,
            name: roomName,
            url: uuidV4(),
            type: type,
            password : password,
        });
        try {
            const user = await User.findOne({ _id: Id });
            user.room = roomName;
            user.role = 1;
            const savedUser = await user.save();
            room.participant.push({ Id: Id, username: user_name });
            const savedRoom = await room.save();
            console.log("ll");
            res.send({ value: true, url: room.url });
        }
        catch (err) {
            res.send(err);
        }
    }
    else {
        res.send({ value: false, message: "This room name already exist!" })
    }
});

router.post('/joinprivateroom', async function (req, res) {
   var user_name = req.body.name;
   var roomName = req.body.roomId;
   var Id = req.body.Id;
   var password = req.body.password;
   const room = await Room.findOne({ name: roomName })
   if (room.password == password){
       try{
        res.send({ value: true, url: room.url})
       }
       catch(err){
           res.send({value : false})
       }
   }
})
router.post('/joinRoom', async function (req, res) {
    var user_name = req.body.name;
    var roomName = req.body.roomId;
    var Id = req.body.Id;


    const room = await Room.findOne({ name: roomName })
    
    if (!room) {
     


        try {
            res.send({ value: false, message: "Room Not Found" });
        }
        catch (err) {
            res.send(err);
        }
    }
    else {
        if (!room.password){
            try {
                const user = await User.findOne({ _id: Id })
                user.room = roomName;
                user.role = 2;
                const savedUser = await user.save();
    
                room.participant.push({ Id: Id, username: user_name });
                const savedRoom = await room.save();
                res.send({ value: true, url: room.url,type: 0})  //0 = PUBLCI 
            }
            catch (err) {
                res.send(err);
            }
        }
        else{
        
                res.send({ value: true, url: room.url,type: 1});

          
        }
       
    }

});


  router.post('/joinStream', async function(req,res){
    var user_name = req.body.name;
    var roomName = req.body.roomId;
    var Id = req.body.Id;
    

    const room = await Room.findOne({name:roomName , streamed : 1})

    if(!room){

       

        try{
            res.send({value:false,message:"No stream available for this room"});
        }
        catch(err){
            res.send(err);
    }}
    else{
        try{
            const user = await User.findOne({_id:Id})
            user.stream = roomName;
            user.role = 3;
            const savedUser =  await user.save();

            room.viewers.push({Id:Id,username:user_name});
            const savedRoom =  await room.save();
            res.send({value:true,url:room.url})
        }
        catch(err){
            res.send(err);
        }
    }
    
  });

router.post('/stream',async function(req,res){


    
    try {
        const room = await Room.findOne({ name: req.body.Room })
        room.streamed = 1;
        await room.save();

        console.log("axios streaam");


        child = cp.spawn("./stream.sh");

        child.stdout.pipe(process.stdout);
        child.stderr.pipe(process.stderr);



        res.status(204).send();
    }
    catch (err) {
        res.status(400).send(err);
    }

});

router.post('/stop_stream', async function (req, res) {


    //console.log("streaaaam");
    try {
        const room = await Room.findOne({ name: req.body.Room })
        room.streamed = 0;
        await room.save();


        child.kill();



        res.status(204).send();
    }
    catch (err) {
        res.status(400).send(err);
    }

});


router.get('/ChooseStream', (req, res) => {
    try {
        res.sendFile('ChooseStream.html', { root: path.join(__dirname, '../public') });
    }
    catch (err) {
        res.status(400).send(err);
    }
});


router.get('/', function (req, res) {
    res.render('index')
});

router.get('/Home', function (req, res) {
    res.render('Home')
});


router.get('/Streaming', function (req, res) {
    res.render('streaming')
});

router.get('/room/:room', async function (req, res) {
    //var roomName = req.body.roomId;
    //var Id = req.body.Id;

    const room = await Room.findOne({ url: req.params.room })

    if (room) {
        res.render('Visio')
    }

    else {
        res.render('Home')
    }


});
router.get('/stream/:room',async function(req, res){
    //var roomName = req.body.roomId;
    //var Id = req.body.Id;

    const stream = await Room.findOne({url:req.params.room , streamed : 1})

    if(stream){
    res.render('streaming')}

    else{
        res.render('Home')}
 
    
});


router.get('/exit', function (req, res) {
    res.render('index')
});

router.get('/register', function (req, res) {
    res.render('Register')
});


module.exports = router;