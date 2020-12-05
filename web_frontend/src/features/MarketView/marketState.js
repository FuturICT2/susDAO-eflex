import { createContext, useEffect, useContext } from 'react';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import FlexOffer from '../../artifacts/FlexOffer.json';
import FlexPoint from '../../artifacts/FlexPoint.json';

const initialState = {
    offersShown: 18,
    bidsPerOfferShown: 12
};

function reducer(state, action) {
    let reducers = {
        update: (update) => {
            return { ...state, ...update };
        }
    }
    console.log("Market State || Action emitted: ", action.type);
    let reducer = reducers[action.type] || (() => { console.error("unknown action type '" + String(action.type) + "'"); return state });
    return reducer(action.payload);
}

const MarketContext = createContext([initialState, (...args) => { }]);

export { MarketContext, initialState, reducer};
