const storageManager = () => {
    
  const offerCache = new Map();
  const joinOfferCache = new Map();
  const joinRequestCache = new Map();
  // Store an offer in the cache for a given call ID and socket ID
  const storeOffer = (callId, socketId, offer) => {
    offerCache.set(callId, { socketId, offer });
    console.log(`Stored offer for call ${callId} in cache.`);
  };

  // Retrieve an offer from the cache for a given call ID
  const getOffer = (callId) => {
    const offer = offerCache.get(callId);
    if (!offer) {
      console.log(`No offer found for call ${callId} in cache.`);
      return null;
    }
    console.log(`Retrieved offer for call ${callId} from cache.`);
    return offer;
  };

  // Retrieve the socket ID associated with a call ID from the cache
  const getCallCreatorSocketId = (callId) => {

    const socketId = offerCache.get(callId);
    if (!socketId) {
      console.log(`No socket ID found for call ${callId} in cache.`);
      return null;
    }
    console.log(
      `Retrieved socket ID ${socketId.socketId} for call ${callId} from cache.`
    );
    return socketId.socketId;
  };

  // Store a join offer in the cache for a given call ID and socket ID
  const storeJoinOffer = (callId, socketId, joinOffer) => {
    joinOfferCache.set(socketId, { callId, joinOffer });
    console.log(`Stored join offer for call ${callId} in cache.`);
  };
  
  const storeJoinRequest = (callId, socketId, userName) => {
    joinRequestCache.set(socketId, { callId, userName });
    console.log(`Stored join request for call ${callId} in cache.`);
  };
  const getJoinRequest = (socketId) => {
    const joinRequest = joinRequestCache.get(socketId);
    if (!joinRequest) {
      console.log(`No join request found for socket ${socketId} in cache.`);
      return null;
    }

    console.log(`Retrieved join request for socket ${socketId} from cache.`);
    return joinRequest;
  };
  // Retrieve a join offer from the cache for a given socket ID
  const getJoinOffer = (socketId) => {
    const joinOfferData = joinOfferCache.get(socketId);
    if (!joinOfferData) {
      console.log(`No join offer found for socket ${socketId} in cache.`);
      return null;
    }
    console.log(`Retrieved join offer for call ${joinOfferData.callId} from cache.`);
    return joinOfferData.joinOffer;
  };

  return { storeOffer, getOffer, getCallCreatorSocketId,storeJoinOffer,getJoinOffer,storeJoinRequest,getJoinRequest };
};

module.exports = { storageManager };
