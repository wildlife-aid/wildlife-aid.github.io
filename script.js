const amountButtons = document.querySelectorAll(".amounts button");
const customAmount = document.querySelector(".custom-amount input");
const donateButton = document.querySelector(".donate-button");
const dialog = document.querySelector(".support-dialog");
const dialogCopy = document.querySelector(".dialog-copy");
const closeDialog = document.querySelector(".close-dialog");
const copyAddress = document.querySelector(".copy-address");
const walletAddress = "0x2ea4e0e9151d20efbb789fa246e2909c5000c8d4";

let selectedAmount = "0.05";

amountButtons.forEach((button) => {
  button.addEventListener("click", () => {
    amountButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    selectedAmount = button.dataset.amount;
    customAmount.value = "";
  });
});

customAmount.addEventListener("input", () => {
  amountButtons.forEach((item) => item.classList.remove("active"));
  selectedAmount = customAmount.value || "自定义";
});

donateButton.addEventListener("click", () => {
  const amount = customAmount.value || selectedAmount;
  dialogCopy.textContent = `你选择支持 ${amount} ETH。请扫描地址二维码，在钱包中选择 ERC20（Ethereum Mainnet），并手动填写金额。`;
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    alert(dialogCopy.textContent);
  }
});

closeDialog.addEventListener("click", () => dialog.close());

copyAddress.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(walletAddress);
    copyAddress.textContent = "已复制";
    setTimeout(() => {
      copyAddress.textContent = "复制地址";
    }, 1600);
  } catch {
    copyAddress.textContent = "请长按地址复制";
  }
});
