var FlexOffer = artifacts.require("FlexOffer");
// var FlexPoint = artifacts.require("FlexPoint");
// var FlexWise = artifacts.require("FlexWise");

module.exports = function(deployer){
    deployer.deploy(FlexOffer);
    // deployer.deploy(FlexPoint);
    // deployer.deploy(FlexWise);
};