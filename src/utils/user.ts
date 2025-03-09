import Agreement from "@/models/Agreement";
import Property from "@/models/Property";
import { AGREEMENT_STATUS, AGREEMENT_TYPE } from "@/types/agreement";
import { UserDocument, User } from "@/types/user";
import { castToObjectId, isDefined } from "./common";

export const getUserFullName = (user: UserDocument) =>
  `${user.firstName} ${user.lastName}`;

export const getLandlordStats = async (user: User) => {
  const properties = await Property.find({
    owner: user.id,
  });

  const propertiesForRent = properties.filter(
    (property) => property.agreementType === AGREEMENT_TYPE.Rent,
  ).length;
  const propertiesForSale = properties.filter(
    (property) => property.agreementType === AGREEMENT_TYPE.Sale,
  ).length;

  const userId = castToObjectId(user.id);

  const agreements = await Agreement.aggregate([
    {
      $match: {
        landlord: userId,
        status: AGREEMENT_STATUS.Accepted,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const agreementsAggregate = agreements[0];

  return {
    propertiesForRent,
    propertiesForSale,
    agreementsTotal: isDefined(agreementsAggregate)
      ? agreementsAggregate.total
      : 0,
    tenantsCount: isDefined(user.tenants) ? user.tenants.length : 0,
    agreementsCount: isDefined(agreementsAggregate)
      ? agreementsAggregate.count
      : 0,
  };
};

export const getTenantStats = async (user: User) => {
  const agreements = await Agreement.find({
    tenant: user.id,
    status: AGREEMENT_STATUS.Accepted,
  });

  const propertiesRented = agreements.filter(
    (agreement) => agreement.type === AGREEMENT_TYPE.Rent,
  ).length;
  const propertiesPurchased = agreements.filter(
    (agreement) => agreement.type === AGREEMENT_TYPE.Sale,
  ).length;
  const agreementsTotal = agreements.reduce(
    (acc, agreement) => acc + agreement.amount,
    0,
  );

  return {
    propertiesRented,
    propertiesPurchased,
    agreementsTotal,
    agreementsCount: agreements.length,
  };
};
