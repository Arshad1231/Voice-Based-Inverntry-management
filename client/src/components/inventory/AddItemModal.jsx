import { useState } from "react";

function AddItemModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    unit: "",
    lowStockThreshold: "5",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter an item name");
      return;
    }

    if (!form.unit.trim()) {
      alert("Please enter a unit");
      return;
    }

    if (Number(form.quantity) < 0) {
      alert("Quantity cannot be negative");
      return;
    }

    try {
      setSubmitting(true);

      await onSubmit({
        name: form.name.trim(),
        quantity: Number(form.quantity) || 0,
        unit: form.unit.trim(),
        lowStockThreshold:
          Number(form.lowStockThreshold) || 5,
      });

    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

        {/* Header */}

        <div className="mb-6 flex items-center justify-between">

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Add Inventory Item
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a new product to your inventory.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>

        </div>


        {/* Form */}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Name */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Item Name
            </label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Rice"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>


          {/* Quantity */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Initial Quantity
            </label>

            <input
              type="number"
              name="quantity"
              min="0"
              value={form.quantity}
              onChange={handleChange}
              placeholder="e.g. 25"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>


          {/* Unit */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Unit
            </label>

            <input
              type="text"
              name="unit"
              value={form.unit}
              onChange={handleChange}
              placeholder="e.g. bags, kg, cartons"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>


          {/* Low Stock Threshold */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Low Stock Threshold
            </label>

            <input
              type="number"
              name="lowStockThreshold"
              min="0"
              value={form.lowStockThreshold}
              onChange={handleChange}
              placeholder="e.g. 5"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1 text-xs text-slate-400">
              You'll get a low-stock alert when stock reaches this level.
            </p>

          </div>


          {/* Buttons */}

          <div className="flex gap-3 pt-2">

            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Adding..."
                : "Add Item"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default AddItemModal;