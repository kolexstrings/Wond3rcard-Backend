import { Request, Response, NextFunction } from "express";
import tierModel from "../admin/subscriptionTier/tier.model";
import HttpException from "../../exceptions/http.exception";

class PublicSubscriptionController {
  public path = "/public/subscription";
  public router = require("express").Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @openapi
     * /api/public/subscription/tiers:
     *   get:
     *     tags: [public]
     *     summary: Get subscription tiers with location-based pricing
     *     parameters:
     *       - in: query
     *         name: country
     *         schema:
     *           type: string
     *           enum: [NG, US, GB, CA, AU, DE, FR, IT, ES, NL]
     *         description: User's country code (2-letter ISO). If not provided, will attempt to detect from request headers.
     *       - in: query
     *         name: currency
     *         schema:
     *           type: string
     *           enum: [USD, NGN]
     *         description: Explicit currency override. If provided, will ignore country detection.
     *     responses:
     *       200:
     *         description: Subscription tiers retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: "success"
     *                 data:
     *                   type: object
     *                   properties:
     *                     detectedCountry:
     *                       type: string
     *                       example: "NG"
     *                     selectedCurrency:
     *                       type: string
     *                       example: "NGN"
     *                     tiers:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           id:
     *                             type: string
     *                           name:
     *                             type: string
     *                           description:
     *                             type: string
     *                           features:
     *                             type: array
     *                             items:
     *                               type: string
     *                           monthly:
     *                             type: object
     *                             properties:
     *                               price:
     *                                 type: number
     *                               currency:
     *                                 type: string
     *                               symbol:
     *                                 type: string
     *                           yearly:
     *                             type: object
     *                             properties:
     *                               price:
     *                                 type: number
     *                               currency:
     *                                 type: string
     *                               symbol:
     *                                 type: string
     *       500:
     *         description: Internal server error
     */
    this.router.get(`${this.path}/tiers`, this.getSubscriptionTiers);
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

  private getSubscriptionTiers = async (
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

export default PublicSubscriptionController;
