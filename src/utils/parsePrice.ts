import HttpException from "../exceptions/http.exception";

export const parsePrice = (price: any): number => {
  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice)) {
    throw new HttpException(400, "error", "Price must be a valid number");
  }
  return parsedPrice;
};
