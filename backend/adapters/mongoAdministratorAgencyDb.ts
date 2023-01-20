import {
  AdministratorAgencyDb,
  AgencyStoreInput,
} from "../controllers/administratorAgency";
import { Agency } from "../controllers/agency";
import AgencyModel from "../database/models/agency";

export class MongoAdministratorAgencyDb implements AdministratorAgencyDb {
  async store(input: AgencyStoreInput): Promise<Agency> {
    const agency = await AgencyModel.create(input);
    if (!agency) throw new Error("Agency not found");

    return agency.toAgency();
  }
}
