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

io.on("connection", (socket) => {
  console.log("New user joined socket : " + socket.id);
  io.to(socket.id).emit("response", "You are connected to socket");
  io.to(socket.id).emit("socketId", socket.id);

  socket.on("getCallId", (data) => {
    console.log(`Received getCallId request from ${socket.id}`);

    // Generate a new call ID (you can use a UUID library here)
    const callId = Math.floor(Math.random() * 1000000).toString();

    // Send the call ID back to the socket that made the request
    socket.emit("sentCallId", { callId });

    console.log(`Sent callId ${callId} to ${socket.id}`);
  });

  socket.on(
    "initiate-call",
    ({ userName, callId, offer, socketId }, callback) => {
      console.log(
        `Received call initiation request from ${userName} for call ${callId}.`,
        offer
      );
      localStorageManager.storeOffer(callId,socketId ,offer );
      
      const callStatus = {
        success: true,
        message: `Call initiated for ${callId}.`,
      };
      callback(callStatus);
    }
  );

  socket.on("makeJoinRequest", ({ userName, callId, socketId }, callback) => {
    console.log(
      `Received join call request from ${userName} for call ${callId}.`
    );

    // Retrieve the socket ID associated with the call ID from the cache
    // this socket id is the id of one who has created meeting or call
    const hostSocketId = localStorageManager.getCallCreatorSocketId(callId);
    console.log(`socket id of host of call ${callId} is : `,hostSocketId)
    if (!hostSocketId) {
      const error = {
        success: false,
        message: `Socket ID not found for call ${callId}.`,
      };
      socket.emit("makeJoinRequestError", error);
      return;
    }

    // Store the join offer in the cache for the given call ID and socket ID
    localStorageManager.storeJoinRequest(callId, socketId ,userName);
    console.log("Stored join request : ",localStorageManager.getJoinRequest(socketId))
    // Emit the "joinRequest" event to the socket ID associated with the call ID
    const joinData = {
      userName,
      socketId,
      id : new Date().getMilliseconds()
    };

    io.to(hostSocketId).emit("joinRequest", joinData);
    // Return success status to the client
    const status = {
      success: true,
      message: "Join request sent successfully.",
    };
    callback(status);
  });


  socket.on("sendAcceptJoinRequest", ({ callId, socketId }, callback) => {
    console.log(
      `Received accept join request for ${callId} of ${socketId}`
    );

    // Retrieve the socket ID associated with the call ID from the cache
    // this socket id is the id of one who has created meeting or call
    const offer = localStorageManager.getOffer(callId);
    
    if (!offer) {
      const error = {
        success: false,
        message: `Offer  not found for id ${callId}.`,
      };
      socket.emit("sendAcceptJoinRequestError", error);
      return;
    }

    // Emit the "requestStatus" event to the socket ID associated with the call ID

    const joinData = {
      remoteOffer : offer.offer,
      isAccepted:true,
      id : new Date().getMilliseconds()
    };

    io.to(socketId).emit("requestStatus", joinData);

    // Return success status to the client
    const status = {
      success: true,
      message: "Request acceptance sent successfully.",
    };
    callback(status);
  });
  

  socket.on("joinCall", ({ userName, callId, joinOffer,socketId }, callback) => {
    console.log(
      `Received  join call request for ${callId} from ${socketId} with userName ${userName}`
    );

    // Retrieve the socket ID associated with the call ID from the cache
    const hostSocketId = localStorageManager.getCallCreatorSocketId(callId);
      
    if (!hostSocketId) {
      const error = {
        success: false,
        message: `Socket is not found for call id ${callId}.`,
      };
      socket.emit("joinCallError", error);
      return;
    }

    // Emit the "requestStatus" event to the socket ID associated with the call ID
    const data = {
      remoteOffer : joinOffer,
      userName,
      socketId,
      id : new Date().getMilliseconds()
    };

    io.to(hostSocketId).emit("userToAddInCall", data);

    // Return success status to the client
    const status = {
      success: true,
      message: "Request acceptance sent successfully.",
    };
    callback(status);
  });
  

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
