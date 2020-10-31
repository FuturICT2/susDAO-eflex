var flex_offer = artifacts.require("Flex_Offer");
// var flex_offer_holder = artifacts.require("Flex_Offers_Holder");

module.exports = function(deployer){
    deployer.deploy(flex_offer);
    // deployer.deploy(flex_offer_holder);
};