/*                   Redirection de fichiers front                      */

//const { response } = require("express");

//const  response  = require("express");

function exit() {
  sessionStorage.clear();
  axios
    .post("/exit", {
      Id: sessionStorage.getItem("Id"),
    })
    .then(
      (response) => { },
      (error) => {
        console.log(error);
      }
    );
  window.location.pathname = "/";
}


function swaprole(){
  axios
  .post("/SwapRole", {
    Id: sessionStorage.getItem("Id"),
    roomId: sessionStorage.getItem("RoomId"),
    
  })
  .then((response) => {
    const list = response.data.list;

    let fen = document.getElementById("ParticipantListExtra");
    fen.innerHTML = "";
    list.forEach((element) => {
      let part = document.createElement("li");
      part.innerText = element.username;
      var swap = document.createElement("button");
      swap.setAttribute('class', 'btn btn-default');
      swap.innerHTML = 'SWAP ROLE';
      fen.appendChild(part);
    });
  },
  (error) => {
    console.log(error);
  }
);
}


function getRoomClientList() {
  console.log("roomId: " + sessionStorage.getItem("RoomId"))
  axios
    .post("/RoomClientList", {
      Id: sessionStorage.getItem("Id"),
      roomId: sessionStorage.getItem("RoomId"),
    })
    .then(
      (response) => {
        const list = response.data.list;
        
        let fen = document.getElementById("ParticipantList");
        fen.innerHTML = "";
        list.forEach((element) => {
          let part = document.createElement("li");
          part.innerText = element.username;
          fen.appendChild(part);
        });
      },
      (error) => {
        console.log(error);
      }
    );
}

function IsLogedIn() {
  var Id = sessionStorage.getItem("Id");
  if (!Id) {
    window.location.pathname = "/";
  }
}

function IsLogedOut() {
  var Id = sessionStorage.getItem("Id");
  if (Id) {
    window.location.pathname = "/Home";
  }
}

function SignUp_Request(email, pseudo, pwd) {
  axios
    .post("/SignUp", {
      email: email,
      name: pseudo,
      password: pwd,
    })
    .then(
      (response) => {
        if (response.data.value) {
          sessionStorage.setItem("Id", response.data.Id);
          window.location.pathname = "/Home";
        } else {
          swal({
            title: response.data,
            icon: "error",
          });
        }
      },
      (error) => {
        console.log(error);
      }
    );
}



function login_streaming() {
  axios
    .post("/ChooseStream", {
      Id: localStorage.getItem("Id"),
    })
    .then(
      (response) => {
        const rooms = response.data;
        console.log(rooms);
        //rooms.forEach(element => console.log(element));
        //var streams = document.getElementById('streams');
        var list = document.getElementById("list");
        rooms.forEach((element) => {
          var room = document.createElement("li");
          room.innerHTML = '<p><a href="#">' + element + "</a></p>";
          list.appendChild(room);
        });
      },
      (error) => {
        console.log(error);
      }
    );
}

/*function StartStream() {

  var y = document.getElementById("passageVisioStreaming");
  y.className = 'hidden';

  var x = document.getElementById("stopstream");
  x.className = '';


  axios.post('/stream', {

    }, (error) => {
        console.log(error);
      });
     
    

}*/


function StopStream() {


  var x = document.getElementById("stopstream");
  x.className = 'hidden';
  var y = document.getElementById("passageVisioStreaming");
  y.className = '';

  axios.post('/stop_stream', {

    Id: sessionStorage.getItem('Id'),
    Room: sessionStorage.getItem('RoomId')

  }).then((response) => {


  }, (error) => {
    console.log(error);
  }
  );
}

function logIn_Request(email, pwd) {
  axios
    .post("/LogIn", {
      email: email,
      password: pwd,
    })
    .then(
      (response) => {
        if (response.data.value) {
          sessionStorage.setItem("Id", response.data.Id);
          window.location.pathname = "/Home";
        } else {
          swal({
            title: response.data,
            icon: "error",
          });
        }
      },
      (error) => {
        console.log(error);
      }
    );
}


