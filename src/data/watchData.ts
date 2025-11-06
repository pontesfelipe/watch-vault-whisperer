import { Watch, Trip, Event } from "@/types/watch";

export const watches: Watch[] = [
  {
    brand: "Baltic",
    model: "Tricompax Tour Auto",
    dialColor: "Ivory",
    type: "Chronograph",
    monthlyWear: [1, 2, 2, 3, 0, 2, 1, 1, 3, 1, 0, 0],
    total: 16,
    cost: 1200
  },
  {
    brand: "Breitling",
    model: "Navitimer GMT",
    dialColor: "Ice Blue",
    type: "Pilot/GMT",
    monthlyWear: [1, 3, 2, 4, 1, 4, 2, 1, 2, 2, 0.5, 0],
    total: 22.5,
    cost: 8500
  },
  {
    brand: "Breitling",
    model: "Superocean Heritage",
    dialColor: "Green",
    type: "Diver",
    monthlyWear: [1, 3, 6, 3, 2, 1, 2, 2, 3, 3, 1, 0],
    total: 27,
    cost: 5200
  },
  {
    brand: "Casio",
    model: "Databank",
    dialColor: "Black",
    type: "Digital/Fun",
    monthlyWear: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.5, 0],
    total: 1.5,
    cost: 45
  },
  {
    brand: "Longines",
    model: "Legend Diver Bronze",
    dialColor: "Green",
    type: "Diver/Field on NATO",
    monthlyWear: [2, 2, 3, 1, 8, 4, 1.5, 1, 2, 2, 0, 0],
    total: 26.5,
    cost: 3800
  },
  {
    brand: "Swatch",
    model: "Moonswatch Earth",
    dialColor: "Blue",
    type: "Chronograph/Fun",
    monthlyWear: [0, 0, 1, 1, 1, 0, 0, 0, 2, 0.5, 0, 0],
    total: 5.5,
    cost: 260
  },
  {
    brand: "Swatch",
    model: "Moonswatch Saturn",
    dialColor: "Brown",
    type: "Chronograph/Fun",
    monthlyWear: [1, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0],
    total: 5,
    cost: 260
  },
  {
    brand: "Omega",
    model: "Aqua Terra Beijing Winter Olympic Games 2022",
    dialColor: "White",
    type: "Sport Casual",
    monthlyWear: [0, 0, 2, 3, 3, 2, 7, 7.5, 1, 2.5, 1, 0],
    total: 29,
    cost: 8900
  },
  {
    brand: "Omega",
    model: "Speedmaster Moonwatch Pro (Sapphire)",
    dialColor: "Black",
    type: "Chronograph",
    monthlyWear: [2, 2, 2, 2, 1, 2, 2, 1, 3, 1, 1, 0],
    total: 19,
    cost: 7100
  },
  {
    brand: "Omega",
    model: "Speedmaster '57",
    dialColor: "Green",
    type: "Chronograph",
    monthlyWear: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    total: 0,
    cost: 8200
  },
  {
    brand: "Omega",
    model: "Seamaster 300",
    dialColor: "Blue",
    type: "Diver",
    monthlyWear: [1, 3, 2, 3, 3, 4, 2.5, 5, 1, 2.5, 0, 0],
    total: 27,
    cost: 7800
  },
  {
    brand: "ORIS",
    model: "Artelier Pointer Day Date",
    dialColor: "Grey",
    type: "Business casual",
    monthlyWear: [1, 2, 5, 2, 2, 2, 3, 2.5, 1, 2, 0, 0],
    total: 22.5,
    cost: 2400
  },
  {
    brand: "ORIS",
    model: "Propilot Coulson Ltd Edition",
    dialColor: "Red",
    type: "Pilot",
    monthlyWear: [1, 4, 2, 3, 4, 2, 1.5, 1, 3, 2, 0, 0],
    total: 23.5,
    cost: 2800
  },
  {
    brand: "IWC",
    model: "Mark XX",
    dialColor: "Green",
    type: "Pilot",
    monthlyWear: [0, 0, 3, 4, 6, 5, 3, 3, 2, 5.5, 1, 0],
    total: 32.5,
    cost: 5400
  },
  {
    brand: "Trafford",
    model: "Crossroads Season 3 Lantana",
    dialColor: "Orange",
    type: "Sport Casual",
    monthlyWear: [0, 0, 0, 0, 0, 2, 2.5, 1, 2, 1, 0, 0],
    total: 8.5,
    cost: 450
  },
  {
    brand: "Panerai",
    model: "Luminor Quaranta BiTempo Luna Rossa PAM 01404 GMT",
    dialColor: "Blue",
    type: "Sport Casual/GMT",
    monthlyWear: [0, 0, 0, 0, 0, 0, 0, 0, 4, 5, 0, 0],
    total: 9,
    cost: 12500
  },
  {
    brand: "Tag Heuer",
    model: "Carrera 5 Day Date",
    dialColor: "Ivory",
    type: "Business casual",
    monthlyWear: [2, 0, 1, 1, 0, 0, 1, 3, 1, 0, 0, 0],
    total: 9,
    cost: 3200
  }
];

