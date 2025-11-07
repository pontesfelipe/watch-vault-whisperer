export interface Watch {
  brand: string;
  model: string;
  dialColor: string;
  type: string;
  monthlyWear: number[];
  total: number;
  cost: number;
}

export interface Trip {
  id: string;
  startDate: string;
  location: string;
  watch: string | string[];
  days: number;
  purpose: string;
}

export interface Event {
  id: string;
  startDate: string;
  location: string;
  watch: string | string[];
  days: number;
  purpose: string;
}
