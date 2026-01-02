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
    /**
     * @openapi
     * /api/subscriptions/tiers:
     *   get:
     *     tags: [subscription]
     *     summary: Get subscription tiers with location-based pricing
     *     description: Retrieves subscription tiers with pricing based on user location or explicit currency selection. Nigeria users see NGN prices by default, others see USD prices.
     *     parameters:
     *       - in: query
     *         name: country
     *         schema:
     *           type: string
     *           enum: [NG, US, GB, CA, AU, DE, FR, IT, ES, NL]
     *         description: User's country code (2-letter ISO). If not provided, will attempt to detect from request headers.
     *         example: "NG"
     *       - in: query
     *         name: currency
     *         schema:
     *           type: string
     *           enum: [USD, NGN]
     *         description: Explicit currency override. If provided, will ignore country detection.
     *         example: "USD"
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
     *                 message:
     *                   type: string
     *                   example: "Available subscription tiers"
     *                 data:
     *                   type: object
     *                   properties:
     *                     detectedCountry:
     *                       type: string
     *                       description: The detected country from request headers
     *                       example: "NG"
     *                     selectedCurrency:
     *                       type: string
     *                       description: The currency used for pricing (USD or NGN)
     *                       example: "NGN"
     *                     tiers:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           id:
     *                             type: string
     *                             description: Tier ID
     *                             example: "64a1b2c3d4e5f6789012345"
     *                           name:
     *                             type: string
     *                             description: Tier name
     *                             example: "premium"
     *                           description:
     *                             type: string
     *                             description: Tier description
     *                             example: "Premium tier with all features"
     *                           features:
     *                             type: array
     *                             items:
     *                               type: string
     *                             description: List of features included in this tier
     *                             example: ["feature1", "feature2", "feature3"]
     *                           trialPeriod:
     *                             type: number
     *                             description: Trial period in days
     *                             example: 7
     *                           autoRenew:
     *                             type: boolean
     *                             description: Whether subscription auto-renews
     *                             example: true
     *                           monthly:
     *                             type: object
     *                             properties:
     *                               price:
     *                                 type: number
     *                                 description: Monthly price in selected currency
     *                                 example: 5000
     *                               currency:
     *                                 type: string
     *                                 description: Currency code
     *                                 example: "NGN"
     *                               symbol:
     *                                 type: string
     *                                 description: Currency symbol
     *                                 example: "₦"
     *                               durationInDays:
     *                                 type: number
     *                                 description: Duration in days
     *                                 example: 30
     *                           yearly:
     *                             type: object
     *                             properties:
     *                               price:
     *                                 type: number
     *                                 description: Yearly price in selected currency
     *                                 example: 50000
     *                               currency:
     *                                 type: string
     *                                 description: Currency code
     *                                 example: "NGN"
     *                               symbol:
     *                                 type: string
     *                                 description: Currency symbol
     *                                 example: "₦"
     *                               durationInDays:
     *                                 type: number
     *                                 description: Duration in days
     *                                 example: 365
     *       400:
     *         description: Bad request - Invalid currency parameter
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 statusCode:
     *                   type: number
     *                   example: 400
     *                 status:
     *                   type: string
     *                   example: "invalid_currency"
     *                 message:
     *                   type: string
     *                   example: "Invalid currency. Supported currencies: USD, NGN"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 statusCode:
     *                   type: number
     *                   example: 500
     *                 status:
     *                   type: string
     *                   example: "fetch_tiers_failed"
     *                 message:
     *                   type: string
     *                   example: "Failed to fetch subscription tiers. Please try again later."
     */
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
