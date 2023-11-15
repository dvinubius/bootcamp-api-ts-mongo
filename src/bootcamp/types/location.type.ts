export interface Location {
  type: string;
  coordinates: [number, number];
  formattedAddress: string;
  street: string;
  city: string;
  zipcode: string;
  country: string;
}
