const API_URL = "http://localhost:3000/api";

export const getInventory = async () => {
  const response = await fetch(
    `${API_URL}/inventory`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch inventory");
  }

  return response.json();
};

export const getLowStockItems = async () => {
  const response = await fetch(
    `${API_URL}/inventory/low-stock`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch low stock items");
  }

  return response.json();
};

export const getTransactions = async () => {
  const response = await fetch(
    `${API_URL}/transactions`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }

  return response.json();
};

export const addStock = async (id, quantity) => {
  const response = await fetch(
    `${API_URL}/inventory/${id}/add`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quantity,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const removeStock = async (id, quantity) => {
  const response = await fetch(
    `${API_URL}/inventory/${id}/remove`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quantity,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const createInventoryItem = async (item) => {
  const response = await fetch(
    `${API_URL}/inventory`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};


export const processVoiceCommand = async (
  transcript,
  pendingCommand = null
) => {
  const response = await fetch(
    `${API_URL}/voice/command`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript,
        pendingCommand,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message);
    error.data = data.data;
    throw error;
  }

  return data;
};