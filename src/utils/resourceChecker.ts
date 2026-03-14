import { HOSPITALS } from '../data/hospitalData';
import type { Hospital } from '../data/hospitalData';

export interface ResourceResult {
  required: string;
  available: boolean;
  detail: string;
}

export interface CheckResult {
  allAvailable: boolean;
  doctorResults: ResourceResult[];
  medicationResults: ResourceResult[];
  equipmentResults: ResourceResult[];
  icuAvailable: boolean;
  missingDoctors: ResourceResult[];
  missingMedications: ResourceResult[];
  missingEquipment: ResourceResult[];
  missingCount: number;
}

export function checkResourceAvailability(
  currentHospitalId: string,
  requiredDoctors: string[],
  requiredMedications: string[],
  requiredEquipment: string[],
  requiresICU: boolean
): CheckResult {
  const hospital = HOSPITALS.find(h => h.id === currentHospitalId)!;

  const doctorResults: ResourceResult[] = requiredDoctors.map(specialty => {
    const found = hospital.doctors.find(d => d.specialty.toLowerCase().includes(specialty.toLowerCase()) && d.available);
    return { required: specialty, available: !!found, detail: found ? `${found.name}` : 'Not available' };
  });

  const medicationResults: ResourceResult[] = requiredMedications.map(med => {
    const found = hospital.medications.find(m => m.name.toLowerCase().includes(med.toLowerCase()) && m.inStock);
    return { required: med, available: !!found, detail: found ? `In Stock (${found.quantity} units)` : 'OUT OF STOCK' };
  });

  const equipmentResults: ResourceResult[] = requiredEquipment.map(eq => {
    const found = hospital.equipment.find(e => e.name.toLowerCase().includes(eq.toLowerCase()) && e.available && !e.occupied);
    const occupied = hospital.equipment.find(e => e.name.toLowerCase().includes(eq.toLowerCase()) && e.available && e.occupied);
    if (found) return { required: eq, available: true, detail: 'Available' };
    if (occupied) return { required: eq, available: false, detail: 'OCCUPIED (in use)' };
    return { required: eq, available: false, detail: 'Not Available' };
  });

  const icuAvailable = requiresICU ? hospital.beds.icuOccupied < hospital.beds.icu : true;

  const missingDoctors = doctorResults.filter(r => !r.available);
  const missingMedications = medicationResults.filter(r => !r.available);
  const missingEquipment = equipmentResults.filter(r => !r.available);

  return {
    allAvailable: doctorResults.every(r => r.available) && medicationResults.every(r => r.available) && equipmentResults.every(r => r.available) && icuAvailable,
    doctorResults, medicationResults, equipmentResults, icuAvailable,
    missingDoctors, missingMedications, missingEquipment,
    missingCount: missingDoctors.length + missingMedications.length + missingEquipment.length + (icuAvailable ? 0 : 1),
  };
}

export function findBestAlternativeHospital(
  missingDoctors: string[], missingMedications: string[], missingEquipment: string[], currentHospitalId: string
): Hospital | null {
  const others = HOSPITALS.filter(h => h.id !== currentHospitalId);
  const scored = others.map(hospital => {
    let score = 0;
    missingDoctors.forEach(s => { if (hospital.doctors.some(d => d.specialty.toLowerCase().includes(s.toLowerCase()) && d.available)) score += 3; });
    missingMedications.forEach(m => { if (hospital.medications.some(med => med.name.toLowerCase().includes(m.toLowerCase()) && med.inStock)) score += 2; });
    missingEquipment.forEach(e => { if (hospital.equipment.some(eq => eq.name.toLowerCase().includes(e.toLowerCase()) && eq.available && !eq.occupied)) score += 2; });
    return { hospital, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 ? scored[0].hospital : null;
}
