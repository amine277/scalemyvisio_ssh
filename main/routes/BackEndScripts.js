const User = require('../src/User');
const Room = require('../src/Rooms');


async function socket_disconnect(Id){
    console.log("disconnected");
    Clean_room_hist(Id)

}


async function Clean_room_hist(Id){
    console.log(Id)
    const user = await User.findOne({_id:Id});
    var room;

    if(user){
    if(user.room){

         room = await Room.findOne({name:user.room});
    }
    user.room = null;
    user.role=null;
    }

    if(room){
      room.participant.pop({ Id: Id, username: !null });
      const savedRoom = await room.save();

      //delete room if empty
      if (room.participant.length == 0) {
        room.remove();
      }
      console.log("deleted");
    }

}

function killRoom (Id){


}























        exports.socket_disconnect=socket_disconnect;