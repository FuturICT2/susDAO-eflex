import { createContext, useEffect, useContext } from 'react';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import FlexOfferABI from '../../artifacts/FlexOffer.json';
import FlexPointABI from '../../artifacts/FlexPoint.json';

import { showError, fail } from '../error/Error';

const initialState = {
    user: undefined,
    web3: '',
    allFlexOffers: {},
    allFlexOfferBids: {}, // {flexOfferId: [flexOfferBid1, ...]}
    account: '',
    chainId: '',
    netId: 0,
    networkName: null,
    contract: '',
    fpcontract: '',
    connected: false,
    isLoaded: false,
    totalOffers: -1,
    totalPoints: -1,
    currentBlockNumber: 0,
    lastUpdateTimestamp: 0,
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
        updateWeb3:(web3)=>{
          return {...state, web3:web3}
        },
        setChainId: (chainId) => {
            let networkNames = {
                "0x1": "mainnet",
                "0x3": "ropsten",
                "0x4": "Rinkeby",
                "0x5": "Goerli",
                "0x2a": "Kovan"
            }
            let networkName = networkNames[chainId] || "custom";
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

        addFlexOfferBid: ({flexOfferId, bid}) => {
            let bid_completed = {
                author: null,
                amount: -1,
                ...bid
            };

            let bidsSoFar = state.allFlexOfferBids[flexOfferId] ?? [];
            // Make sure not to add duplicate bids
            let bidlist_completed = [...state.allFlexOfferBids[flexOfferId] ?? [], bid_completed]
            return {
                ...state,
                allFlexOfferBids: {
                    ...state.allFlexOfferBids,
                    [[flexOfferId]]: bidlist_completed
                }
            }


        },
        removeFlexOffer: (flexOfferId) => {
            let flexOffersCopy = state.allFlexOffers;
            delete flexOffersCopy[flexOfferId];
            return {...state, allFlexOffers: flexOffersCopy};
        },

        setContract:  (contract)=>{
          return { ...state, contract: contract }
        },
        setFpContract:  (contract)=>{
          return { ...state, fpcontract: contract }
        }
    }
    console.log("Web3State || Action emitted: ", action.type);
    let reducer = reducers[action.type] || (() => { console.error("unknown action type '" + String(action.type) + "'"); return state });
    return reducer(action.payload);
}

function Web3Manager() {
    const [web3State, dispatch] = useContext(Web3Context);
    const initProvider = async (provider, web3) => {
        let chainId = provider.chainId;
        let accountAddress = (await provider.request({ method: 'eth_requestAccounts' }))[0];
        let netId = await provider.request({ method: 'net_version' });
        // Setup contract
        let contractDeploymentInfo = FlexOfferABI.networks[netId];
        // Check if contract was deployed
        let raiseContractNotDeployed = () =>{
            fail("Unable to connect to contract.", "Contract deployed?");
        } 
        let flexOffer = undefined;

        // Check if config file exists
        if(contractDeploymentInfo){
            flexOffer = new web3.eth.Contract(FlexOfferABI.abi, contractDeploymentInfo.address);
        } else {
            raiseContractNotDeployed();
        }

        // Make example  call to check if config file is up-to-date:
        await flexOffer.methods.FP().call((error, res) => {
            if(error){
                raiseContractNotDeployed();
            }
        });
        console.log("Addr: ", contractDeploymentInfo.address, "Other", await flexOffer.methods.FP().call());
        // Set initial data
        dispatch('update', {
            netId: netId,
            user: {
                address: accountAddress
            },
            connected: provider.isConnected()
        });

        let getFlexOfferData = async (flexOfferId) => {
            return flexOffer.methods.flex_offers_mapping(flexOfferId).call();
        }

        // Set conract and callbacks
        dispatch('setContract',flexOffer);
        let contractEventCallbacks = {
            flexOfferMinted: async (res) => {
                let flexOfferId = res.returnValues[0];
                let flexOfferData = await getFlexOfferData(flexOfferId);
                dispatch('addFlexOffer', {flexOfferId: flexOfferId, flexOffer: flexOfferData});
            },

            flexOfferBidSuccess: async (res) => {
                let {flexOfferId, new_owner, bid_amount} = res.returnValues;
                dispatch("addFlexOfferBid", {flexOfferId: flexOfferId, bid: {author: new_owner, amount: bid_amount}});
            },


        }

        let flexPoints = new web3.eth.Contract(FlexPointABI.abi, (await flexOffer.methods.FP().call()));
        console.log(flexPoints.options.address);

        // Update state from time to time
        let lastBlockNumber = await web3.eth.getBlockNumber() - 100;


        let updateLoop = async () => {
            // Sleep function taken from SO
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            while(true){
                // Update current block Number (+ 1 bc getPastEvents is inclusive)
                let currentBlockNumber = await web3.eth.getBlockNumber() + 1;
                // Fetch all events since last update
                let newEvents = lastBlockNumber == currentBlockNumber ? [] : await flexOffer.getPastEvents("allEvents", {fromBlock: lastBlockNumber});
                // Update block number
                lastBlockNumber = currentBlockNumber
                // Dispatch all event callbacks
                let futures = newEvents.map(event => {
                    console.log("Dispatching event call back for event: ", event.event);
                    let callback = contractEventCallbacks[event.event] ?? (async () => {});
                    return callback(event);
                });

                // Update all statistic fields
                dispatch("update", {
                    isLoaded: true,
                    totalOffers: (await flexOffer.methods.totalSupply().call()),
                    totalPoints: (await flexPoints.methods.totalSupply().call()),
                    totalEth: (await web3.eth.getBalance(flexOffer.options.address)),
                    currentBlockNumber: currentBlockNumber,
                    lastUpdateTimestamp: Math.floor(Date.now() / 1000)
                });

                // Await all event callbacks
                await Promise.all(futures);

                await sleep(1000);
            }
        };

        // Start update Loop
        updateLoop();

        dispatch('setChainId', chainId);
        // (state, action) => state
        dispatch('updateWeb3',web3);
        if(accountAddress && flexOffer){
          flexOffer.methods.FP().call().then((fpAddress)=>{
            let fpContract = new web3.eth.Contract(FlexPointABI.abi, fpAddress);
            dispatch('setFpContract',fpContract);
          });
        }
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
    }

    const detectProvider = async () => {
        const provider = await detectEthereumProvider({silent: true});            
        const web3 = new Web3(provider);
        if (!provider) {
            showError("Can't detect ethereum provider.", "Wallet enabled?");
            console.error('Error: Cannot detect ethereum provider');
        } else if (!window.ethereum) {
            console.error('Error: Cannot detect ethereum provider');
        } else if (provider !== window.ethereum) {
            console.error('Error: Do you have multiple wallets installed?');
        } else {
            initProvider(provider, web3);
        }
    }


    useEffect(() => {detectProvider()}, []);

    return (<></>);
}

const Web3Context = createContext([initialState, (...args) => { }]);

export { Web3Context, Web3Manager, initialState, reducer };
