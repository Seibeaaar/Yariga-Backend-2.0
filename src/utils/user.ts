import Agreement from "@/models/Agreement";
import Property from "@/models/Property";
import { AGREEMENT_STATUS, AGREEMENT_TYPE } from "@/types/agreement";
import { UserDocument, User } from "@/types/user";

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

  const agreementsTotal = await Agreement.aggregate([
    {
      $match: {
        landlord: user.id,
        status: AGREEMENT_STATUS.Accepted,
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  return {
    propertiesForRent,
    propertiesForSale,
    agreementsTotal,
    tenantsCount: user.tenants?.length,
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
    joinedAt: user.joinedAt,
  };
};
