
const storageManager = () => {

  const calls = new Map();
  const joinRequests = new Map();

  // Calls related operation
  const addNewCall = (
    callId,
    callType,
    hostName,
    hostId,
    hostSocketId,
    callTitle,
    callDescription
  ) => {
    let call = {
      callId,
      callType,
      hostId,
      hostSocketId,
      hostName,
      callDetails: {
        callTitle,
        callDescription,
      },
      callCandidates: [],
    };

    calls.set(callId, call);

    return call;
  };

  const addCandidateToCall = (
    callId,
    candidateName,
    candidateSocketId,
    hostIceCandidates,
    hostOffer
  ) => {
    let call = calls.get(callId);
    let candidate = {
      candidateName,
      candidateSocketId,
      candidateIceCandidates: [],
      hostIceCandidates,
      hostOffer
    };
    call.callCandidates.push(candidate);
    calls.set(callId, call);
    return call;
  };

  const addHostICECandidatesIntoCall = (callId, hostICECandidates) => {
    let call = calls.get(callId);
    call.hostICECandidates = hostICECandidates;
    calls.set(callId, call);
    return call;
  };

  const addIceCandidatesIntoCandidate = (
    callId,
    candidateSocketId,
    iceCandidates
  ) => {
    let updatedCandidate = null;
    let call = calls.get(callId);
    call.callCandidates.map((candidate) => {
      if (candidate.candidateSocketId === candidateSocketId) {
        candidate.candidateIceCandidates = iceCandidates;
        updatedCandidate = candidate;
        return candidate;
      } else {
        return candidate;
      }
    });

    calls.set(callId, call);

    return updatedCandidate;
  };

  const updateIsConnectedFlagForCandidate=(callId,candidateSocketId,isConnected)=>{
    let call = calls.get(callId);
    call.callCandidates.map((candidate) => {
      if (candidate.candidateSocketId === candidateSocketId) {
        candidate.isConnected = isConnected;
        return candidate;
      } else {
        return candidate;
      }
    });

    calls.set(callId, call);

    return call;
  }

  // join requests
  const addJoinRequest=(callId,requestId,requesterSocketId,requestStatus,requesterName)=>{
    let joinRequest={
      callId,requesterSocketId,requestStatus,requesterName
    }
    
    joinRequests.set(requestId,joinRequest);
    return joinRequest;
  }

  const updateJoinRequestStatus=(requestId,requestStatus)=>{
    let joinRequest = joinRequests.get(requestId);
    joinRequest.requestStatus=requestStatus
    return joinRequest;
  }

  const getCallByCallId=(callId)=>{
    return calls.get(callId)
  }

  const getSocketIdOfCallHostByCallId=(callId)=>{
    return calls.get(callId).hostSocketId
  }
  const getRequestByRequestId=(requestId)=>{
    return joinRequests.get(requestId)
  }
  
  return {
    addNewCall,
    addCandidateToCall,
    addHostICECandidatesIntoCall,
    addIceCandidatesIntoCandidate,
    updateIsConnectedFlagForCandidate,
    addJoinRequest,
    updateJoinRequestStatus,
    getCallByCallId,
    getRequestByRequestId,
    getSocketIdOfCallHostByCallId
  };
};

module.exports = { storageManager };