export const trips: Trip[] = [
  { startDate: "3/9/25", location: "Sao Paulo, Brazil", watch: "Artelier Pointer Day Date", days: 5, purpose: "Business" },
  { startDate: "3/19/25", location: "Disney Cruise (Dream) - Florida/Bahamas", watch: "Superocean Heritage", days: 5, purpose: "Vacation" },
  { startDate: "3/31/25", location: "Bogota, Colombia", watch: "Tricompax Tour Auto", days: 4, purpose: "Business" },
  { startDate: "4/17/25", location: "Dallas, Texas", watch: "Aqua Terra Beijing Winter Olympic Games 2022", days: 2, purpose: "Business" },
  { startDate: "5/1/25", location: "Miami, Florida", watch: "Propilot Coulson Ltd Edition", days: 2, purpose: "Business" },
  { startDate: "5/4/25", location: "Boston, Massachusetts", watch: "Mark XX", days: 5, purpose: "Business" },
  { startDate: "5/11/25", location: "Sao Paulo, Brazil", watch: "Legend Diver Bronze", days: 6, purpose: "Business" },
  { startDate: "6/9/25", location: "Mexico City, Mexico", watch: "Mark XX", days: 4, purpose: "Business" },
  { startDate: "6/17/25", location: "New York, New York", watch: "Speedmaster Moonwatch Pro (Saphire)", days: 2, purpose: "Business" },
  { startDate: "6/25/25", location: "Dallas, Texas", watch: "Navitimer GMT", days: 2, purpose: "Business" },
  { startDate: "7/3/25", location: "Dallas, Texas", watch: "Aqua Terra Beijing Winter Olympic Games 2022", days: 4, purpose: "Vacation" },
  { startDate: "7/24/25", location: "Sao Paulo, Brazil", watch: "Artelier Pointer Day Date", days: 18, purpose: "Vacation" },
  { startDate: "8/11/25", location: "Miami, Florida", watch: "Mark XX", days: 3, purpose: "Business" },
  { startDate: "8/19/25", location: "New York, New York", watch: "Carrera 5 Day date", days: 2, purpose: "Business" },
  { startDate: "8/29/25", location: "Hyatt Rengency Lost Pines, TX (Labor Day)", watch: "Seamaster 300", days: 3, purpose: "Vacation" },
  { startDate: "9/1/25", location: "New York, New York", watch: "Speedmaster Moonwatch Pro (Saphire)", days: 2, purpose: "Business" },
  { startDate: "9/7/25", location: "Sao Paulo, Brazil", watch: "Luminor Quaranta BiTempo Luna Rossa PAM 01404 GMT", days: 5, purpose: "Business" },
  { startDate: "10/6/25", location: "Boston, Massachusetts", watch: "Luminor Quaranta BiTempo Luna Rossa PAM 01404 GMT", days: 3, purpose: "Business" },
  { startDate: "10/13/25", location: "Monterrey, Mexico City, Mexico", watch: "Mark XX", days: 5, purpose: "Business" },
  { startDate: "10/28/25", location: "Miami, Florida", watch: "Luminor Quaranta BiTempo Luna Rossa PAM 01404 GMT", days: 2, purpose: "Business" },
  { startDate: "11/9/25", location: "Miami, Florida", watch: "Luminor Quaranta BiTempo Luna Rossa PAM 01404 GMT", days: 4, purpose: "Business" }
];

export const events: Event[] = [
  { startDate: "7/4/25", location: "Dallas, Texas", watch: "Seamaster 300 with red rubber band", days: 0.5, purpose: "4th of July" },
  { startDate: "7/8/25", location: "Round Rock, Texas", watch: "Legend Diver Bronze", days: 0.5, purpose: "Dinner with friends at friends house" },
  { startDate: "7/18/25", location: "Austin, Texas", watch: "Superocean Heritage", days: 1, purpose: "Date night at the movies" },
  { startDate: "10/24/25", location: "Fredericksburg, Texas", watch: "Mark XX", days: 0.5, purpose: "Date night at Sirlania's birthday" },
  { startDate: "11/1/25", location: "Georgetown, Texas", watch: "Databank", days: 1.5, purpose: "Camping with the boys" }
];

export const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
