import axios from "axios";
import PaystackSubscriptionService from "./paystack.service";
import userModel from "../../user/user.model";
import profileModel from "../../profile/profile.model";
import tierModel from "../../admin/subscriptionTier/tier.model";

jest.mock("axios");

jest.mock("../../user/user.model", () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock("../../profile/profile.model", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

jest.mock("../../admin/subscriptionTier/tier.model", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedUserModel = userModel as any;
const mockedProfileModel = profileModel as any;
const mockedTierModel = tierModel as any;

describe("PaystackSubscriptionService.initializePayment", () => {
  const service = new PaystackSubscriptionService();
  const userId = "user123";
  const plan = "premium";
  const billingCycle = "monthly" as const;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PAYSTACK_SECRET_KEY = "test_secret";
    process.env.FRONTEND_BASE_URL = "https://frontend.test";

    mockedUserModel.findById.mockResolvedValue({
      _id: userId,
      email: "user@example.com",
      paystackCustomerId: "CUST_001",
      save: jest.fn(),
    });

    mockedProfileModel.findOne.mockResolvedValue({
      firstname: "John",
      lastname: "Doe",
    });

    mockedTierModel.findOne.mockResolvedValue({
      billingCycle: {
        monthly: { durationInDays: 30, paystackPlanCode: "PLAN_001" },
        yearly: { durationInDays: 365, paystackPlanCode: "PLAN_002" },
      },
    });
  });

  it("returns payment checkout URL when user has no saved card", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { status: true, data: { amount: 5000 } }, // plan details
      })
      .mockResolvedValueOnce({
        data: { status: true, data: { authorizations: [] } }, // customer details with no authorizations
      });

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        status: true,
        data: {
          authorization_url: "https://checkout.paystack.test/abc",
          reference: "REF_123",
          callback_url: "https://frontend.test/payment-success",
        },
      },
    });

    const result = await service.initializePayment(userId, plan, billingCycle);

    expect(result.type).toBe("payment");
    expect(result.checkoutUrl).toBe("https://checkout.paystack.test/abc");
    expect(result.reference).toBe("REF_123");
  });

  it("creates subscription directly when user has saved authorization", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { status: true, data: { amount: 5000 } }, // plan details
      })
      .mockResolvedValueOnce({
        data: {
          status: true,
          data: {
            authorizations: [{ authorization_code: "AUTH_123" }],
          },
        },
      });

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        status: true,
        data: {
          subscription_code: "SUB_123",
          reference: "REF_SUB",
          callback_url: "https://frontend.test/payment-success",
        },
      },
    });

    const result = await service.initializePayment(userId, plan, billingCycle);

    expect(result.type).toBe("subscription");
    expect(result.subscriptionData.subscription_code).toBe("SUB_123");
  });
});
