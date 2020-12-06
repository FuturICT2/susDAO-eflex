import React, { useContext, useState , useReducer, useEffect} from 'react';
import { Web3Context } from '../web3State/web3State';
import './washing.css';

const initialState = {
  door: false,
  shirt: false,
  jeans: false,
  hoodie: false,
}
function reducer(state,action){
  let reducers = {
    setDoor: (open)=>{
      return {...state, door: open}
    },
    setShirt: (inChamber)=>{
      return {...state, shirt: inChamber}
    },
    setJeans: (inChamber)=>{
      return {...state, jeans: inChamber}
    },
    setHoodie: (inChamber)=>{
      return {...state, hoodie: inChamber}
    },
  }
  let reducer = reducers[action.type] || (() => { console.error("unknown action type '" + String(action.type) + "'"); return state });
  return reducer(action.payload);
}

function WashMachine() {
  let [web3state, dispatch] = useContext(Web3Context);
  const contract = web3state.contract;
  let loggedin = (web3state.user?.address && contract);

  const [machine,dispatchM] = useReducer(reducer,initialState);
  const setMachine = (type, payload) => {dispatchM({type:type, payload:payload})};
  const door=()=>{
    if (!(web3state.user?.machineOn)){
      setMachine('setDoor',!machine.door);
    }
  }
  const shirt=()=>{
    if(machine.door){
      setMachine('setShirt',!machine.shirt);
    }
  }
  const jeans=()=>{
    if(machine.door){
      setMachine('setJeans',!machine.jeans);
    }
  }
  const hoodie=()=>{
    if(machine.door){
      setMachine('setHoodie',!machine.hoodie);
    }
  }

  const start=()=>{
    if (!machine.door && !(web3state.user?.machineOn) ){
      dispatch('updateUser', {machineOn:true});
      // setMachine('setChamber', true);
    }
  }

  const stop=()=>{
    if ((web3state.user?.machineOn)){
      dispatch('updateUser', {machineOn:false});
      // setMachine('setChamber', false);
    }
  }

  // useEffect(() => {
  //   if(loggedin){
  //     const account = web3state.user.address;
  //     contract.events.flexOfferActivation(
  //       function(error, result){
  //         const offerId = result.returnValues[0];
  //         contract.methods.flex_offers_mapping(offerId).call().then((offerInfo)=>{
  //           console.log(offerInfo);
  //           if(offerInfo[0].toUpperCase()===web3state.user.address.toUpperCase()){
  //             dispatch('updateUser', {machineOn:true});
  //             setTimeout( ()=>{dispatch('updateUser', {machineOn:false})}, offerInfo[2]*1000);
  //             // setMachine('setChamber', true);
  //             // setTimeout(()=>{setMachine('setChamber', false)}, offerInfo[2]*1000);
  //           }
  //         });
  //       }
  //     )
  //   }
  // }, [web3state.user?.address, web3state.contract]);

  if(loggedin){
  return (<div className="wrapper laundromat">
  <div id="machine">
    <div className={machine.door ? "door open" : "door"} onClick = {door}></div>
    <div className={(web3state.user?.machineOn) ? "chamber spin":"chamber"}>
      <div className="water">
        <div className="crescent"></div>
      </div>
      <div className="clothing shirt" style={machine.shirt ? {}: {visibility: "hidden"}} onClick = {shirt}></div>
      <div className="clothing jeans" style={machine.jeans ? {}: {visibility: "hidden"}} onClick = {jeans}></div>
      <div className="clothing hoodie" style={machine.hoodie ? {}: {visibility: "hidden"}} onClick = {hoodie}></div>
    </div>
    <div className="controls">
      <button id="start" onClick={start}>▶</button>
      <button id="stop" onClick={stop}>◼</button>
      <button id="open" onClick={door}>Door</button>
      <section className={(web3state.user?.machineOn) ? "display on":"display"}><span>{(web3state.user?.machineOn) ? "Running":"Off"}</span></section>
    </div>
  </div>
  <div className="clothing shirt" style={machine.shirt ? {visibility: "hidden"}:{}} onClick = {shirt}></div>
  <div className="clothing jeans" style={machine.jeans ? {visibility: "hidden"}:{}} onClick = {jeans}></div>
  <div className="clothing hoodie" style={machine.hoodie ? {visibility: "hidden"}:{}} onClick = {hoodie}></div>
</div>)
}else{
  return <></>
}

}

export { WashMachine };
