import { useEffect, useState } from "react";
import useSpeech from "../hooks/useSpeech";

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

  const {
    speak,
    stopSpeaking,
    isSpeaking,
    error: speechError,
  } = useSpeech();

  const [voiceProcessing, setVoiceProcessing] =
    useState(false);

  const [voiceResult, setVoiceResult] =
    useState("");

  const [pendingVoiceCommand, setPendingVoiceCommand] =
    useState(null);

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

  useEffect(() => {
    loadDashboard();
  }, []);

  // ============================================================
  // AUTOMATIC CONFIRMATION LISTENING
  // ============================================================

  useEffect(() => {
    if (!pendingVoiceCommand) {
      return;
    }

    const timer = setTimeout(() => {
      startListening();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [pendingVoiceCommand]);

  // ============================================================
  // AUTOMATIC CONFIRMATION PROCESSING
  // ============================================================

  useEffect(() => {
    if (
      !pendingVoiceCommand ||
      !transcript ||
      isListening ||
      voiceProcessing
    ) {
      return;
    }

    handleVoiceCommand();
  }, [
    transcript,
    pendingVoiceCommand,
    isListening,
    voiceProcessing,
  ]);

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

      setStockModal(null);

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
        transcript,
        pendingVoiceCommand
      );

      const message =
        result?.message ||
        "Command processed successfully.";

      // Display response
      setVoiceResult(message);

      // Speak response
      speak(message);

      // --------------------------------------------------------
      // CHECK FOR NEW ITEM CONFIRMATION
      // --------------------------------------------------------

      if (
        result?.data?.action ===
        "CONFIRM_CREATE_ITEM"
      ) {
        setPendingVoiceCommand(
          result.data.pendingCommand
        );
      } else {
        setPendingVoiceCommand(null);
      }

      // Refresh dashboard
      await loadDashboard();
    } catch (error) {
      const message =
        error?.message ||
        "Something went wrong while processing your command.";

      // --------------------------------------------------------
      // CONFIRMATION RESPONSE FROM ERROR
      // --------------------------------------------------------

      if (
        error?.data?.action ===
        "CONFIRM_CREATE_ITEM"
      ) {
        setPendingVoiceCommand(
          error.data.pendingCommand
        );
      }

      // Display error / confirmation message
      setVoiceResult(message);

      // Speak error / confirmation message
      speak(message);
    } finally {
      setVoiceProcessing(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">

          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">

            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />

          </div>

          <p className="text-sm font-medium text-slate-400">
            Loading your inventory...
          </p>

        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">

        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">
            !
          </div>

          <h2 className="text-lg font-bold text-white">
            Something went wrong
          </h2>

          <p className="mt-2 text-sm text-red-300">
            {error}
          </p>

          <button
            onClick={loadDashboard}
            className="mt-6 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  const totalStockUnits = inventory.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ======================================================
          BACKGROUND
      ======================================================= */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute right-0 top-96 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />

      </div>

      {/* ======================================================
          MAIN
      ======================================================= */}

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ====================================================
            HEADER
        ===================================================== */}

        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 ring-1 ring-blue-400/20">
              <span className="text-2xl">
                📦
              </span>
            </div>

            <div>

              <div className="flex items-center gap-2">

                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Voice Inventory
                </h1>

                <span className="rounded-full border border-green-400/20 bg-green-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
                  Live
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-400">
                Smart inventory management with voice
              </p>

            </div>

          </div>

          <button
            onClick={() => setAddItemModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-white/5 transition hover:bg-slate-100"
          >
            <span className="text-lg">
              +
            </span>

            Add Item
          </button>

        </header>

        {/* ====================================================
            VOICE ASSISTANT
        ===================================================== */}

        <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/50 shadow-2xl">

          {/* Decorative glow */}

          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative px-5 py-10 sm:px-10 sm:py-12">

            {/* Assistant badge */}

            <div className="mb-6 flex justify-center">

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur">

                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />

                Voice Assistant

              </div>

            </div>

            {/* Microphone */}

            <div className="flex justify-center">

              <div
                className={`relative flex h-28 w-28 items-center justify-center rounded-full transition-all duration-500 ${
                  isListening
                    ? "scale-110 bg-red-500/10 ring-8 ring-red-500/5"
                    : pendingVoiceCommand
                      ? "bg-blue-500/10 ring-8 ring-blue-500/5"
                      : "bg-white/5 ring-8 ring-white/[0.02]"
                }`}
              >

                {isListening && (
                  <>
                    <div className="absolute inset-0 animate-ping rounded-full border border-red-400/30" />

                    <div className="absolute -inset-3 animate-pulse rounded-full border border-red-400/10" />
                  </>
                )}

                <div
                  className={`relative flex h-20 w-20 items-center justify-center rounded-full transition ${
                    isListening
                      ? "bg-red-500 shadow-lg shadow-red-500/30"
                      : pendingVoiceCommand
                        ? "bg-blue-500 shadow-lg shadow-blue-500/30"
                        : "bg-white/10"
                  }`}
                >
                  <span className="text-3xl">
                    🎤
                  </span>
                </div>

              </div>

            </div>

            {/* Heading */}

            <div className="mt-7 text-center">

              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">

                {pendingVoiceCommand
                  ? "Just say yes or no"
                  : isListening
                    ? "I'm listening..."
                    : "What would you like to do?"}

              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">

                {pendingVoiceCommand
                  ? "Confirm the new inventory item using your voice."
                  : isListening
                    ? "Speak naturally. I'll understand your inventory command."
                    : "Add stock, remove stock, check quantities, or manage items naturally."}

              </p>

            </div>

            {/* Main voice button */}

            {!pendingVoiceCommand && (
              <div className="mt-7 flex justify-center">

                <button
                  onClick={
                    isListening
                      ? stopListening
                      : startListening
                  }
                  className={`group inline-flex items-center gap-3 rounded-2xl px-7 py-3.5 text-sm font-bold shadow-xl transition-all ${
                    isListening
                      ? "bg-red-500 text-white shadow-red-500/20 hover:bg-red-600"
                      : "bg-white text-slate-950 shadow-white/10 hover:-translate-y-0.5 hover:bg-slate-100"
                  }`}
                >

                  <span className="text-lg">
                    {isListening ? "■" : "🎤"}
                  </span>

                  {isListening
                    ? "Stop Listening"
                    : "Tap to Speak"}

                </button>

              </div>
            )}

            {/* ==================================================
                TRANSCRIPT
            =================================================== */}

            {transcript && !pendingVoiceCommand && (
              <div className="mx-auto mt-8 max-w-2xl">

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">

                  <div className="flex items-center gap-2">

                    <div className="h-2 w-2 rounded-full bg-blue-400" />

                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      You said
                    </p>

                  </div>

                  <p className="mt-3 text-base font-medium leading-7 text-white">
                    "{transcript}"
                  </p>

                </div>

                <div className="mt-4 flex justify-center">

                  <button
                    onClick={handleVoiceCommand}
                    disabled={voiceProcessing}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {voiceProcessing ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                        Processing...
                      </>
                    ) : (
                      <>
                        <span>
                          ⚡
                        </span>

                        Process Command
                      </>
                    )}

                  </button>

                </div>

              </div>
            )}

            {/* ==================================================
                CONFIRMATION CARD
            =================================================== */}

            {pendingVoiceCommand && (
              <div className="mx-auto mt-8 max-w-xl">

                <div className="overflow-hidden rounded-3xl border border-blue-400/20 bg-blue-500/[0.06] shadow-2xl shadow-blue-950/20">

                  {/* Top */}

                  <div className="border-b border-white/10 px-6 py-5">

                    <div className="flex items-center gap-4">

                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15">

                        {isListening && (
                          <div className="absolute inset-0 animate-ping rounded-2xl bg-blue-500/10" />
                        )}

                        <span className="relative text-xl">
                          🎤
                        </span>

                      </div>

                      <div>

                        <p className="font-bold text-white">
                          Confirmation needed
                        </p>

                        <div className="mt-1 flex items-center gap-2">

                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />

                          <p className="text-xs font-medium text-green-400">

                            {isListening
                              ? "Listening for your answer"
                              : "Preparing microphone..."}

                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                  {/* Command */}

                  <div className="px-6 py-6">

                    <p className="text-sm text-slate-400">
                      Do you want to add:
                    </p>

                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-xl">
                          📦
                        </div>

                        <div>

                          <p className="font-bold text-white">
                            {pendingVoiceCommand.item}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            New inventory item
                          </p>

                        </div>

                      </div>

                      <div className="text-right">

                        <p className="text-lg font-bold text-blue-400">
                          {pendingVoiceCommand.quantity}
                        </p>

                        <p className="text-xs text-slate-400">
                          {pendingVoiceCommand.unit}
                        </p>

                      </div>

                    </div>

                    {/* Voice instructions */}

                    <div className="mt-5 grid grid-cols-2 gap-3">

                      <div className="rounded-xl border border-green-400/10 bg-green-400/5 p-3 text-center">

                        <p className="text-xs font-bold text-green-400">
                          ✓ YES
                        </p>

                        <p className="mt-1 text-[11px] text-slate-500">
                          Add item
                        </p>

                      </div>

                      <div className="rounded-xl border border-red-400/10 bg-red-400/5 p-3 text-center">

                        <p className="text-xs font-bold text-red-400">
                          × NO
                        </p>

                        <p className="mt-1 text-[11px] text-slate-500">
                          Cancel
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* ==================================================
                VOICE ERROR
            =================================================== */}

            {voiceError && (
              <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-red-400/20 bg-red-400/5 px-5 py-4">

                <div className="flex items-start gap-3">

                  <span className="text-red-400">
                    !
                  </span>

                  <div>

                    <p className="text-sm font-semibold text-red-300">
                      Voice error
                    </p>

                    <p className="mt-1 text-xs leading-5 text-red-300/70">
                      {voiceError}
                    </p>

                  </div>

                </div>

              </div>
            )}

            {/* ==================================================
                SPEAKING INDICATOR
            =================================================== */}

            {isSpeaking && (
              <div className="mx-auto mt-5 flex w-fit items-center gap-3 rounded-full border border-blue-400/20 bg-blue-400/5 px-4 py-2.5">

                <div className="flex items-center gap-1">

                  <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />

                  <span
                    className="h-3 w-1 animate-pulse rounded-full bg-blue-400"
                    style={{
                      animationDelay: "100ms",
                    }}
                  />

                  <span
                    className="h-4 w-1 animate-pulse rounded-full bg-blue-400"
                    style={{
                      animationDelay: "200ms",
                    }}
                  />

                  <span
                    className="h-2 w-1 animate-pulse rounded-full bg-blue-400"
                    style={{
                      animationDelay: "300ms",
                    }}
                  />

                </div>

                <span className="text-xs font-semibold text-blue-300">
                  Assistant is speaking...
                </span>

                <button
                  onClick={stopSpeaking}
                  className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  Stop
                </button>

              </div>
            )}

            {/* ==================================================
                SPEECH ERROR
            =================================================== */}

            {speechError && (
              <div className="mx-auto mt-3 max-w-xl text-center text-xs text-red-400">
                {speechError}
              </div>
            )}

            {/* ==================================================
                RESULT
            =================================================== */}

            {voiceResult && !pendingVoiceCommand && (
              <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-green-400/20 bg-green-400/5 px-5 py-4">

                <div className="flex items-start gap-3">

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-400/10 text-green-400">
                    ✓
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-green-300">
                      Done
                    </p>

                    <p className="mt-1 text-sm leading-5 text-slate-300">
                      {voiceResult}
                    </p>

                  </div>

                </div>

              </div>
            )}

          </div>
        </section>

        {/* ====================================================
            STATS
        ===================================================== */}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            label="Total Items"
            value={inventory.length}
            description="Products tracked"
            icon="📦"
            accent="blue"
          />

          <StatCard
            label="Stock Units"
            value={totalStockUnits}
            description="Across inventory"
            icon="◈"
            accent="violet"
          />

          <StatCard
            label="Low Stock"
            value={lowStock.length}
            description={
              lowStock.length > 0
                ? "Needs attention"
                : "Everything looks good"
            }
            icon="!"
            accent={
              lowStock.length > 0
                ? "red"
                : "green"
            }
          />

          <StatCard
            label="Transactions"
            value={transactions.length}
            description="Total activity"
            icon="↕"
            accent="amber"
          />

        </section>

        {/* ====================================================
            INVENTORY
        ===================================================== */}

        <section className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-xl">

          <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

            <div>

              <div className="flex items-center gap-3">

                <h2 className="text-lg font-bold text-white">
                  Inventory
                </h2>

                <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-400">
                  {inventory.length} items
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Monitor and manage your current stock
              </p>

            </div>

            <button
              onClick={() => setAddItemModal(true)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              + Add Item
            </button>

          </div>

          {inventory.length === 0 ? (

            <EmptyState
              icon="📦"
              title="Your inventory is empty"
              description="Add your first item manually or use your voice."
            />

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[720px]">

                <thead>

                  <tr className="border-b border-white/10 text-left">

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Item
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Quantity
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Unit
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {inventory.map((item) => {

                    const isLowStock =
                      item.quantity <=
                      item.lowStockThreshold;

                    const stockPercentage =
                      item.lowStockThreshold > 0
                        ? Math.min(
                            (item.quantity /
                              (item.lowStockThreshold *
                                4)) *
                              100,
                            100
                          )
                        : 100;

                    return (
                      <tr
                        key={item._id}
                        className="group border-b border-white/5 transition hover:bg-white/[0.025]"
                      >

                        {/* ITEM */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-lg">
                              📦
                            </div>

                            <div>

                              <p className="font-semibold text-white">
                                {item.name}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                Updated inventory
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* QUANTITY */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <span className="text-base font-bold text-white">
                              {item.quantity}
                            </span>

                            <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-white/5 sm:block">

                              <div
                                className={`h-full rounded-full ${
                                  isLowStock
                                    ? "bg-red-400"
                                    : "bg-blue-400"
                                }`}
                                style={{
                                  width: `${stockPercentage}%`,
                                }}
                              />

                            </div>

                          </div>

                        </td>

                        {/* UNIT */}

                        <td className="px-6 py-5">

                          <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-400">
                            {item.unit}
                          </span>

                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">

                          {isLowStock ? (

                            <span className="inline-flex items-center gap-2 rounded-full border border-red-400/10 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-400">

                              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />

                              Low Stock

                            </span>

                          ) : (

                            <span className="inline-flex items-center gap-2 rounded-full border border-green-400/10 bg-green-400/10 px-3 py-1.5 text-xs font-bold text-green-400">

                              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />

                              In Stock

                            </span>

                          )}

                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-5">

                          <div className="flex justify-end gap-2">

                            <button
                              onClick={() =>
                                setStockModal({
                                  item,
                                  type: "ADD",
                                })
                              }
                              className="rounded-lg border border-green-400/10 bg-green-400/5 px-3 py-2 text-xs font-bold text-green-400 transition hover:bg-green-400/10"
                            >
                              + Add
                            </button>

                            <button
                              onClick={() =>
                                setStockModal({
                                  item,
                                  type: "REMOVE",
                                })
                              }
                              className="rounded-lg border border-red-400/10 bg-red-400/5 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-400/10"
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

          )}

        </section>

        {/* ====================================================
            BOTTOM GRID
        ===================================================== */}

        <div className="grid gap-8 lg:grid-cols-2">

          {/* ==================================================
              LOW STOCK
          =================================================== */}

          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl">

            <div className="mb-6 flex items-start justify-between">

              <div>

                <div className="flex items-center gap-3">

                  <h2 className="text-lg font-bold text-white">
                    Low Stock
                  </h2>

                  {lowStock.length > 0 && (
                    <span className="rounded-full bg-red-400/10 px-2.5 py-1 text-xs font-bold text-red-400">
                      {lowStock.length}
                    </span>
                  )}

                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Items that need attention
                </p>

              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-400/10 text-red-400">
                !
              </div>

            </div>

            {lowStock.length === 0 ? (

              <div className="rounded-2xl border border-green-400/10 bg-green-400/5 p-5">

                <div className="flex items-center gap-4">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-400/10 text-green-400">
                    ✓
                  </div>

                  <div>

                    <p className="font-semibold text-green-300">
                      All stocked up
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      No items are below their threshold.
                    </p>

                  </div>

                </div>

              </div>

            ) : (

              <div className="space-y-3">

                {lowStock.map((item) => (

                  <div
                    key={item._id}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.025] p-4"
                  >

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-400/10">
                        📦
                      </div>

                      <div>

                        <p className="font-semibold text-white">
                          {item.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Threshold:{" "}
                          {item.lowStockThreshold}{" "}
                          {item.unit}
                        </p>

                      </div>

                    </div>

                    <div className="text-right">

                      <p className="font-bold text-red-400">
                        {item.quantity}
                      </p>

                      <p className="text-[11px] text-slate-500">
                        {item.unit}
                      </p>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </section>

          {/* ==================================================
              RECENT ACTIVITY
          =================================================== */}

          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl">

            <div className="mb-6">

              <div className="flex items-center gap-3">

                <h2 className="text-lg font-bold text-white">
                  Recent Activity
                </h2>

                <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  Latest 10
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Your latest inventory changes
              </p>

            </div>

            {transactions.length === 0 ? (

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">

                <p className="text-sm text-slate-500">
                  No transactions yet.
                </p>

              </div>

            ) : (

              <div className="space-y-1">

                {transactions
                  .slice(0, 10)
                  .map((transaction) => {

                    const isAdd =
                      transaction.type ===
                      "ADD";

                    return (

                      <div
                        key={transaction._id}
                        className="flex items-center justify-between rounded-2xl p-3 transition hover:bg-white/[0.03]"
                      >

                        <div className="flex min-w-0 items-center gap-3">

                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              isAdd
                                ? "bg-green-400/10 text-green-400"
                                : "bg-red-400/10 text-red-400"
                            }`}
                          >
                            {isAdd
                              ? "↑"
                              : "↓"}
                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-white">
                              {transaction.inventoryId?.name ||
                                "Unknown item"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">

                              {isAdd
                                ? "Added"
                                : "Removed"}{" "}
                              {transaction.quantity}{" "}
                              {transaction.unit}

                              {transaction.source ===
                                "VOICE" && (
                                <span className="ml-2 rounded-full bg-blue-400/10 px-2 py-0.5 text-blue-400">
                                  Voice
                                </span>
                              )}

                            </p>

                          </div>

                        </div>

                        <span
                          className={`ml-4 shrink-0 text-sm font-bold ${
                            isAdd
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {isAdd ? "+" : "-"}
                          {transaction.quantity}
                        </span>

                      </div>

                    );
                  })}

              </div>

            )}

          </section>

        </div>

      </div>

      {/* ======================================================
          MODALS
      ======================================================= */}

      {stockModal && (
        <StockModal
          item={stockModal.item}
          type={stockModal.type}
          onClose={() => setStockModal(null)}
          onSubmit={handleStockSubmit}
        />
      )}

      {addItemModal && (
        <AddItemModal
          onClose={() =>
            setAddItemModal(false)
          }
          onSubmit={handleCreateItem}
        />
      )}

    </div>
  );
}


// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  description,
  icon,
  accent,
}) {
  const accentClasses = {
    blue: {
      icon: "bg-blue-400/10 text-blue-400",
      glow: "group-hover:bg-blue-400/15",
    },

    violet: {
      icon: "bg-violet-400/10 text-violet-400",
      glow: "group-hover:bg-violet-400/15",
    },

    green: {
      icon: "bg-green-400/10 text-green-400",
      glow: "group-hover:bg-green-400/15",
    },

    red: {
      icon: "bg-red-400/10 text-red-400",
      glow: "group-hover:bg-red-400/15",
    },

    amber: {
      icon: "bg-amber-400/10 text-amber-400",
      glow: "group-hover:bg-amber-400/15",
    },
  };

  const styles =
    accentClasses[accent] ||
    accentClasses.blue;

  return (
    <div className="group rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-lg transition hover:-translate-y-0.5 hover:border-white/15">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>

        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg transition ${styles.icon} ${styles.glow}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}


// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  icon,
  title,
  description,
}) {
  return (
    <div className="px-6 py-16 text-center">

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-2xl">
        {icon}
      </div>

      <h3 className="mt-5 font-bold text-white">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>

    </div>
  );
}

export default Dashboard;