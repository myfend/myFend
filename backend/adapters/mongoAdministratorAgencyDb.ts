import {
  AdministratorAgencyDb,
  AgencyStoreInput,
} from "../controllers/administratorAgency";
import { Agency } from "../controllers/agency";
import AgencyModel from "../database/models/agency";
import agency from "../database/models/agency";

export class MongoAdministratorAgencyDb implements AdministratorAgencyDb {
  async search(query: string): Promise<Agency[]> {
    const agencies = await AgencyModel.aggregate([
      {
        $match: {
          $or: [{ email: { $regex: query } }, { name: { $regex: query } }],
        },
      },
      { $limit: 8 },
    ]);
    return agencies.map((agency) => ({
      id: agency._id.toString(),
      email: agency.email,
      number: agency.number,
      name: agency.name,
      description: agency.description,
    }));
  }
  async store(input: AgencyStoreInput): Promise<Agency> {
    const agency = await AgencyModel.create(input);
    if (!agency) throw new Error("Agency not found");

    return agency.toAgency();
  }
}
