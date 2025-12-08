export interface Watch {
  brand: string;
  model: string;
  dialColor: string;
  type: string;
  monthlyWear: number[];
  total: number;
  cost: number;
}

export interface LinkedWatch {
  watchId: string;
  brand: string;
  model: string;
  days: number;
}

export interface Trip {
  id: string;
  startDate: string;
  location: string;
  linkedWatches: LinkedWatch[];
  days: number;
  purpose: string;
  notes?: string;
}

export interface Event {
  id: string;
  startDate: string;
  location: string;
  linkedWatches: LinkedWatch[];
  days: number;
  purpose: string;
}
