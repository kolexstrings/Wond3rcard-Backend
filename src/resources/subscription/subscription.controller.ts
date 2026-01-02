import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import GeneralController from "../../protocols/global.controller";
import SubscriptionService from "./subscription.service";
import tierModel from "../admin/subscriptionTier/tier.model";

class SubscriptionController implements GeneralController {
  public path = "/subscriptions";
  public router = Router();
  private subscriptionService = new SubscriptionService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}/tiers`, this.getPublicTiers);
  }

  private getCountryFromHeaders(req: Request): string {
    // Try Cloudflare country header first (most reliable)
    const cfCountry = req.headers["cf-ipcountry"] as string;
    if (cfCountry && cfCountry.length === 2) {
      return cfCountry.toUpperCase();
    }

    // Try other common headers
    const countryHeaders = [
      "x-country-code",
      "x-verified-country",
      "cloudfront-viewer-country",
      "x-appengine-country",
    ];

    for (const header of countryHeaders) {
      const country = req.headers[header] as string;
      if (country && country.length === 2) {
        return country.toUpperCase();
      }
    }

    // Fallback to default
    return "US";
  }

  private getCurrencyFromCountry(country: string): "USD" | "NGN" {
    // Nigeria uses NGN, everyone else uses USD
    return country === "NG" ? "NGN" : "USD";
  }

  private getCurrencySymbol(currency: "USD" | "NGN"): string {
    return currency === "NGN" ? "₦" : "$";
  }

  private getPublicTiers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get explicit currency from query parameter (highest priority)
      let selectedCurrency: "USD" | "NGN" = "USD";
      let detectedCountry = "US";

      if (req.query.currency) {
        const currency = req.query.currency as string;
        if (["USD", "NGN"].includes(currency.toUpperCase())) {
          selectedCurrency = currency.toUpperCase() as "USD" | "NGN";
        } else {
          throw new HttpException(
            400,
            "invalid_currency",
            "Invalid currency. Supported currencies: USD, NGN"
          );
        }
      } else {
        // Detect country from headers
        detectedCountry = this.getCountryFromHeaders(req);
        selectedCurrency = this.getCurrencyFromCountry(detectedCountry);
      }

      // Fetch all tiers from database
      const tiers = await tierModel.find({}).lean();

      // Transform tiers based on selected currency
      const transformedTiers = tiers.map((tier) => ({
        id: tier._id.toString(),
        name: tier.name,
        description: tier.description,
        features: tier.features,
        trialPeriod: tier.trialPeriod,
        autoRenew: tier.autoRenew,
        monthly: {
          price:
            selectedCurrency === "NGN"
              ? tier.billingCycle.monthly.priceNGN
              : tier.billingCycle.monthly.priceUSD,
          currency: selectedCurrency,
          symbol: this.getCurrencySymbol(selectedCurrency),
          durationInDays: tier.billingCycle.monthly.durationInDays,
        },
        yearly: {
          price:
            selectedCurrency === "NGN"
              ? tier.billingCycle.yearly.priceNGN
              : tier.billingCycle.yearly.priceUSD,
          currency: selectedCurrency,
          symbol: this.getCurrencySymbol(selectedCurrency),
          durationInDays: tier.billingCycle.yearly.durationInDays,
        },
      }));

      res.status(200).json({
        status: "success",
        message: "Available subscription tiers",
        data: {
          detectedCountry,
          selectedCurrency,
          tiers: transformedTiers,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        return next(error);
      }

      console.error("Error fetching subscription tiers:", error);
      next(
        new HttpException(
          500,
          "fetch_tiers_failed",
          "Failed to fetch subscription tiers. Please try again later."
        )
      );
    }
  };
}

export default SubscriptionController;
