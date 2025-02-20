import axios from "axios";
import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek, subMonths, subWeeks } from 'date-fns';
import mongoose, { Types } from "mongoose";
import HttpException from "../../exceptions/http.exception";
import cardModel from "../card/card.model";
import userModel from "../user/user.model";
import interactionModel from "./interaction.model";
import { DeviceInfo, Geolocation, Interaction, Interactor } from "./interaction.protocol";

class InteractionService {

  private model = interactionModel
  private card = cardModel
  private user = userModel
  private getStartOfPeriod = (period: "day" | "week" | "month" | "year") => {
    const now = new Date();
    if (period === "day") return new Date(now.setHours(0, 0, 0, 0));
    if (period === "week") {
      const firstDayOfWeek = now.getDate() - now.getDay();
      return new Date(now.setDate(firstDayOfWeek));
    }
    if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === "year") return new Date(now.getFullYear(), 0, 1);
    return now;
  };

  private getDateRangeForTimePeriod(timePeriod: string) {
    const currentDate = new Date();

    switch (timePeriod) {
      case 'today':
        return {
          startDate: startOfDay(currentDate),
          endDate: endOfDay(currentDate),
        };
      case 'lastWeek':
        return {
          startDate: startOfWeek(subWeeks(currentDate, 1)),
          endDate: endOfWeek(subWeeks(currentDate, 1)),
        };
      case 'lastMonth':
        return {
          startDate: startOfMonth(subMonths(currentDate, 1)),
          endDate: endOfMonth(subMonths(currentDate, 1)),
        };
      default:
        throw new Error('Invalid time period. Valid values are "today", "lastWeek", "lastMonth".');
    }
  }

  private async getGeolocation(ip: string): Promise<Geolocation | null> {
    try {
      const geoResponse = await axios.get<Geolocation>(`https://ipapi.co/${ip}/json/`);
      const geolocationData = geoResponse.data;

      console.log(`${ip} geolocation data::::`, geolocationData);

      console.log(`Country: ${geolocationData.country_name}`);
      console.log(`City: ${geolocationData.city}`);
      console.log(`Latitude: ${geolocationData.latitude}`);
      console.log(`Longitude: ${geolocationData.longitude}`);

      return geolocationData;
    } catch (error) {
      console.error("Error fetching geolocation:", error);
      return null;
    }
  }

  public async saveAnalytics(cardId: string, interactor: Interactor, deviceInfo: DeviceInfo, interactionType: string, ipAddress: string, cardOwnerId: string): Promise<Interaction> {

    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      throw new HttpException(400, "invalid", "Invalid Card ID");
    }

    if (!mongoose.Types.ObjectId.isValid(cardOwnerId)) {
      throw new HttpException(400, "invalid", "Invalid UID");
    }

    const cardExists = await this.card.findById(cardId)
    if (!cardExists) {
      throw new HttpException(400, "not_found", "Card not found");
    }

    const userExists = await this.user.findById(cardOwnerId)
    if (!userExists) {
      throw new HttpException(400, "not_found", "User not found");
    }

    const geoData: Geolocation | null = await this.getGeolocation(ipAddress);

    const user: Interactor = {
      isWonderCardUser: interactor.isWonderCardUser,
      uid: interactor.isWonderCardUser ? interactor.uid : '000000',
      fullName: interactor.isWonderCardUser ? interactor.fullName : 'Anonymous'
    };


    const interaction = await this.model.create({
      cardId,
      interactionType,
      ipAddress,
      geolocation: geoData,
      deviceInfo,
      interactor: user,
      cardOwnerId
    })

    return interaction
  }

  public async getAnalytics(cardId: string, period: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      throw new HttpException(400, "invalid", "Invalid Card ID");
    }

    const cardObjectId = new mongoose.Types.ObjectId(cardId);

    const startDate = this.getStartOfPeriod(period as "day" | "week" | "month" | "year");

    console.log("Start Date:", startDate);
    console.log("Card ID:", cardObjectId);

    const analytics = await this.model.aggregate([
      { $match: { cardId: cardObjectId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalInteractions: { $sum: 1 },
          views: { $sum: { $cond: [{ $eq: ["$interactionType", "view"] }, 1, 0] } },
          shares: { $sum: { $cond: [{ $eq: ["$interactionType", "share"] }, 1, 0] } },
          saves: { $sum: { $cond: [{ $eq: ["$interactionType", "save"] }, 1, 0] } },
          uniqueUsers: { $addToSet: "$interactor.uid" },
          deviceDistribution: { $push: "$deviceInfo.device" },
          browserDistribution: { $push: "$deviceInfo.agent" },
          osDistribution: { $push: "$deviceInfo.os" },
          regionDistribution: { $push: "$geolocation.region" },
          countryDistribution: { $push: "$geolocation.country" },
          interactorDistribution: { $push: "$interactor.isWonderCardUser" },
          createdAt: { $push: "$createdAt" },
        },
      },
      {
        $project: {
          totalInteractions: 1,
          views: 1,
          shares: 1,
          saves: 1,
          uniqueUserCount: { $size: "$uniqueUsers" },
          deviceDistribution: 1,
          browserDistribution: 1,
          osDistribution: 1,
          regionDistribution: 1,
          countryDistribution: 1,
          interactorDistribution: 1,
          createdAt: 1,
        },
      },
      {
        $addFields: {
          deviceDistributionWithCounts: {
            $map: {
              input: { $setUnion: ["$deviceDistribution", []] },
              as: "device",
              in: {
                device: "$$device",
                count: { $size: { $filter: { input: "$deviceDistribution", as: "d", cond: { $eq: ["$$d", "$$device"] } } } },
                percentage: { $multiply: [{ $divide: [{ $size: { $filter: { input: "$deviceDistribution", as: "d", cond: { $eq: ["$$d", "$$device"] } } } }, "$totalInteractions"] }, 100] }
              },
            },
          },
          browserDistributionWithCounts: {
            $map: {
              input: { $setUnion: ["$browserDistribution", []] },
              as: "browser",
              in: {
                browser: "$$browser",
                count: { $size: { $filter: { input: "$browserDistribution", as: "b", cond: { $eq: ["$$b", "$$browser"] } } } },
                percentage: { $multiply: [{ $divide: [{ $size: { $filter: { input: "$browserDistribution", as: "b", cond: { $eq: ["$$b", "$$browser"] } } } }, "$totalInteractions"] }, 100] }
              },
            },
          },
          osDistributionWithCounts: {
            $map: {
              input: { $setUnion: ["$osDistribution", []] },
              as: "os",
              in: {
                os: "$$os",
                count: { $size: { $filter: { input: "$osDistribution", as: "o", cond: { $eq: ["$$o", "$$os"] } } } },
                percentage: { $multiply: [{ $divide: [{ $size: { $filter: { input: "$osDistribution", as: "o", cond: { $eq: ["$$o", "$$os"] } } } }, "$totalInteractions"] }, 100] }
              },
            },
          },
          regionDistributionWithCounts: {
            $map: {
              input: { $setUnion: ["$regionDistribution", []] },
              as: "region",
              in: {
                region: "$$region",
                count: { $size: { $filter: { input: "$regionDistribution", as: "r", cond: { $eq: ["$$r", "$$region"] } } } },
                percentage: { $multiply: [{ $divide: [{ $size: { $filter: { input: "$regionDistribution", as: "r", cond: { $eq: ["$$r", "$$region"] } } } }, "$totalInteractions"] }, 100] }
              },
            },
          },
          countryDistributionWithCounts: {
            $map: {
              input: { $setUnion: ["$countryDistribution", []] },
              as: "country",
              in: {
                country: "$$country",
                count: { $size: { $filter: { input: "$countryDistribution", as: "c", cond: { $eq: ["$$c", "$$country"] } } } },
                percentage: { $multiply: [{ $divide: [{ $size: { $filter: { input: "$countryDistribution", as: "c", cond: { $eq: ["$$c", "$$country"] } } } }, "$totalInteractions"] }, 100] }
              },
            },
          },
          interactorDistributionWithCounts: {
            $map: {
              input: { $setUnion: ["$interactorDistribution", []] },
              as: "interactor",
              in: {
                interactor: "$$interactor",
                count: { $size: { $filter: { input: "$interactorDistribution", as: "i", cond: { $eq: ["$$i", "$$interactor"] } } } },
                percentage: { $multiply: [{ $divide: [{ $size: { $filter: { input: "$interactorDistribution", as: "i", cond: { $eq: ["$$i", "$$interactor"] } } } }, "$totalInteractions"] }, 100] }
              },
            },
          },
        },
      },
    ]);

    return analytics;
  }

  public async getAllUserCardsAnalytics(userId: string) {

    const lastMonthStartDate = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEndDate = endOfMonth(subMonths(new Date(), 1));

    const analytics: any = {};

    const totalViews = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'view',
    });

    const totalShares = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'share',
    });

    const totalContacts = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'contact',
    });

    const totalPhone = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'phone',
    });

    const totalEmail = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'email',
    });

    const totalConnection = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'connection',
    });

    const totalQRCode = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'QRCode',
    });

    const totalSocialLink = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'socialLink',
    });

    analytics.totalViews = totalViews;
    analytics.totalShares = totalShares;
    analytics.totalContacts = totalContacts;
    analytics.totalPhone = totalPhone;
    analytics.totalEmail = totalEmail;
    analytics.totalConnection = totalConnection;
    analytics.totalQRCode = totalQRCode;
    analytics.totalSocialLink = totalSocialLink;

    analytics.deviceDistribution = await this.getDeviceInfoForAllUserDistribution(userId);
    analytics.deviceUserAgent = await this.getAgentDistributionOfAllUserCards(userId);
    analytics.getGeoDistribution = await this.getGeoDistributionOfAllUserCards(userId);

    analytics.topPerformingCards = await this.getTopPerformingCardsOfUser(userId)


    const lastMonthViews = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'view',
      createdAt: { $gte: lastMonthStartDate, $lte: lastMonthEndDate },
    });

    const lastMonthShares = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'share',
      createdAt: { $gte: lastMonthStartDate, $lte: lastMonthEndDate },
    });

    const lastMonthContacts = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'contact',
      createdAt: { $gte: lastMonthStartDate, $lte: lastMonthEndDate },
    });

    const lastMonthPhone = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'phone',
      createdAt: { $gte: lastMonthStartDate, $lte: lastMonthEndDate },
    });

    const lastMonthEmail = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'email',
      createdAt: { $gte: lastMonthStartDate, $lte: lastMonthEndDate },
    });

    const lastMonthConnection = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'connection',
      createdAt: { $gte: lastMonthStartDate, $lte: lastMonthEndDate },
    });

    const lastMonthQRCode = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'QRCode',
      createdAt: { $gte: lastMonthStartDate, $lte: lastMonthEndDate },
    });

    const lastMonthSocialLink = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'socialLink',
      createdAt: { $gte: lastMonthStartDate, $lte: lastMonthEndDate },
    });

    analytics.comparison = {
      views: {
        current: totalViews,
        lastMonth: lastMonthViews,
        difference: totalViews - lastMonthViews,
      },
      shares: {
        current: totalShares,
        lastMonth: lastMonthShares,
        difference: totalShares - lastMonthShares,
      },
      contacts: {
        current: totalContacts,
        lastMonth: lastMonthContacts,
        difference: totalContacts - lastMonthContacts,
      },
      phone: {
        current: totalPhone,
        lastMonth: lastMonthPhone,
        difference: totalPhone - lastMonthPhone,
      },
      email: {
        current: totalEmail,
        lastMonth: lastMonthEmail,
        difference: totalEmail - lastMonthEmail,
      },
      connection: {
        current: totalConnection,
        lastMonth: lastMonthConnection,
        difference: totalConnection - lastMonthConnection,
      },
      QRCode: {
        current: totalQRCode,
        lastMonth: lastMonthQRCode,
        difference: totalQRCode - lastMonthQRCode,
      },
      socialLink: {
        current: totalSocialLink,
        lastMonth: lastMonthSocialLink,
        difference: totalSocialLink - lastMonthSocialLink,
      }
    };

    analytics.interactionCounts = await this.getTotalInteractionCountOfAllUserCards(userId);

    return analytics;
  }

  private async getGeoDistributionOfAllUserCards(userId: string) {
    const analytics: any = {
      geoDistributionByCountry: [],
      geoDistributionByContinent: [],
    };

    let matchCriteria: any = { cardOwnerId: userId };

    if (Types.ObjectId.isValid(userId)) {
      matchCriteria = { cardOwnerId: new Types.ObjectId(userId) };
    }


    const geoAggregation = await this.model.aggregate([
      {
        $match: {
          ...matchCriteria,
          "geolocation.country": { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            country: "$geolocation.country_name",
            continent_code: "$geolocation.continent_code"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);


    if (!geoAggregation.length) {
      throw new HttpException(404, 'geo data', 'no analytics found')
    }

    const totalInteractions = geoAggregation.reduce((sum, item) => sum + item.count, 0);

    const continentCodeMap = {
      AF: "Africa",
      AN: "Antarctica",
      AS: "Asia",
      EU: "Europe",
      NA: "North America",
      OC: "Oceania",
      SA: "South America",
    };

    const geoDistributionByCountry = geoAggregation.map((item: any) => {
      const { country, continent_code } = item._id;
      return {
        country,
        continent: continentCodeMap[continent_code] || "Unknown",
        count: item.count,
        percentage: ((item.count / totalInteractions) * 100).toFixed(2),
      };
    });

    console.log("Country Distribution:", geoDistributionByCountry);

    const geoDistributionByContinent = geoDistributionByCountry.reduce((acc: any, item: any) => {
      const { continent, count } = item;
      if (!acc[continent]) {
        acc[continent] = { continent, count: 0 };
      }
      acc[continent].count += count;
      return acc;
    }, {});

    Object.keys(geoDistributionByContinent).forEach((continent) => {
      const data = geoDistributionByContinent[continent];
      data.percentage = ((data.count / totalInteractions) * 100).toFixed(2);
    });

    console.log("Continent Distribution:", geoDistributionByContinent);

    analytics.geoDistributionByCountry = geoDistributionByCountry;
    analytics.geoDistributionByContinent = Object.values(geoDistributionByContinent);

    return analytics
  }

  private async getDeviceInfoForAllUserDistribution(userId: string) {
    const analytics: any = {
      deviceInfoDistribution: [],
    };

    let matchCriteria: any = { cardOwnerId: userId };

    if (Types.ObjectId.isValid(userId)) {
      matchCriteria = { cardOwnerId: new Types.ObjectId(userId) };
    }

    const deviceInfoAggregation = await this.model.aggregate([
      {
        $match: {
          ...matchCriteria,
          "deviceInfo.agent": { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            os: "$deviceInfo.os",
            device: "$deviceInfo.device",
            agent: "$deviceInfo.agent",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    if (!deviceInfoAggregation.length) {
      throw new HttpException(404, "device info", "No device info analytics found");
    }

    const totalInteractions = deviceInfoAggregation.reduce(
      (sum, item) => sum + item.count,
      0
    );

    const deviceInfoDistribution = deviceInfoAggregation.map((item: any) => {
      const { os, device } = item._id;
      return {
        os: os || "Unknown OS",
        device: device || "Unknown Device",
        count: item.count,
        percentage: ((item.count / totalInteractions) * 100).toFixed(2),
      };
    });

    console.log("Device Info Distribution:", deviceInfoDistribution); // Debug log

    analytics.deviceInfoDistribution = deviceInfoDistribution;

    return analytics;
  }

  private async getAgentDistributionOfAllUserCards(userId: string) {
    const analytics: any = {
      agentDistribution: [],
    };

    let matchCriteria: any = { cardOwnerId: userId };

    if (Types.ObjectId.isValid(userId)) {
      matchCriteria = { cardOwnerId: new Types.ObjectId(userId) };
    }

    const agentAggregation = await this.model.aggregate([
      {
        $match: {
          ...matchCriteria,
          "deviceInfo.agent": { $exists: true },
        }
      },
      {
        $group: {
          _id: {
            agent: "$deviceInfo.agent",
          },
          count: { $sum: 1 },
        }
      },
      { $sort: { count: -1 } }
    ]);

    if (!agentAggregation.length) {
      throw new HttpException(404, 'agent data', 'No agent analytics found');
    }

    const totalInteractions = agentAggregation.reduce((sum, item) => sum + item.count, 0);

    const agentDistribution = agentAggregation.map((item: any) => {
      const { agent } = item._id;
      const count = item.count;
      const percentage = ((count / totalInteractions) * 100).toFixed(2);

      return {
        agent: agent || "Unknown Agent",
        count,
        percentage,
      };
    });

    analytics.agentDistribution = agentDistribution;

    return analytics;
  }

  private async getTopPerformingCardsOfUser(userId: string, topN: number = 5) {
    const analytics: any = {
      topPerformingCards: [],
    };

    let matchCriteria: any = { cardOwnerId: userId };

    if (Types.ObjectId.isValid(userId)) {
      matchCriteria = { cardOwnerId: new Types.ObjectId(userId) };
    }

    const cardAggregation = await this.model.aggregate([
      {
        $match: {
          ...matchCriteria,
          "interactionType": { $exists: true },
        },
      },
      {
        $lookup: {
          from: 'cards',
          localField: 'cardId',
          foreignField: '_id',
          as: 'cardDetails',
        },
      },
      {
        $unwind: {
          path: '$cardDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$cardId",
          cardName: { $first: "$cardDetails.cardName" },
          interactionCount: { $sum: 1 },
          interactionTypes: {
            $push: "$interactionType",
          },
        },
      },
      {
        $addFields: {
          interactionCountsByType: {
            $map: {
              input: {
                $setUnion: ["$interactionTypes", []],
              },
              as: "type",
              in: {
                type: "$$type",
                count: {
                  $size: {
                    $filter: {
                      input: "$interactionTypes",
                      as: "interaction",
                      cond: { $eq: ["$$interaction", "$$type"] },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $sort: { interactionCount: -1 },
      },
      { $limit: topN },
    ]);

    if (!cardAggregation.length) {
      throw new HttpException(404, 'top performing cards', 'No top-performing cards found');
    }

    const topPerformingCards = cardAggregation.map((item: any) => {
      const interactionTotal = item.interactionCount;
      const interactionCountsByType = item.interactionCountsByType || [];

      const percentage = ((item.interactionCount / cardAggregation.reduce((sum, item) => sum + item.interactionCount, 0)) * 100).toFixed(2);

      return {
        cardId: item._id,
        cardName: item.cardName,
        interactionCount: item.interactionCount,
        percentage: percentage,
        interactionTypes: interactionCountsByType,
      };
    });

    analytics.topPerformingCards = topPerformingCards;

    return analytics;
  }

  private async getTotalInteractionCountOfAllUserCards(userId: string) {
    let matchCriteria: any = { cardOwnerId: userId };

    if (Types.ObjectId.isValid(userId)) {
      matchCriteria = { cardOwnerId: new Types.ObjectId(userId) };
    }

    const totalInteractionAggregation = await this.model.aggregate([
      {
        $match: {
          ...matchCriteria,
          "interactionType": { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          totalInteractions: { $sum: 1 },
        },
      },
    ]);

    if (!totalInteractionAggregation.length) {
      return { totalInteractions: 0 };
    }

    return {
      totalInteractions: totalInteractionAggregation[0].totalInteractions,
    };
  }

  public async getUserCardAnalyticsByTimePeriod(userId: string, timePeriod: string) {
    const { startDate, endDate } = this.getDateRangeForTimePeriod(timePeriod);

    const analytics: any = {};

    const totalViews = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'view',
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const totalShares = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'share',
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const totalContacts = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'contact',
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const totalPhone = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'phone',
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const totalEmail = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'email',
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const totalConnection = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'connection',
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const totalQRCode = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'QRCode',
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const totalSocialLink = await this.model.countDocuments({
      cardOwnerId: userId,
      interactionType: 'socialLink',
      createdAt: { $gte: startDate, $lte: endDate },
    });

    analytics.totalViews = totalViews;
    analytics.totalShares = totalShares;
    analytics.totalContacts = totalContacts;
    analytics.totalPhone = totalPhone;
    analytics.totalEmail = totalEmail;
    analytics.totalConnection = totalConnection;
    analytics.totalQRCode = totalQRCode;
    analytics.totalSocialLink = totalSocialLink;

    analytics.deviceDistribution = await this.getDeviceInfoForAllUserDistribution(userId);
    analytics.deviceUserAgent = await this.getAgentDistributionOfAllUserCards(userId);
    analytics.getGeoDistribution = await this.getGeoDistributionOfAllUserCards(userId);

    analytics.topPerformingCards = await this.getTopPerformingCardsOfUser(userId);

    analytics.interactionCounts = await this.getTotalInteractionCountOfAllUserCards(userId);

    return analytics;
  }

  public async getUserCardAnalytics(userId: string, cardId: string) {
    try {
      const lastMonthStartDate = startOfMonth(subMonths(new Date(), 1));
      const lastMonthEndDate = endOfMonth(subMonths(new Date(), 1));

      const interactionTypes = [
        'view', 'share', 'contact', 'phone', 'email', 'connection', 'QRCode', 'socialLink'
      ];

      const analytics: any = {};

      const countDocuments = async (interactionType: string, startDate?: Date, endDate?: Date) => {
        const query: any = {
          cardOwnerId: userId,
          cardId,
          interactionType,
        };

        if (startDate && endDate) query.createdAt = { $gte: startDate, $lte: endDate };

        return this.model.countDocuments(query);
      };

      const currentPeriodCounts: any = {};
      const lastMonthCounts: any = {};
      for (const type of interactionTypes) {
        currentPeriodCounts[type] = await countDocuments(type);
        lastMonthCounts[type] = await countDocuments(type, lastMonthStartDate, lastMonthEndDate);
      }

      analytics.totalInteractions = Object.keys(currentPeriodCounts).reduce((acc, type) => {
        acc[type] = {
          current: currentPeriodCounts[type],
          lastMonth: lastMonthCounts[type],
          difference: currentPeriodCounts[type] - lastMonthCounts[type],
        };
        return acc;
      }, {});

      analytics.deviceDistribution = await this.getDeviceInfoForSingleCardDistribution(userId, cardId);
      analytics.deviceUserAgent = await this.getAgentDistributionOfSingleCard(userId, cardId);
      analytics.geoDistribution = await this.getGeoDistributionOfSingleCard(userId, cardId);
      analytics.interactionCounts = await this.getTotalInteractionCountOfSingleCard(userId, cardId);

      return analytics;
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return null;
    }
  }

  private async getDeviceInfoForSingleCardDistribution(userId: string, cardId: string): Promise<any> {
    try {
      const deviceDistribution = await this.model.aggregate([
        { $match: { cardOwnerId: userId, cardId } },
        {
          $group: {
            _id: {
              os: "$deviceInfo.os",
              device: "$deviceInfo.device",
              agent: "$deviceInfo.agent",
            }, count: { $sum: 1 }
          }
        },
      ]);
      return deviceDistribution;
    } catch (error) {
      console.error("Error fetching device distribution for single card:", error);
      return null;
    }
  }

  private async getAgentDistributionOfSingleCard(userId: string, cardId: string): Promise<any> {
    try {
      const agentDistribution = await this.model.aggregate([
        { $match: { cardOwnerId: userId, cardId } },
        { $group: { _id: "$userAgent", count: { $sum: 1 } } },
      ]);
      return agentDistribution;
    } catch (error) {
      console.error("Error fetching user agent distribution for single card:", error);
      return null;
    }
  }

  private async getGeoDistributionOfSingleCard(userId: string, cardId: string): Promise<any> {
    try {
      const geoDistribution = await this.model.aggregate([
        { $match: { cardOwnerId: userId, cardId } },
        { $group: { _id: "$location", count: { $sum: 1 } } },
      ]);
      return geoDistribution;
    } catch (error) {
      console.error("Error fetching geo distribution for single card:", error);
      return null;
    }
  }

  private async getTotalInteractionCountOfSingleCard(userId: string, cardId: string): Promise<any> {
    try {
      const interactionCounts = await this.model.aggregate([
        { $match: { cardOwnerId: userId, cardId } },
        { $group: { _id: "$interactionType", count: { $sum: 1 } } },
      ]);
      const formattedCounts = interactionCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});
      return formattedCounts;
    } catch (error) {
      console.error("Error fetching total interaction counts for single card:", error);
      return null;
    }
  }

}

export default InteractionService