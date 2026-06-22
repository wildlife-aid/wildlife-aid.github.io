const amountButtons = document.querySelectorAll(".amounts button");
const customAmount = document.querySelector(".custom-amount input");
const donateButton = document.querySelector(".donate-button");
const dialog = document.querySelector(".support-dialog");
const dialogCopy = document.querySelector(".dialog-copy");
const closeDialog = document.querySelector(".close-dialog");
const copyAddress = document.querySelector(".copy-address");
const walletAddress = "0x2ea4e0e9151d20efbb789fa246e2909c5000c8d4";
const donationTotal = document.querySelector("#donation-total");
const donationProgress = document.querySelector("#donation-progress");
const monitorStatus = document.querySelector("#monitor-status");

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

async function refreshDonationProgress() {
  try {
    const response = await fetch(`./data/donations.json?t=${Date.now()}`);
    if (!response.ok) {
      throw new Error("Unable to load donation data");
    }

    const data = await response.json();
    const usd = Number(data.estimatedUsd).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const progress = Math.min(100, Number(data.progressPercent) || 0);

    donationTotal.textContent = `已公开记录 ${data.totalEth} ETH（约 $${usd}）· ${data.transactionCount} 笔`;
    donationProgress.querySelector("span").style.width = `${progress}%`;
    donationProgress.setAttribute("aria-label", `已完成目标的 ${progress}%`);

    if (data.lastCheckedAt) {
      const checkedAt = new Date(data.lastCheckedAt).toLocaleString("zh-CN");
      monitorStatus.textContent = `链上数据最近检查：${checkedAt}`;
    } else {
      monitorStatus.textContent = "链上监测已启用，等待首次检查";
    }
  } catch {
    monitorStatus.textContent = "暂时无法读取链上数据，请稍后刷新";
  }
}

refreshDonationProgress();
