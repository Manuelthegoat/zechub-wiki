"use client";
import Button from "@/components/Button/Button";
import HalvingMeter from "@/components/HalvingMeter";
import Tools from "@/components/tools";
import useExportDashboardAsPNG from "@/hooks/useExportDashboardAsPNG";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ShieldedPoolChart = dynamic(
  () => import("../../components/ShieldedPoolChart"),
  { ssr: true } // Enable SSR
);

const defaultUrl =
  "https://raw.githubusercontent.com/ZecHub/zechub-wiki/main/public/data/shielded_supply.json";
const sproutUrl =
  "https://raw.githubusercontent.com/ZecHub/zechub-wiki/main/public/data/sprout_supply.json";
const saplingUrl =
  "https://raw.githubusercontent.com/ZecHub/zechub-wiki/main/public/data/sapling_supply.json";
const orchardUrl =
  "https://raw.githubusercontent.com/ZecHub/zechub-wiki/main/public/data/orchard_supply.json";
const hashrateUrl =
  "https://raw.githubusercontent.com/ZecHub/zechub-wiki/main/public/data/hashrate.json";
const shieldedTxCountUrl =
  "https://raw.githubusercontent.com/ZecHub/zechub-wiki/main/public/data/shieldedtxcount.json";

const apiUrl =
  "https://api.github.com/repos/ZecHub/zechub-wiki/commits?path=public/data/shielded_supply.json";
const blockchainInfoUrl =
  "https://mainnet.zcashexplorer.app/api/v1/blockchain-info";

interface BlockchainInfo {
  blocks: number;
  transactions: number;
  outputs: number;
  circulation: number | null;
  blocks_24h: number;
  transactions_24h: number;
  difficulty: number;
  volume_24h: number;
  mempool_transactions: number;
  average_transaction_fee_24h: number;
  largest_transaction_24h: {
    hash: string;
    value_usd: number;
  };
  nodes: number;
  hashrate_24h: string;
  inflation_usd_24h: number;
  average_transaction_fee_usd_24h: number;
  market_price_usd: number;
  market_price_btc: number;
  market_price_usd_change_24h_percentage: number;
  market_cap_usd: number;
  market_dominance_percentage: number;
  next_retarget_time_estimate: string;
  next_difficulty_estimate: number;
  countdowns: any[];
  hodling_addresses: number;
}

interface SupplyData {
  timestamp: string;
  supply: number;
}

interface ShieldedTxCount {
  sapling_outputs: number;
  orchard_outputs: number;
  end_time: string;
}

async function getBlockchainData() {
  try {
    const response = await fetch(
      "https://api.blockchair.com/zcash/stats?key=A___8A4ebOe3KJT9bqiiOHWnJbCLpDUZ"
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data.data as BlockchainInfo;
  } catch (error) {
    console.error("Failed to fetch blockchain data:", error);
    return null;
  }
}

async function getBlockchainInfo() {
  try {
    const response = await fetch(blockchainInfoUrl);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data.chainSupply.chainValue;
  } catch (error) {
    console.error("Failed to fetch blockchain info:", error);
    return null;
  }
}

async function getSupplyData(url: string): Promise<SupplyData[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data as SupplyData[];
  } catch (error) {
    console.error(`Failed to fetch supply data from ${url}:`, error);
    return [];
  }
}

async function getLastUpdatedDate(): Promise<string | null> {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data[0].commit.committer.date;
  } catch (error) {
    console.error("Failed to fetch last updated date:", error);
    return null;
  }
}

async function getShieldedTxCount(): Promise<ShieldedTxCount | null> {
  try {
    const response = await fetch(shieldedTxCountUrl);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data as ShieldedTxCount;
  } catch (error) {
    console.error("Failed to fetch shielded transaction count:", error);
    return null;
  }
}

