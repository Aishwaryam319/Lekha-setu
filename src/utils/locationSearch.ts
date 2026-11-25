import districtsData from '../data/karnatakaDistricts.json';
import taluksData from '../data/karnatakaTaluks.json';
import departmentsData from '../data/governmentDepartments.json';
import officesData from '../data/officeLocations.json';
import {
  DepartmentDef,
  DepartmentId,
  DistrictDef,
  OfficeLocationDef,
  TalukDef,
} from '../types';

export const KARNATAKA_DEPARTMENTS = departmentsData as DepartmentDef[];
export const KARNATAKA_DISTRICTS = districtsData as DistrictDef[];
export const KARNATAKA_TALUKS = taluksData as TalukDef[];

export function getDepartmentById(id: DepartmentId | string): DepartmentDef | undefined {
  return KARNATAKA_DEPARTMENTS.find((d) => d.id === id);
}

export function getDistrictById(id: string): DistrictDef | undefined {
  return KARNATAKA_DISTRICTS.find((d) => d.id === id);
}

export function getTalukById(id: string): TalukDef | undefined {
  return KARNATAKA_TALUKS.find((t) => t.id === id);
}

export function getTaluksForDistrict(districtId: string): TalukDef[] {
  if (!districtId) return [];
  return KARNATAKA_TALUKS.filter((t) => t.districtId === districtId);
}

export function isValidDistrictTalukPair(districtId: string, talukId: string): boolean {
  if (!districtId || !talukId) return false;
  return KARNATAKA_TALUKS.some((t) => t.id === talukId && t.districtId === districtId);
}

export function getOfficesForSelection(
  departmentId: DepartmentId,
  districtId: string,
  talukId: string
): OfficeLocationDef[] {
  if (!departmentId || !districtId) return [];

  if (departmentId === 'tahsildar_office') {
    if (!talukId) return [];
    const taluk = getTalukById(talukId);
    if (!taluk || taluk.districtId !== districtId) return [];
    return [
      {
        id: `tahsildar_${taluk.id}`,
        departmentId: 'tahsildar_office',
        districtId,
        talukId,
        nameEn: `Office of the Tahsildar, ${taluk.nameEn}`,
        nameKn: `ತಹಶೀಲ್ದಾರ್ ಕಚೇರಿ, ${taluk.nameKn}`,
      },
    ];
  }

  if (departmentId === 'city_corporation') {
    return officesData.cityCorporations
      .filter((c) => c.districtId === districtId)
      .map((c) => ({
        ...c,
        departmentId: 'city_corporation' as DepartmentId,
      }));
  }

  if (departmentId === 'rto') {
    return officesData.rtoOffices
      .filter((r) => r.districtId === districtId)
      .map((r) => ({
        ...r,
        departmentId: 'rto' as DepartmentId,
      }));
  }

  if (departmentId === 'police_station') {
    const exactTalukMatches = officesData.policeStations.filter(
      (p) => p.districtId === districtId && (!talukId || p.talukId === talukId)
    );
    const list: OfficeLocationDef[] = exactTalukMatches.map((p) => ({
      ...p,
      departmentId: 'police_station',
    }));
    if (talukId) {
      const taluk = getTalukById(talukId);
      if (taluk && taluk.districtId === districtId) {
        const genericId = `ps_taluk_${taluk.id}`;
        if (!list.some((item) => item.id === genericId)) {
          list.push({
            id: genericId,
            departmentId: 'police_station',
            districtId,
            talukId,
            nameEn: `${taluk.nameEn} Taluk Police Station`,
            nameKn: `${taluk.nameKn} ತಾಲ್ಲೂಕು ಪೊಲೀಸ್ ಠಾಣೆ`,
          });
        }
      }
    }
    return list;
  }

  if (departmentId === 'gram_panchayat') {
    const matches = officesData.gramPanchayats.filter(
      (g) => g.districtId === districtId && (!talukId || g.talukId === talukId)
    );
    return matches.map((g) => ({
      ...g,
      departmentId: 'gram_panchayat',
    }));
  }

  if (departmentId === 'other') {
    const district = getDistrictById(districtId);
    return officesData.otherOffices.map((o) => ({
      id: `${o.id}_${districtId}`,
      departmentId: 'other',
      districtId,
      nameEn: district ? `${o.nameEn} (${district.nameEn})` : o.nameEn,
      nameKn: district ? `${o.nameKn} (${district.nameKn})` : o.nameKn,
    }));
  }

  return [];
}

export function matchesBilingualQuery(
  query: string,
  nameEn: string,
  nameKn: string,
  extra?: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    nameEn.toLowerCase().includes(q) ||
    nameKn.toLowerCase().includes(q) ||
    (extra ? extra.toLowerCase().includes(q) : false)
  );
}
