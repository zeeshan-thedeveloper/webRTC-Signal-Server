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

      io.to(hostSocketId).emit("listenJoinRequest", {
        requestPayload: localStorageManager.getRequestByRequestId(requestId),
        requestId,
      });

      const response = {
        success: true,
        requestId,
        message:
          "Request makeOneToOneCallJoiningRequest recieved successfully.",
      };

      callback(response);
    }
  );

  socket.on(
    "updateJoinCallRequestStatus",
    ({ requestId, hostIceCandidates, offer, status, socketId }, callback) => {
      //Here we need to notify all candidates of call about this new connection
      //updating request status
      let request = localStorageManager.updateJoinRequestStatus(
        requestId,
        status
      );
      console.log("updated request : ", request);
      let requesterName = request.requesterName;
      let callId = request.callId;
      let requesterSocketId = request.requesterSocketId;
      let hostSocketId = socketId;
      let isConnected = "pending";
      let newCandidate = localStorageManager.addCandidateToCall(
        callId,
        requesterName,
        requesterSocketId,
        hostIceCandidates,
        offer,
        isConnected
      );
      let completeCall = localStorageManager.getCallByCallId(callId);

      console.log("newCandidate", newCandidate);
      console.log("completeCall", completeCall);

      //now storing hostICE-candidates
      //Now emit an event for new candidate "listenHostOffer";
      let callHostName = completeCall.hostName;
      //we can send other details of call from here as well.

      io.to(requesterSocketId).emit("listenHostOffer", {
        hostOffer: offer,
        hostIceCandidates,
        requestId,
        hostName: callHostName,
        hostSocketId,
        requesterName,
      });

      //Now emit an event for all other candidates of given call Id : ;

      const response = {
        success: true,
        newCandidate,
        message: "Request for updating join request recieved successfully.",
      };

      callback(response);
    }
  );

  socket.on(
    "updateRemoteClientIceCandidates",
    (
      {
        remoteSocketId,
        requestId,
        answerOffer,
        localIceCandidates,
        callId,
        socketId,
      },
      callback
    ) => {
      //we need to update call with client
      let updatedCandidate = localStorageManager.addIceCandidatesIntoCandidate(
        callId,
        socketId,
        localIceCandidates
      );

      io.to(remoteSocketId).emit("listenCandidateICECandidates", {
        requestId,
        payload: {
          candidateName: updatedCandidate.candidateName,
          answerOffer,
          localIceCandidates,
        },
      });

      //Now emit an event for all other candidates of given call Id : ;

      const response = {
        success: true,
        updatedCandidate,
        message: "Request for updating remote client ice candidates.",
      };

      callback(response);
    }
  );

  socket.on(
    "confirmConnectionWithHost",
    ({ remoteClientSocket, status, callId, requestId, socketId }, callback) => {
      console.log("isConnected status : ", status);
      let updatedCandidate =
        localStorageManager.updateIsConnectedFlagForCandidate(
          callId,
          remoteClientSocket,
          status
        );
      console.log("updatedCandidate :", updatedCandidate);
      //sending confirmation to candidate that host is connected
      io.to(remoteClientSocket).emit("listenConnectionConfirmationWithHost", {
        requestId,
        status,
      });

      /**
       *The connected candidates will create an offer and a new peer connection and emit an event called sendOfferToNewParticipant.
        In sendOfferToNewParticipant, the offer will be sent to the targeted new participant, who will create a new peer connection and set up the offer as remote description.
        The targeted new participant will send the answer to the one who initiated the sendOfferToNewParticipant event, along with ICE candidates, and emit addNewParticipant event.
        On addNewParticipant event, a list of participants will be updated, and the targeted new participant will be notified with the answer and ICE candidates.
        The last event called confirmConnectionWithParticipant will be emitted to confirm the connection with the participant. This event will emit listenConnectionConfirmationWithParticipant.
       */

      let allConnectedCandidates =
        localStorageManager.getListOfConnectedCandidatesByCallId(callId);
      console.log("allConnectedCandidates", allConnectedCandidates);
      //Get a list of connected candidates.

      let allConnectedCandidatesToNotify = allConnectedCandidates.filter(
        (candidate) => {
          return candidate.candidateSocketId != remoteClientSocket;
        }
      );

      console.log(
        "allConnectedCandidatesToNotify",
        allConnectedCandidatesToNotify
      );

      //Send a command to initiate video conferencing with the remote client's socket ID by emitting listenNewParticipantToAdd event.
      //notifying all connected clients
      allConnectedCandidatesToNotify.forEach((connectedCandidate) => {
        let requestId = generateRandomRequestID();
        io.to(connectedCandidate.candidateSocketId).emit(
          "listenNewParticipantToAdd",
          {
            remoteClientSocket,
            requestId,
            candidateName: connectedCandidate.candidateName,
          }
        );
      });

      const response = {
        success: true,
        updatedCandidate,
        message: "Request for confirmConnectionWithHost.",
      };

      callback(response);
    }
  );

  socket.on(
    "sendAutoAcceptOffer",
    (
      {
        requestId,
        hostIceCandidates,
        offer,
        remoteClientSocketId,
        callId,
        hostName,
        socketId,
      },
      callback
    ) => {
      //we need to update call with client
      console.log(
        "sendAutoAcceptOffer-remoteClientSocketId",
        remoteClientSocketId
      );
      //get name of host
      let newGroupRequest = localStorageManager.addNewGroupRequest(
        requestId,
        hostIceCandidates,
        offer,
        socketId,
        remoteClientSocketId,
        callId,
        hostName
      );

      io.to(remoteClientSocketId).emit("getAutoAcceptedOffer", {
        request: newGroupRequest,
      });

      //Now emit an event for all other candidates of given call Id : ;
      console.log("newGroupRequest", newGroupRequest);
      const response = {
        success: true,
        request: newGroupRequest,
        message: "Request for sendAutoAcceptOffer recieved successfully",
      };

      callback(response);
    }
  );

  socket.on(
    "updateAutoRemoteClientIceCandidates",
    (
      {
        remoteSocketId,
        requestId,
        answerOffer,
        localIceCandidates,
        callId,
        socketId,
        candidateName
      },
      callback
    ) => {
      //we need to update call with client
      let updatedGroupRequest =
        localStorageManager.updateGroupRequestByAddingCandidateICECandidates(
          requestId,
          localIceCandidates,
          candidateName
        );
      console.log("updatedGroupRequest-auto",updatedGroupRequest);    
      io.to(remoteSocketId).emit("listenAutoCandidateICECandidates", {
        requestId,
        payload: {
          candidateName: updatedGroupRequest.candidateName,
          answerOffer,
          localIceCandidates,
        },
      });

      //Now emit an event for all other candidates of given call Id : ;

      const response = {
        success: true,
        updatedGroupRequest,
        message: "Request for updating auto remote client ice candidates.",
      };

      callback(response);
    }
  );

  socket.on(
    "confirmAutoConnectionWithHost",
    ({ remoteClientSocket, status, callId, requestId, socketId }, callback) => {
      console.log("isConnected status : ", status);
      let updatedRequest =
        localStorageManager.updateConnectionStatusForGroupRequest(
          requestId,
          status
        );

      console.log("updatedRequest :", updatedRequest);
      //sending confirmation to candidate that host is connected
      io.to(remoteClientSocket).emit("listenAutoConnectionConfirmationWithHost", {
        requestId,
        status,
      });

      const response = {
        success: true,
        updatedRequest,
        message: "Request for auto confirmConnectionWithHost.",
      };

      callback(response);
    }
  );
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