function JoinStream(name, RoomId, Id) {
  socket.disconnect();
  axios
    .post("/joinStream", {
      roomId: RoomId,
      name: name,
      Id: Id,
    })
    .then(
      (response) => {
        console.log(response);

        if (response.data.value) {
          window.location.pathname = `/stream/${response.data.url}`;
          sessionStorage.setItem('stream_id',RoomId);
          sessionStorage.setItem('name', name);
        } else {
          swal({
            title: response.data.message,
            icon: "error",
          });
        }
      },
      (error) => {
        console.log(error);
      }
    );
}

function goVisio() {
  
  socket.emit('letmein', { viewerId : sessionStorage.getItem('Id') , roomToJoin : sessionStorage.getItem('stream_id') })


}

function JoinRoom(name, RoomId, Id) {
  socket.disconnect();
  axios
    .post("/joinRoom", {
      roomId: RoomId,
      name: name,
      Id: Id,
    })
    .then(
      (res) => {
        if (res.data.value && !res.data.type ) {
          window.location.pathname = `/room/${res.data.url}`;
        }
        else if (!res.data.value ) {
          swal({
            title: response.data.message,
            icon: "error",
          });
        }
        else if (res.data.value && res.data.type){
          swal({
            icon:"info",
            title: "Type in the SMV pin code",
            text: "Please Type 4 Digit Numbers",
            content: {
              element : "input",
              attributes : {
                placeholder : "Type your pin code",
                type :"password",
              },
            },
            inputType: "password",  
            showCancelButton: true,
            closeOnConfirm: false  
          }).then((value) => {
            console.log(value);
            axios.post("/joinprivateroom", {
              roomId: RoomId,
              name: name,
              Id: Id,
              password : value
            })
            .then((response) => {
              if (response.data.value) {
                window.location.pathname = `/room/${response.data.url}`;
              } else {
                swal({
                  title: response.data.message,
                  icon: "error",
                });
              }
            },
              (error) => {
                console.log(error);
              })

        },
      (error) => {
        console.log(error);
      }
    );
        }
})
}

async function creatRoom(name, RoomId, Id) {
  socket.disconnect();    
      swal("SCALEMYVISIO MEETING BOARD",`Do you wanna create an SMV Meeting named ? : ${RoomId}`, {
        buttons: {
          confirm: {
            text: `Public`,
            value: "public",
          },
          secure: {
            text:`Private`,
            value: "private",
          },
          exit: true,
        },
      })        .then((value) => {
          switch (value) {
            case "public":
              swal("SMV meeting is created!", "success");
              console.log(RoomId);
              axios.post("/creatRoom", {
                  roomId: RoomId,
                  name: name,
                  Id: Id,
                  type: 0,
                  password : null
                })
                .then((response) => {
                  if (response.data.value) {
                    sessionStorage.setItem("isAdmin", 1);
          window.location.pathname = `/room/${response.data.url}`;

          socket.emit("addAdmin", { adminId : sessionStorage.getItem('Id') } );
                    
                  } else {
                    swal({
                      title: response.data.message,
                      icon: "error",
                    });
                  }
                },
                  (error) => {
                    console.log(error);
                  }
                );
              break;

              case "private":
                swal({
                  icon:"info",
                  title: "Create your SMV pin code",
                  text: "Please Type 4 Digit Numbers",
                  content: {
                    element : "input",
                    attributes : {
                      placeholder : "Type your pin code",
                      type :"password",
                    },
                  },
                  inputType: "password",  
                  showCancelButton: true,
                  closeOnConfirm: false  
                }).then((value) => {
                  console.log(value);
                  axios.post("/creatRoom", {
                    roomId: RoomId,
                    name: name,
                    Id: Id,
                    type: 1,
                    password : value
                  })
                  .then((response) => {
                    if (response.data.value) {
                      sessionStorage.setItem("isAdmin", 1);
                      window.location.pathname = `/room/${response.data.url}`;

                      socket.emit("addAdmin", { adminId : sessionStorage.getItem('Id') } );
                    
                      
                    } else {
                      swal({
                        title: response.data.message,
                        icon: "error",
                      });
                    }
                  },
                    (error) => {
                      console.log(error);
                    })
                  });
                break;
                
                };
             
            
        });

}


