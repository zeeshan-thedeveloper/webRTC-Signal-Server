
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
      callType,
      hostId,
      hostSocketId,
      hostName,
      callDetails: {
        callTitle,
        callDescription,
      },
      callCandidates: [],
      hostICECandidates: [],
    };

    calls.set(callId, call);

    return call;
  };

  const addCandidateToCall = (
    callId,
    candidateName,
    candidateSocketId,
    isConnected
  ) => {
    let call = calls.get(callId);
    let candidate = {
      candidateName,
      candidateSocketId,
      isConnected,
      iceCandidates: [],
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
    let call = calls.get(callId);
    call.callCandidates.map((candidate) => {
      if (candidate.candidateSocketId === candidateSocketId) {
        candidate.iceCandidates = iceCandidates;
        return candidate;
      } else {
        return candidate;
      }
    });

    calls.set(callId, call);

    return call;
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
  const addJoinRequest=(callId,requestId,requesterSocketId,requestStatus)=>{
    let joinRequest={
      requestId,requesterSocketId,requestStatus
    }
    let allJoinRequestsOfGivenCallId = joinRequests.get(callId);
    allJoinRequestsOfGivenCallId.push(joinRequest);

    joinRequests.set(callId,allJoinRequestsOfGivenCallId);
    return allJoinRequestsOfGivenCallId;
  }

  const updateJoinRequestStatus=(callId,requestId,requesterSocketId,requestStatus)=>{
    let allJoinRequestsOfGivenCallId = joinRequests.get(callId);
    allJoinRequestsOfGivenCallId.map((request)=>{
      if(request.requestId===requestId){
        request.requestStatus=requestStatus
        return request;
      }
      return request;
    })
    joinRequests.set(callId,allJoinRequestsOfGivenCallId);
    return allJoinRequestsOfGivenCallId;
  }
  
  return {
    addNewCall,
    addCandidateToCall,
    addHostICECandidatesIntoCall,
    addIceCandidatesIntoCandidate,
    updateIsConnectedFlagForCandidate,
    addJoinRequest,
    updateJoinRequestStatus
  };
};

module.exports = { storageManager };
