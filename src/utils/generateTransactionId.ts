export const generateTransactionId = (
  type: "subscription" | "card_order",
  provider: "paystack" | "stripe" | "manual"
) => {
  const uniquePart = Date.now().toString().slice(-6);
  const typeCode = type === "subscription" ? "SUB" : "ORD";

  const providerCode =
    {
      paystack: "PS",
      stripe: "ST",
      manual: "MN",
    }[provider] || "OTH";

  return `${typeCode}-${providerCode}-${uniquePart}`;
};
