import axios from "axios";
import PaystackSubscriptionService from "./paystack.service";
import userModel from "../../user/user.model";
import profileModel from "../../profile/profile.model";
import tierModel from "../../admin/subscriptionTier/tier.model";
import { UserTiers } from "../../user/user.protocol";

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

jest.mock("../../mails/nodemailer.service", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    sendMail: jest.fn().mockResolvedValue(undefined),
  })),
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

describe("PaystackSubscriptionService.cancelSubscription", () => {
  const service = new PaystackSubscriptionService();
  const userId = "user-cancel-1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("cancels the authenticated user's active Paystack subscription when no subscriptionId is provided", async () => {
    const userDoc: any = {
      _id: userId,
      email: "user@example.com",
      userTier: {
        plan: UserTiers.Premium,
        status: "active",
        transactionId: "tx_old",
        subscriptionCode: "SUB_ACTIVE",
        expiresAt: new Date(),
      },
      activeSubscription: {
        provider: "paystack",
        subscriptionId: "SUB_ACTIVE",
        expiryDate: new Date(),
      },
      save: jest.fn(),
    };

    mockedUserModel.findById.mockResolvedValue(userDoc);
    mockedProfileModel.findOne.mockResolvedValue({
      firstname: "John",
      lastname: "Doe",
    });

    const disableSpy = jest
      .spyOn(service as any, "disablePaystackSubscription")
      .mockResolvedValue(undefined);

    const result = await service.cancelSubscription({
      targetUserId: userId,
      // Simulate endpoint usage where subscriptionId is omitted
      subscriptionId: undefined as any,
    });

    expect(disableSpy).toHaveBeenCalledWith("SUB_ACTIVE");
    expect(result).toEqual({
      message: "Subscription canceled successfully",
      subscriptionId: "SUB_ACTIVE",
    });

    expect(userDoc.userTier.status).toBe("inactive");
    expect(userDoc.userTier.subscriptionCode).toBeNull();
    expect(userDoc.userTier.transactionId).toBeNull();
    expect(userDoc.userTier.expiresAt).toBeNull();
    expect(userDoc.activeSubscription.provider).toBeNull();
    expect(userDoc.activeSubscription.subscriptionId).toBeNull();
    expect(userDoc.activeSubscription.expiryDate).toBeNull();
    expect(userDoc.save).toHaveBeenCalled();
  });
});

describe("PaystackSubscriptionService.changeSubscription", () => {
  const service = new PaystackSubscriptionService();
  const userId = "user-change-1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initializes a new subscription change for the authenticated user", async () => {
    const userDoc: any = {
      _id: userId,
      email: "user@example.com",
      userTier: {
        plan: UserTiers.Basic,
        status: "active",
        transactionId: "old_tx",
        subscriptionCode: "SUB_OLD",
        expiresAt: new Date(),
      },
      activeSubscription: {
        provider: "paystack",
        subscriptionId: "SUB_OLD",
        expiryDate: new Date(),
      },
      save: jest.fn(),
    };

    mockedUserModel.findById.mockResolvedValue(userDoc);

    const disableSpy = jest
      .spyOn(service as any, "disablePaystackSubscription")
      .mockResolvedValue(undefined);

    const initializeSpy = jest
      .spyOn(service, "initializePayment")
      .mockResolvedValue({
        type: "payment" as const,
        checkoutUrl: "https://checkout.paystack.test/new",
        reference: "REF_NEW",
      } as any);

    const result = await service.changeSubscription({
      targetUserId: userId,
      newPlan: UserTiers.Premium,
      billingCycle: "monthly",
    });

    expect(disableSpy).toHaveBeenCalledWith("SUB_OLD");
    expect(initializeSpy).toHaveBeenCalledWith(userId, "premium", "monthly");

    expect(result.message).toBe("Subscription change initiated");
    expect(result.nextAction).toBe("complete_payment");
    expect(result.data).toEqual(
      expect.objectContaining({
        type: "payment",
        checkoutUrl: expect.any(String),
      })
    );

    expect(userDoc.userTier.plan).toBe(UserTiers.Premium);
    expect(userDoc.userTier.status).toBe("inactive");
    expect(userDoc.userTier.transactionId).toBeNull();
    expect(userDoc.userTier.subscriptionCode).toBeNull();
    expect(userDoc.userTier.expiresAt).toBeNull();

    expect(userDoc.activeSubscription.provider).toBe("paystack");
    expect(userDoc.activeSubscription.subscriptionId).toBeNull();
    expect(userDoc.activeSubscription.expiryDate).toBeNull();
    expect(userDoc.save).toHaveBeenCalled();
  });
});
