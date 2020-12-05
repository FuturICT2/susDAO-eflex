import React, { useContext, useMemo, useReducer, createContext } from 'react';
const initialState = {
    selectedOfferId: "",
    selectedOffer: "",
    selectedOfferBids: [],
    buyAmount: 0
}

function reducer(state,action){
  let reducers = {
      update: (update) => {
            return { ...state, ...update };
        }
  }
  let reducer = reducers[action.type] || (() => { console.error("unknown action type '" + String(action.type) + "'"); return state });
  return reducer(action.payload);
}

let BuyViewContext = createContext(null);


export { BuyViewContext, reducer, initialState}