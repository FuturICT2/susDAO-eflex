const Sim = artifacts.require("FlexMngrSim");
fs = require("fs");

module.exports = function (deployer) {
  deployer.deploy(Sim).then(()=>{
    fs.writeFile("../build/deploys/FlexMngrSim.json", {address: Sim.address})
  });
};
