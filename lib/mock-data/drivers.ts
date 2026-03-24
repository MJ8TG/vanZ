export type DriverStatus = "pending" | "approved" | "rejected";

export interface DriverApplication {
  id: string;
  status: DriverStatus;
  createdAt: string;
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  cin: string;
  dob: string;
  cinExpiry: string;
  vehicleType: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  plate: string;
  capacity: string;
  cinFrontUploaded: boolean;
  cinBackUploaded: boolean;
  docCarteGrise: boolean;
  docAssurance: boolean;
  docPermis: boolean;
  docVisite: boolean;
  docVehicle: boolean;
}

export const mockDrivers: DriverApplication[] = [
  {
    id: "drv_101",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    phone: "22334455",
    firstName: "Ahmed",
    lastName: "Ben Ali",
    email: "ahmed.benali@example.com",
    city: "Tunis",
    cin: "01234567",
    dob: "1990-05-15",
    cinExpiry: "2028-05-15",
    vehicleType: "van",
    brand: "Renault",
    model: "Kangoo",
    year: "2018",
    color: "Blanc",
    plate: "185 TN 4050",
    capacity: "800",
    cinFrontUploaded: true,
    cinBackUploaded: true,
    docCarteGrise: true,
    docAssurance: true,
    docPermis: true,
    docVisite: false,
    docVehicle: true,
  },
  {
    id: "drv_102",
    status: "approved",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    phone: "98765432",
    firstName: "Sami",
    lastName: "Trabelsi",
    email: "",
    city: "Sousse",
    cin: "07654321",
    dob: "1985-11-20",
    cinExpiry: "2026-10-10",
    vehicleType: "lightTruck",
    brand: "Isuzu",
    model: "D-Max",
    year: "2020",
    color: "Gris",
    plate: "210 TN 8090",
    capacity: "1200",
    cinFrontUploaded: true,
    cinBackUploaded: true,
    docCarteGrise: true,
    docAssurance: true,
    docPermis: true,
    docVisite: true,
    docVehicle: true,
  },
  {
    id: "drv_103",
    status: "rejected",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    phone: "55443322",
    firstName: "Amine",
    lastName: "Gharbi",
    email: "amine.g@example.com",
    city: "Sfax",
    cin: "09871234",
    dob: "1998-02-10",
    cinExpiry: "2025-01-01",
    vehicleType: "sedan",
    brand: "Peugeot",
    model: "301",
    year: "2015",
    color: "Noir",
    plate: "170 TN 3020",
    capacity: "400",
    cinFrontUploaded: true,
    cinBackUploaded: true,
    docCarteGrise: true,
    docAssurance: false, // Missing required doc
    docPermis: true,
    docVisite: false,
    docVehicle: false,
  },
  {
    id: "drv_104",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    phone: "21998877",
    firstName: "Mehdi",
    lastName: "Jaziri",
    email: "",
    city: "Bizerte",
    cin: "06554433",
    dob: "1992-08-30",
    cinExpiry: "2029-07-20",
    vehicleType: "utility",
    brand: "Fiat",
    model: "Fiorino",
    year: "2019",
    color: "Bleu",
    plate: "200 TN 5060",
    capacity: "600",
    cinFrontUploaded: true,
    cinBackUploaded: true,
    docCarteGrise: true,
    docAssurance: true,
    docPermis: true,
    docVisite: true,
    docVehicle: false,
  }
];
