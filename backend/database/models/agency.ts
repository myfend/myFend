import { Schema, model, Types } from "mongoose";
import { Agency as AgencyData } from "../../controllers/agency";

interface Agency {
  _id: Types.ObjectId;
  number: string;
  name: string;
  description: string;
  email: string;
  toAgency(): AgencyData;
}

const schema = new Schema<Agency>(
  {
    number: String,
    name: String,
    description: String,
    email: String,
  },
  {
    timestamps: true,
    methods: {
      toAgency(): AgencyData {
        return {
          description: this.description,
          email: this.email,
          name: this.name,
          number: this.number,
          id: this._id.toString(),
        };
      },
    },
  }
);

const Agency = model<Agency>("Agency", schema);

export default Agency;
