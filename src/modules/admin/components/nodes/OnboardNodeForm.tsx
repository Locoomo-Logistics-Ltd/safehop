"use client";

import { useState } from "react";
import { Card, Input, Button } from "@/components/ui";
import { useOnboardNode } from "@/modules/admin/hooks/use-onboard-node";
import { AddressGeocodeButton } from "@/components/maps/AddressGeocodeButton";
import { formatNigerianPhone, isValidE164 } from "@/lib/phone";
import {
  NodeHoursEditor,
  defaultHoursDraft,
  isHoursDraftValid,
  toOpeningHours,
} from "@/components/forms/NodeHoursEditor";

interface OnboardNodeFormProps {
  onClose: () => void;
}

/**
 * Inline "Add Node" form — POST /nodes, a real, confirmed route per
 * docs/API.md (Admin creates a Node directly, immediately `active`).
 * Fields match the route's required body exactly (name, address,
 * city, state, latitude, longitude, capacity; operatingHours
 * optional) — the previous version of this form only collected
 * name/address/contactPhone, none of which matches the real payload,
 * so it would have 400'd on every submit. No modal/dialog primitive
 * exists in `components/ui` yet, so this stays a plain inline card
 * rather than introducing one just for this single use.
 */
export function OnboardNodeForm({ onClose }: OnboardNodeFormProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [capacity, setCapacity] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  // const [operatingHours, setOperatingHours] = useState("");
  const { onboardNode, isSubmitting } = useOnboardNode();
  const [contactPhone, setContactPhone] = useState("");
const [hours, setHours] = useState(defaultHoursDraft);

  const phoneE164 = formatNigerianPhone(contactPhone);
const phoneOk = isValidE164(phoneE164);

const isValid =
  name.trim() &&
  address.trim() &&
  city.trim() &&
  state.trim() &&
  capacity.trim() &&
  latitude.trim() &&
  longitude.trim() &&
  phoneOk &&
  isHoursDraftValid(hours);

  const handleSubmit = () => {
  if (!phoneOk) return;
  onboardNode({
    name,
    address,
    city,
    state,
    capacity: Number(capacity),
    latitude: Number(latitude),
    longitude: Number(longitude),
    contactPhone: phoneE164,
    openingHours: toOpeningHours(hours),
  });
};

  return (
    <Card padding="md" className="mb-4 border-l-[3px] border-l-status-success">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-semibold text-text-primary">Add Node</p>
        <button type="button" onClick={onClose} className="text-[12px] text-text-muted hover:text-text-primary">
          Cancel
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <Input placeholder="Node name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
        <Input placeholder="Capacity (parcels)" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
       <Input
  placeholder="Contact phone (0803 123 4567)"
  type="tel"
  value={contactPhone}
  onChange={(e) => setContactPhone(e.target.value)}
  error={contactPhone && !phoneOk ? "Enter a valid phone number" : undefined}
/>
        <Input placeholder="Latitude" type="number" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
        <Input placeholder="Longitude" type="number" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
      </div>
      <div className="mb-3">
  <p className="text-[13px] font-medium text-text-secondary mb-2">Opening hours</p>
  <NodeHoursEditor value={hours} onChange={setHours} />
</div>
      <AddressGeocodeButton
        address={address}
        city={city}
        state={state}
        onResolved={(lat, lng) => {
          setLatitude(String(lat));
          setLongitude(String(lng));
        }}
      />
      <Button
        size="sm"
        disabled={!isValid}
        isLoading={isSubmitting}
        onClick={handleSubmit}
        className="bg-status-success hover:opacity-90 text-white"
      >
        Add Node
      </Button>
    </Card>
  );
}
