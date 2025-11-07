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
  watch: Record<string, number>; // { "Rolex Submariner": 6, "Omega Speedmaster": 4 }
  days: number;
  purpose: string;
}

export interface Event {
  id: string;
  startDate: string;
  location: string;
  watch: Record<string, number>;
  days: number;
  purpose: string;
}
