/**
 * Promoted to @/hooks/use-geolocation since the Vendor and Rider
 * modules now need live geolocation too (every real API scan call
 * requires latitude/longitude). Re-exported here so existing imports
 * in this module keep working.
 */
export { useGeolocation } from "@/hooks/use-geolocation";
