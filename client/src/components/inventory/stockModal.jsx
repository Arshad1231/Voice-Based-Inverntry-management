import { useState } from "react";

function StockModal({
  item,
  type,
  onClose,
  onSubmit,
}) {
  const [quantity, setQuantity] = useState("");

  const isAdd = type === "ADD";

  const handleSubmit = async (e) => {
    e.preventDefault();

    const value = Number(quantity);

    if (!value || value <= 0) {
      return;
    }

    await onSubmit(value);

    setQuantity("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isAdd ? "Add Stock" : "Remove Stock"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {item.name} · Current: {item.quantity} {item.unit}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Quantity
          </label>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              autoFocus
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <span className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
              {item.unit}
            </span>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className={`flex-1 rounded-xl px-4 py-3 font-semibold text-white ${
                isAdd
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isAdd ? "Add Stock" : "Remove Stock"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default StockModal;