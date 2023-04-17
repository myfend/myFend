export interface Agency {
  id: string;
  name: string;
  website: string;
  number: string;
  description: string;
  email: string;
}

export interface AgencyFinder {
  find(agency: string): Promise<Agency>;
}

export default class AgencyController {}
