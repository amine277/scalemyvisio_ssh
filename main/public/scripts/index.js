if (location.href.substr(0, 5) !== "https")
  location.href = "https" + location.href.substr(4, location.href.length - 4);

const socket = io();

let producer = null;

//nameInput.value = 'bob' + Math.round(Math.random() * 1000)

socket.request = function request(type, data = {}) {
  return new Promise((resolve, reject) => {
    socket.emit(type, data, (data) => {
      if (data.error) {
        reject(data.error);
      } else {
        resolve(data);
      }
    });
  });
};

let rc = null;

/*function StartStream() {

  var y = document.getElementById("passageVisioStreaming");
  y.className = 'hidden';
  
  var x = document.getElementById("stopstream");
  x.className = '';
  

  axios.post('/stream', {

      Id: sessionStorage.getItem('Id'),
      Room :  sessionStorage.getItem('RoomId')

    }).then((response) => {
     

  }, (error) => {
      console.log(error);
    });


   socket.emit("startStream", );

    
  

}*/






function joinRoom(name, room_id,adminId) {
  const Id = sessionStorage.getItem("Id");

  if (rc && rc.isOpen()) {
    console.log("already connected to a room");
  } else {
    rc = new RoomClient(
      localMedia,
      remoteVideos,
      remoteAudios,
      window.mediasoupClient,
      socket,
      room_id,
      adminId,
      name,
      Id,
      roomOpen,
      ParticipantList
    );

    addListeners();
    /*  var data = new FormData();
data.append('name', 'person');
data.append('RoomId', 5);
var xhr = new XMLHttpRequest();
xhr.open('POST', '/creatRoom', true);
xhr.onload = function () {
    // do something to response
    if(this.responseText){
      console.log("1")
        res.sendFile('Register.html', { root: __dirname });
      }
    }
};
xhr.send(data);*/
  }

  function roomOpen() {
    reveal(startAudioButton);
    hide(stopAudioButton);
    reveal(startVideoButton);
    hide(stopVideoButton);
    reveal(startScreenButton);
    hide(stopScreenButton);
    reveal(exitButton);
    control.className = "";
    reveal(videoMedia);
  }

  function hide(elem) {
    elem.className = "hidden";
  }

  function reveal(elem) {
    elem.className = "";
  }

  function addListeners() {
    /*    let text = $('input')

$('html').keydown((e) => {
    if (e.which == 13 && text.val().length !== 0){
        console.log("On index.js: " + text.val())
        socket.emit('message',text.val());
    }
})

socket.on('serverMessage',(msg)=> {
        let conteneur = document.getElementById('conteneurMessage');
        let message = document.createElement('li');
        message.innerText = name + " " +msg;
        conteneur.appendChild(message);
        })*/

    rc.on(RoomClient.EVENTS.stopAudio, () => {
      hide(stopAudioButton);
      reveal(startAudioButton);
    });
    rc.on(RoomClient.EVENTS.startAudio, () => {
      hide(startAudioButton);
      reveal(stopAudioButton);
    });

    rc.on(RoomClient.EVENTS.startVideo, () => {
      hide(startVideoButton);
      reveal(stopVideoButton);
    });
    rc.on(RoomClient.EVENTS.stopVideo, () => {
      hide(stopVideoButton);
      reveal(startVideoButton);
    });
    rc.on(RoomClient.EVENTS.exitRoom, () => {
      hide(control);
      hide(videoMedia);
    });
  }

  // Load mediaDevice options
  navigator.mediaDevices.enumerateDevices().then((devices) =>
    devices.forEach((device) => {
      let el = null;
      if ("audioinput" === device.kind) {
        el = audioSelect;
      } else if ("videoinput" === device.kind) {
        el = videoSelect;
      }
      if (!el) return;

      let option = document.createElement("option");
      option.value = device.deviceId;
      option.innerText = device.label;
      el.appendChild(option);
    })
  );
}


socket.on("hereyougo",() =>{
  let roomName= sessionStorage.getItem("stream_id");
 JoinRoom(sessionStorage.getItem("name"), sessionStorage.getItem("stream_id"), sessionStorage.getItem("Id"))
 sessionStorage.removeItem("stream_id");
 sessionStorage.setItem("RoomId", roomName);
   
})

socket.on("sorry",() =>{
 swal("Sorry the admin wont let you in !");
  
})

//sending user Id to server
socket.emit("userId", sessionStorage.getItem("Id"));


socket.on("lethimin", ({viewerId , viewerSocket }) => {
     
     console.log("3afaaak dkhelni layhfdek  a si l admin" , viewerId)

     swal({
      title: "This guy want to join your room",
      text: viewerId,
      icon: "warning",
      buttons: true,
      dangerMode: false,
    })
    .then((willAdd) => {
      if (willAdd) {
        swal("Congrats! You got one more friend !", {
          icon: "success",
        });
        socket.emit("okay", {viewerId : viewerId , viewerSocket : viewerSocket})
      } else {
        swal("Okay! We will take care of him");
        socket.emit("mabghitch", {viewerId : viewerId , viewerSocket : viewerSocket })

      }
    });
})

let text = $("input");

$("html").keydown((e) => {
  if (e.which == 13 && text.val().length !== 0) {
    socket.emit("message", sessionStorage.getItem("name") + ": " + text.val());
    text.val("");
  }
});

socket.on("serverMessage", (msg) => {
  let conteneur = document.getElementById("conteneurMessage");
  let message = document.createElement("li");
  message.innerText = /*`${msg.nick}: ${msg.msg}`*/msg;
  conteneur.appendChild(message);
});
