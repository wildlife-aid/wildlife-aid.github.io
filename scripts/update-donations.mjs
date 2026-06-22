import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const address = "0x2ea4e0e9151d20efbb789fa246e2909c5000c8d4";
const campaignStartedAt = "2026-06-22T14:15:31Z";
const goalUsd = 100000;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "data", "donations.json");

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "ai-wildlife-aid-monitor/1.0" },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${url}`);
  }

  return response.json();
}

async function fetchIncomingTransactions() {
  const transactions = [];
  let nextPageParams = null;

  for (let page = 0; page < 100; page += 1) {
    const url = new URL(
      `https://eth.blockscout.com/api/v2/addresses/${address}/transactions`,
    );
    url.searchParams.set("filter", "to");

    if (nextPageParams) {
      Object.entries(nextPageParams).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
    }

    const payload = await fetchJson(url);
    const items = Array.isArray(payload.items) ? payload.items : [];
    transactions.push(...items);

    const reachedCampaignStart = items.some(
      (item) => new Date(item.timestamp) < new Date(campaignStartedAt),
    );

    if (reachedCampaignStart || !payload.next_page_params) {
      break;
    }

    nextPageParams = payload.next_page_params;
  }

  return transactions.filter((transaction) => {
    const recipient = transaction.to?.hash?.toLowerCase();
    return (
      transaction.status === "ok" &&
      recipient === address.toLowerCase() &&
      new Date(transaction.timestamp) >= new Date(campaignStartedAt) &&
      BigInt(transaction.value || "0") > 0n
    );
  });
}

const transactions = await fetchIncomingTransactions();
const totalWei = transactions.reduce(
  (sum, transaction) => sum + BigInt(transaction.value),
  0n,
);
const totalEthNumber = Number(totalWei) / 1e18;

let ethUsdRate = null;
try {
  const price = await fetchJson(
    "https://api.coinbase.com/v2/prices/ETH-USD/spot",
  );
  ethUsdRate = Number(price.data?.amount);
} catch (error) {
  console.warn(`Price lookup failed: ${error.message}`);
}

const estimatedUsd = ethUsdRate ? totalEthNumber * ethUsdRate : 0;
const progressPercent = Math.min(
  100,
  Number(((estimatedUsd / goalUsd) * 100).toFixed(4)),
);
const latestTransaction = transactions
  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  .at(0);

const output = {
  walletAddress: address,
  network: "Ethereum Mainnet",
  campaignStartedAt,
  lastCheckedAt: new Date().toISOString(),
  transactionCount: transactions.length,
  totalWei: totalWei.toString(),
  totalEth: totalEthNumber.toFixed(6),
  ethUsdRate,
  estimatedUsd: estimatedUsd.toFixed(2),
  goalUsd,
  progressPercent,
  latestTransaction: latestTransaction
    ? {
        hash: latestTransaction.hash,
        timestamp: latestTransaction.timestamp,
        valueEth: (Number(BigInt(latestTransaction.value)) / 1e18).toFixed(6),
      }
    : null,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
