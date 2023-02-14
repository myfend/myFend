import CeloLenderBlockchain from "./adapters/celoLenderBlockchain";

new CeloLenderBlockchain().createWalletFor("32342424").catch((e) => {
  console.log(e.message);
});
