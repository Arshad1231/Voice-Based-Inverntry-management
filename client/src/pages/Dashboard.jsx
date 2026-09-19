import { useEffect, useState } from "react";

import {
  getInventory,
  getLowStockItems,
  getTransactions,
  addStock,
  removeStock,
  createInventoryItem,
  processVoiceCommand,
} from "../services/inventoryApi";

import useVoice from "../hooks/useVoice";

import AddItemModal from "../components/inventory/AddItemModal";
import StockModal from "../components/inventory/StockModal";

function Dashboard() {
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Controls the Add / Remove modal
  const [stockModal, setStockModal] = useState(null);
  const [addItemModal, setAddItemModal] = useState(false);

  // ============================================================
  // VOICE
  // ============================================================

  const {
    isListening,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
  } = useVoice();

  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceResult, setVoiceResult] = useState("");

  // ============================================================
  // LOAD DASHBOARD
  // ============================================================

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        inventoryResponse,
        lowStockResponse,
        transactionResponse,
      ] = await Promise.all([
        getInventory(),
        getLowStockItems(),
        getTransactions(),
      ]);

      setInventory(inventoryResponse.data);
      setLowStock(lowStockResponse.data);
      setTransactions(transactionResponse.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data when page opens
  useEffect(() => {
    loadDashboard();
  }, []);

  // ============================================================
  // CREATE INVENTORY ITEM
  // ============================================================

  const handleCreateItem = async (item) => {
    try {
      await createInventoryItem(item);

      setAddItemModal(false);

      await loadDashboard();
    } catch (error) {
      throw error;
    }
  };

  // ============================================================
  // ADD / REMOVE STOCK
  // ============================================================

  const handleStockSubmit = async (quantity) => {
    try {
      if (stockModal.type === "ADD") {
        await addStock(
          stockModal.item._id,
          quantity
        );
      } else {
        await removeStock(
          stockModal.item._id,
          quantity
        );
      }

      // Close modal
      setStockModal(null);

      // Refresh dashboard
      await loadDashboard();
    } catch (error) {
      alert(error.message);
    }
  };

  // ============================================================
  // PROCESS VOICE COMMAND
  // ============================================================

  const handleVoiceCommand = async () => {
    if (!transcript.trim()) {
      return;
    }

    try {
      setVoiceProcessing(true);
      setVoiceResult("");

      const result = await processVoiceCommand(
        transcript
      );

      setVoiceResult(result.message);

      // Refresh inventory, low stock and transactions
      await loadDashboard();
    } catch (error) {
      setVoiceResult(error.message);
    } finally {
      setVoiceProcessing(false);
    }
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">
          Loading inventory...
        </p>
      </div>
    );
  }

  // ============================================================
  // ERROR SCREEN
  // ============================================================

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl bg-red-50 p-6 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="mb-8">
          <p className="text-sm font-medium text-blue-600">
            INVENTORY MANAGEMENT
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Voice Inventory
          </h1>

          <p className="mt-2 text-slate-500">
            Manage your stock using your voice.
          </p>
        </header>

        {/* =====================================================
            VOICE SECTION
        ====================================================== */}

        <section className="mb-8 rounded-3xl bg-slate-900 p-8 text-white">
          <div className="flex flex-col items-center text-center">

            {/* Microphone Icon */}

            <div
              className={`mb-5 flex h-20 w-20 items-center justify-center rounded-full transition ${
                isListening
                  ? "animate-pulse bg-red-500/20"
                  : "bg-white/10"
              }`}
            >
              <span className="text-4xl">
                🎤
              </span>
            </div>

            <h2 className="text-2xl font-bold">
              What would you like to do?
            </h2>

            <p className="mt-2 text-slate-300">
              Speak naturally in your preferred language
            </p>

            {/* =================================================
                START / STOP LISTENING
            ================================================== */}

            <button
              onClick={
                isListening
                  ? stopListening
                  : startListening
              }
              className={`mt-6 rounded-full px-8 py-3 font-semibold transition ${
                isListening
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-white text-slate-900 hover:bg-slate-100"
              }`}
            >
              {isListening
                ? "⏹ Stop Listening"
                : "🎤 Tap to Speak"}
            </button>

            {/* =================================================
                TRANSCRIPT
            ================================================== */}

            {transcript && (
              <div className="mt-6 w-full max-w-2xl rounded-2xl bg-white/10 p-5 text-left">
                <p className="text-sm font-medium text-slate-300">
                  You said
                </p>

                <p className="mt-2 text-lg font-semibold text-white">
                  "{transcript}"
                </p>
              </div>
            )}

            {/* =================================================
                PROCESS COMMAND BUTTON
            ================================================== */}

            {transcript && (
              <button
                onClick={handleVoiceCommand}
                disabled={voiceProcessing}
                className="mt-4 rounded-full bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {voiceProcessing
                  ? "Processing..."
                  : "⚡ Process Command"}
              </button>
            )}

            {/* =================================================
                VOICE ERROR
            ================================================== */}

            {voiceError && (
              <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {voiceError}
              </div>
            )}

            {/* =================================================
                VOICE RESULT
            ================================================== */}

            {voiceResult && (
              <div className="mt-4 w-full max-w-2xl rounded-xl bg-white/10 px-5 py-4 text-left">
                <p className="text-sm font-medium text-slate-300">
                  Result
                </p>

                <p className="mt-1 text-sm text-white">
                  {voiceResult}
                </p>
              </div>
            )}

          </div>
        </section>

        {/* =====================================================
            SUMMARY CARDS
        ====================================================== */}

        <div className="mb-8 grid gap-4 md:grid-cols-3">

          <SummaryCard
            title="Total Items"
            value={inventory.length}
            icon="📦"
          />

          <SummaryCard
            title="Low Stock"
            value={lowStock.length}
            icon="⚠️"
          />

          <SummaryCard
            title="Transactions"
            value={transactions.length}
            icon="🔄"
          />

        </div>

        {/* =====================================================
            INVENTORY
        ====================================================== */}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center justify-between">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Inventory
              </h2>

              <p className="text-sm text-slate-500">
                Current stock levels
              </p>
            </div>

            <button
              onClick={() => setAddItemModal(true)}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + Add Item
            </button>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              {/* TABLE HEADER */}

              <thead>
                <tr className="border-b text-sm text-slate-500">

                  <th className="px-4 py-3">
                    Item
                  </th>

                  <th className="px-4 py-3">
                    Quantity
                  </th>

                  <th className="px-4 py-3">
                    Unit
                  </th>

                  <th className="px-4 py-3">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right">
                    Actions
                  </th>

                </tr>
              </thead>

              {/* TABLE BODY */}

              <tbody>

                {inventory.map((item) => {

                  const isLowStock =
                    item.quantity <=
                    item.lowStockThreshold;

                  return (
                    <tr
                      key={item._id}
                      className="border-b last:border-0"
                    >

                      {/* ITEM */}

                      <td className="px-4 py-4 font-medium text-slate-900">
                        {item.name}
                      </td>

                      {/* QUANTITY */}

                      <td className="px-4 py-4 font-semibold">
                        {item.quantity}
                      </td>

                      {/* UNIT */}

                      <td className="px-4 py-4 text-slate-500">
                        {item.unit}
                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-4">

                        {isLowStock ? (

                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                            Low Stock
                          </span>

                        ) : (

                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                            In Stock
                          </span>

                        )}

                      </td>

                      {/* ACTIONS */}

                      <td className="px-4 py-4">

                        <div className="flex justify-end gap-2">

                          {/* ADD */}

                          <button
                            onClick={() =>
                              setStockModal({
                                item: item,
                                type: "ADD",
                              })
                            }
                            className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                          >
                            + Add
                          </button>

                          {/* REMOVE */}

                          <button
                            onClick={() =>
                              setStockModal({
                                item: item,
                                type: "REMOVE",
                              })
                            }
                            className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            − Remove
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        </section>

        {/* =====================================================
            LOW STOCK
        ====================================================== */}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-900">
            Low Stock Alerts
          </h2>

          <p className="mb-5 text-sm text-slate-500">
            Items that need attention
          </p>

          {lowStock.length === 0 ? (

            <div className="rounded-xl bg-green-50 p-4 text-green-700">
              All items have sufficient stock.
            </div>

          ) : (

            <div className="space-y-3">

              {lowStock.map((item) => (

                <div
                  key={item._id}
                  className="flex items-center justify-between rounded-xl bg-red-50 p-4"
                >

                  <div>

                    <p className="font-semibold text-slate-900">
                      {item.name}
                    </p>

                    <p className="text-sm text-slate-500">
                      Minimum:{" "}
                      {item.lowStockThreshold}{" "}
                      {item.unit}
                    </p>

                  </div>

                  <p className="font-bold text-red-600">
                    {item.quantity}{" "}
                    {item.unit}
                  </p>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* =====================================================
            RECENT TRANSACTIONS
        ====================================================== */}

        <section className="rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-900">
            Recent Activity
          </h2>

          <p className="mb-5 text-sm text-slate-500">
            Latest inventory changes
          </p>

          <div className="space-y-3">

            {transactions.length === 0 ? (

              <div className="rounded-xl bg-slate-50 p-4 text-slate-500">
                No transactions yet.
              </div>

            ) : (

              transactions
                .slice(0, 10)
                .map((transaction) => {

                  const isAdd =
                    transaction.type === "ADD";

                  return (

                    <div
                      key={transaction._id}
                      className="flex items-center justify-between rounded-xl border p-4"
                    >

                      <div className="flex items-center gap-4">

                        {/* ICON */}

                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            isAdd
                              ? "bg-green-50"
                              : "bg-red-50"
                          }`}
                        >
                          {isAdd ? "↑" : "↓"}
                        </div>

                        {/* DETAILS */}

                        <div>

                          <p className="font-medium text-slate-900">
                            {transaction.inventoryId?.name}
                          </p>

                          <p className="text-sm text-slate-500">
                            {isAdd
                              ? "Added"
                              : "Removed"}{" "}
                            {transaction.quantity}{" "}
                            {transaction.unit}
                          </p>

                        </div>

                      </div>

                      {/* AMOUNT */}

                      <span
                        className={`font-semibold ${
                          isAdd
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {isAdd ? "+" : "-"}
                        {transaction.quantity}
                      </span>

                    </div>

                  );
                })

            )}

          </div>

        </section>

      </div>

      {/* =====================================================
          STOCK MODAL
      ====================================================== */}

      {stockModal && (
        <StockModal
          item={stockModal.item}
          type={stockModal.type}
          onClose={() => setStockModal(null)}
          onSubmit={handleStockSubmit}
        />
      )}

      {/* =====================================================
          ADD ITEM MODAL
      ====================================================== */}

      {addItemModal && (
        <AddItemModal
          onClose={() => setAddItemModal(false)}
          onSubmit={handleCreateItem}
        />
      )}

    </div>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>

        </div>

        <span className="text-2xl">
          {icon}
        </span>

      </div>

    </div>
  );
}

export default Dashboard;