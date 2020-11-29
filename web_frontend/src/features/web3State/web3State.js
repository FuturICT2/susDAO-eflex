import { createContext, useEffect, useContext } from 'react';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import FlexOffer from '../../artifacts/FlexOffer.json';

const initialState = {
    user: undefined,
    allFlexOffers: {},
    account: '',
    chainId: '',
    netId: 0,
    networkName: null,
    contract: '',
    connected: false
};

function reducer(state, action) {
    let reducers = {
        update: (update) => {
            return { ...state, ...update };
        },

        updateUser: (update) => {
            /* Updates only the "user" field */
            return {...state, user: {...state.user, ...update}};
        },
        setChainId: (chainId) => {
            let networkNames = {
                "0x1": "mainnet",
                "0x3": "ropsten",
                "0x4": "Rinkeby",
                "0x5": "Goerli",
                "0x2a": "Kovan"
            }
            let networkName = networkNames[chainId] || "unknown";
            return { ...state, chainId: chainId, networkName: networkName }
        },

        addFlexOffer: ({ flexOfferId, flexOffer }) => {
            let flexOfferCompleted = {
                og_owner: "owner_undefined",
                power: 0,
                duration: 0,
                start_time: 0,
                end_time: 0,
                curr_bid: 0,
                ...flexOffer
            }

            return {...state,
                allFlexOffers: {
                    ...state.allFlexOffers,
                    [[flexOfferId]]: flexOfferCompleted
                }}
        },

        removeFlexOffer: (flexOfferId) => {
            let flexOffersCopy = state.allFlexOffers;
            delete flexOffersCopy[flexOfferId];
            return {...state, allFlexOffers: flexOffersCopy};
        },

        setContract:  (contract)=>{
          return { ...state, contract: contract }
        }
    }
    console.log("Action emitted: ", action.type);
    let reducer = reducers[action.type] || (() => { console.error("unknown action type '" + String(action.type) + "'"); return state });
    return reducer(action.payload);
}

function Web3Manager() {
    const [web3State, dispatch] = useContext(Web3Context);
    const initProvider = async (provider, web3) => {
        let chainId = provider.chainId;
        let accountAddress = (await provider.request({ method: 'eth_requestAccounts' }))[0];
        let netId = await provider.request({ method: 'net_version' });
        // Contract stuff
        let contractData = FlexOffer.networks[netId];
        // console.log(netId);
        let flexOffer = new web3.eth.Contract(FlexOffer.abi, contractData.address);


        // Set initial data
        dispatch('update', {
            netId: netId,
            user: {
                address: accountAddress
            },
            connected: provider.isConnected()
        });

        // (state, action) => state

        dispatch('setChainId', chainId);
        dispatch('setContract',flexOffer);
        var eventCallbacks = {
            accountsChanged: (accounts) => {
                dispatch('updateUser', {address: accounts[0]});
            },

            chainChanged: (cId) => {
                dispatch('setChainId', cId);
            },

            disconnect: () => {
                dispatch('update', {
                    user: undefined,
                    chainId: '',
                    networkName: 'disconnected',
                    connected: false
                })
            },

            connect: (info) => {
                dispatch('update', {connected: true});
                dispatch('setChainId', info.chainid);
            },
        }

        for (var evName in eventCallbacks) {
            provider.on(evName, eventCallbacks[evName]);
        }


        // DEBUG
        let addOffer = () => dispatch("addFlexOffer", { flexOfferId: String(Math.random()), flexOffer: {} });
        addOffer();
        // addOffer();
        // setInterval(()=>dispatch("addFlexOffer", {flexOfferId: String(Math.random()), flexOffer: {}}), 3000);
    }

    const detectProvider = async () => {
        const provider = await detectEthereumProvider();
        const web3 = new Web3(provider || 'ws://localhost:7545');
        if (!provider) {
            console.error('Error: Cannot detect ethereum provider');
        } else if (!window.ethereum) {
            console.error('Error: Cannot detect ethereum provider');
        } else if (provider !== window.ethereum) {
            console.error('Error: Do you have multiple wallets installed?');
        } else {
            initProvider(provider, web3);
        }
    }


    useEffect(() => { detectProvider() }, []);

    return (<></>);
}

const Web3Context = createContext([initialState, (...args) => { }]);

export { Web3Context, Web3Manager, initialState, reducer };
