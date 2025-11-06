export interface Watch {
  brand: string;
  model: string;
  dialColor: string;
  type: string;
  monthlyWear: number[];
  total: number;
}

export interface Trip {
  startDate: string;
  location: string;
  watch: string;
  days: number;
  purpose: string;
}

export interface Event {
  startDate: string;
  location: string;
  watch: string;
  days: number;
  purpose: string;
}