function SendRequest(payload, url) {
  // Turn the data object into an array of URL-encoded key/value pairs.

  (async () => {
    const rawResponse = await fetch("/infoRequest", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const Id = await rawResponse.json();

    // console.log(Id);
    sessionStorage.setItem("Id", Id);
  })();
}

function Room_update_loc(name, RoomId) {
  sessionStorage.setItem("name", name);
  sessionStorage.setItem("RoomId", RoomId);
}

function exitRoom() {
  axios
    .post("/exitRoom", {
      Id: sessionStorage.getItem("Id"),
      name: sessionStorage.getItem("name"),
      roomId: sessionStorage.getItem("RoomId"),
    })

    .then(
      (response) => {
        if (response.data.value) {
          sessionStorage.removeItem("name");
          sessionStorage.removeItem("RoomId");
          sessionStorage.setItem("inRoom", 0);
          window.location.pathname = "/Home";
        }
      },
      (error) => {
        console.log(error);
      }
    );
}

function Updateinfo(email) {
  sessionStorage.setItem("email", email);
}

function home_login() {
  home.className = "hidden";
  login.className = "";
}

function home_register() {
  window.location.pathname = "/register";
}

function adminInterface() {
  passageVisioStreaming.className = "hidden";
  controlePassage.className = "";
}

/*                          Design bouttons                         */
function ParticipantHide() {
  var x = document.getElementById("Participant");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}

function ParticipantControlHide() {
  var x = document.getElementById("ParticipantControl");
  var y = document.getElementById("localMedia");

  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}

function ChatHide() {
  var x = document.getElementById("chat");
  var y = document.getElementById("buttons");
  var z0 = document.getElementById("videoMedia");
  var z2 = document.getElementById("remoteVideos");

  if (x.style.display === "none") {
    x.style.display = "block";
    y.style.width = "80%";
    z0.style.width = "80%";
    z2.style.width = "100%";
  } else {
    x.style.display = "none";
    y.style.width = "100%";
    z0.style.width = "100%";
    z2.style.width = "100%";
  }
}

function homePasswordHide() {
  var x = document.getElementById("homePasswordInput");
  var y = document.getElementById("homeHide1");
  var z = document.getElementById("homeHide2");

  if (x.type === "password") {
    x.type = "text";
    y.style.display = "block";
    z.style.display = "none";
  } else {
    x.type = "password";
    y.style.display = "none";
    z.style.display = "block";
  }
}

function registerPasswordHide() {
  var x = document.getElementById("registerPasswordInput");
  var y = document.getElementById("registerHide1");
  var z = document.getElementById("registerHide2");

  if (x.type === "password") {
    x.type = "text";
    y.style.display = "block";
    z.style.display = "none";
  } else {
    x.type = "password";
    y.style.display = "none";
    z.style.display = "block";
  }
}

function participantStreamingHide() {
  var x = document.getElementById("ParticipantsStreaming");
  if (x.className === "hidden") {
    x.className = "";
  } else {
    x.className = "hidden";
  }
}

function chatStreamingHide() {
  var x = document.getElementById("ChatStreaming");
  var y = document.getElementById("StreamingButtons");
  if (x.className === "hidden") {
    x.className = "";
    y.style.width = "80%";
  } else {
    x.className = "hidden";
    y.style.width = "100%";
  }
}

/*                          Fonction servant au chat
$('html').keydown((e) =>{
    if (e.which == 13){
        const text = $('#chat_input');
        rc.sendChat(text.val());
        text.val("");
    }
})*/