const ShieldedPoolDashboard = () => {
  const [selectedPool, setSelectedPool] = useState("default");
  const [blockchainInfo, setBlockchainInfo] = useState<BlockchainInfo | null>(
    null
  );
  const [circulation, setCirculation] = useState<number | null>(null);
  const [sproutSupply, setSproutSupply] = useState<SupplyData | null>(null);
  const [saplingSupply, setSaplingSupply] = useState<SupplyData | null>(null);
  const [orchardSupply, setOrchardSupply] = useState<SupplyData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [shieldedTxCount, setShieldedTxCount] =
    useState<ShieldedTxCount | null>(null);

  const { divChartRef, handleSaveToPng } = useExportDashboardAsPNG();

  useEffect(() => {
    getBlockchainData().then((data) => {
      if (data) {
        data.nodes = 125; // Manually set the node count to 125
        setBlockchainInfo(data);
      }
    });
    getBlockchainInfo().then((data) => setCirculation(data));

    getLastUpdatedDate().then((date) =>
      date ? setLastUpdated(date.split("T")[0]) : null
    );

    getSupplyData(sproutUrl).then((data) =>
      setSproutSupply(data[data.length - 1])
    );

    getSupplyData(saplingUrl).then((data) =>
      setSaplingSupply(data[data.length - 1])
    );

    getSupplyData(orchardUrl).then((data) =>
      setOrchardSupply(data[data.length - 1])
    );

    getShieldedTxCount().then((data) => setShieldedTxCount(data));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getSupplyData(getDataUrl());
      if (data.length > 0) {
        setLastUpdated(data[data.length - 1].timestamp?.split("T")[0]);
      }
    };
    fetchData();
  }, [selectedPool]);

  const getDataUrl = () => {
    switch (selectedPool) {
      case "sprout":
        return sproutUrl;
      case "sapling":
        return saplingUrl;
      case "orchard":
        return orchardUrl;
      case "hashrate":
        return hashrateUrl;
      case "default":
      default:
        return defaultUrl;
    }
  };

  const getDataColor = () => {
    switch (selectedPool) {
      case "sprout":
        return "#A020F0";
      case "sapling":
        return "#FFA500";
      case "orchard":
        return "#32CD32";
      case "url(#area-background-gradient)":
      default:
        return "url(#area-background-gradient)";
    }
  };

  const getTotalShieldedSupply = () => {
    const totalSupply =
      (sproutSupply?.supply ?? 0) +
      (saplingSupply?.supply ?? 0) +
      (orchardSupply?.supply ?? 0);
    return totalSupply;
  };

  if (!blockchainInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="font-bold mt-8 mb-4">Shielded Supply Chart (ZEC)</h2>
      <div className="border p-3 rounded-lg">
        <Tools />
        <div className="relative">
          <div ref={divChartRef}>
            <ShieldedPoolChart dataUrl={getDataUrl()} color={getDataColor()} />
          </div>
        </div>
        <div className="flex justify-end gap-12 text-right mt-4 text-sm text-gray-500">
          <span className="px-3 py-2">
            Last updated:{" "}
            {lastUpdated
              ? new Date(lastUpdated).toLocaleDateString()
              : "Loading..."}
          </span>
          <Button
            text="Export (PNG)"
            className="px-3 py-2 border text-white border-slate-300 rounded-md shadow-sm bg-[#1984c7]"
            onClick={() =>
              handleSaveToPng(selectedPool, {
                sproutSupply,
                saplingSupply,
                orchardSupply,
              })
            }
          />
        </div>
      </div>
      <h2 className="font-bold mt-8 mb-4">Shielded ZEC Supply</h2>
      <div className="flex flex-col space-y-4 text-sm">
        <p>
          The total ZEC supply in Sprout, Sapling, and Orchard shielded pools
          combined is{" "}
          <span className="font-semibold">{getTotalShieldedSupply()}</span> ZEC.
        </p>
        <p>
          The circulating supply of ZEC is{" "}
          <span className="font-semibold">{circulation ?? "Loading..."}</span>{" "}
          ZEC.
        </p>
      </div>
      <h2 className="font-bold mt-8 mb-4">ZEC Metrics</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="border p-4 rounded-lg">
          <h3 className="font-bold">Market Price (USD)</h3>
          <p className="text-sm">
            ${blockchainInfo?.market_price_usd.toFixed(2) ?? "Loading..."}
          </p>
        </div>
        <div className="border p-4 rounded-lg">
          <h3 className="font-bold">Market Cap (USD)</h3>
          <p className="text-sm">
            ${blockchainInfo?.market_cap_usd.toLocaleString() ?? "Loading..."}
          </p>
        </div>
        <div className="border p-4 rounded-lg">
          <h3 className="font-bold">24h Volume (USD)</h3>
          <p className="text-sm">
            ${blockchainInfo?.volume_24h.toLocaleString() ?? "Loading..."}
          </p>
        </div>
        <div className="border p-4 rounded-lg">
          <h3 className="font-bold">Hashrate (24h Avg)</h3>
          <p className="text-sm">
            {blockchainInfo?.hashrate_24h ?? "Loading..."} H/s
          </p>
        </div>
      </div>
      <h2 className="font-bold mt-8 mb-4">Shielded Transactions</h2>
      <div className="flex flex-col space-y-4 text-sm">
        <p>
          Sapling outputs:{" "}
          <span className="font-semibold">
            {shieldedTxCount?.sapling_outputs ?? "Loading..."}
          </span>
        </p>
        <p>
          Orchard outputs:{" "}
          <span className="font-semibold">
            {shieldedTxCount?.orchard_outputs ?? "Loading..."}
          </span>
        </p>
      </div>
      <h2 className="font-bold mt-8 mb-4">Halving Progress</h2>
      <HalvingMeter blockchainInfo={blockchainInfo} />
    </div>
  );
};

export default ShieldedPoolDashboard;
