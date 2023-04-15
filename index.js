const express = require("express");
const cors = require("cors");
const { storageManager } = require("./storage-manager/storage-manager");
let localStorageManager = storageManager();
const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("webRTC-Signal-server");
});

const server = app.listen(8080, () => {
  console.log("Server started on port 8080");
});

const io = require("socket.io")(server);

function generateRandomCallID() {
  let randomID = "";
  const digits = "0123456789";
  const length = 16;

  for (let i = 0; i < length; i++) {
    randomID += digits.charAt(Math.floor(Math.random() * digits.length));
  }

  return randomID;
}

function generateRandomRequestID() {
  let randomID = "";
  const digits = "abcdefghijklmnopqrstuvwxyz";
  const length = 16;

  for (let i = 0; i < length; i++) {
    randomID += digits.charAt(Math.floor(Math.random() * digits.length));
  }

  return randomID;
}
io.on("connection", (socket) => {
  console.log("New user joined socket : " + socket.id);
  io.to(socket.id).emit("recieveSocketId", socket.id);

  socket.on(
    "createCall",
    ({ socketId, callTitle, callDescription, callType }, callback) => {

      console.log(
        `Request to create call with title : ${callTitle} from socket : ${socketId} | callType : ${callType}`
      );


      let callId = generateRandomCallID();
      let hostName = socketId;
      let hostId = socketId;
      let hostSocketId = socketId;

      localStorageManager.addNewCall(
        callId,
        callType,
        hostName,
        hostId,
        hostSocketId,
        callTitle,
        callDescription
      );

      console.log("Stored : ", localStorageManager.getCallByCallId(callId));

      const response = {
        success: true,
        callId,
        message: "Request startPrivateCall recieved successfully.",
      };

      callback(response);
    }
  );

  socket.on(
    "makeJoinCallRequest",
    ({ callId, candidateName, socketId }, callback) => {
      let requestId = generateRandomRequestID();
      let requesterSocketId = socketId;
      let requestStatus = "pending";
      localStorageManager.addJoinRequest(
        callId,
        requestId,
        requesterSocketId,
        requestStatus,
        candidateName
      );
      console.log(
        "Stored new join request ,",
        localStorageManager.getRequestByRequestId(requestId)
      );
      //notify host of give call id.
      let hostSocketId =
        localStorageManager.getSocketIdOfCallHostByCallId(callId);
      console.log("host socket id", socketId);

      io.to(hostSocketId).emit(
        "listenJoinRequest",
        { requestPayload: localStorageManager.getRequestByRequestId(requestId),requestId}
      );

      const response = {
        success: true,
        requestId,
        message:
          "Request makeOneToOneCallJoiningRequest recieved successfully.",
      };

      callback(response);
    }
  );

  socket.on("updateJoinCallRequestStatus", ({ requestId,status,socketId }, callback) => {
    //Here we need to notify all candidates of call about this new connection
    console.log("before updating request :",localStorageManager.getRequestByRequestId(requestId)); 
    localStorageManager.updateJoinRequestStatus(requestId,status);
    console.log("updated request :",localStorageManager.getRequestByRequestId(requestId)); 
    const response = {
      success: true,
      message: "Request for updating join request recieved successfully.",
    };

    callback(response);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
