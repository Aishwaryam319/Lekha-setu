import React, { useMemo } from 'react';
import {
  Building2,
  Bus,
  CheckCircle2,
  Landmark,
  MapPin,
  Shield,
  Trees,
} from 'lucide-react';
import { ActiveSelection, DepartmentId } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  KARNATAKA_DEPARTMENTS,
  KARNATAKA_DISTRICTS,
  getDepartmentById,
  getOfficesForSelection,
  getTaluksForDistrict,
} from '../utils/locationSearch';
import { SearchableSelect, SelectOption } from './SearchableSelect';

interface DepartmentLocationSelectorProps {
  value: ActiveSelection;
  onChange: (next: ActiveSelection) => void;
  onSave?: () => void;
  savedBanner?: boolean;
}

export function getDepartmentIcon(id: DepartmentId) {
  switch (id) {
    case 'police_station':
      return <Shield className="w-4 h-4" />;
    case 'tahsildar_office':
      return <Landmark className="w-4 h-4" />;
    case 'city_corporation':
      return <Building2 className="w-4 h-4" />;
    case 'rto':
      return <Bus className="w-4 h-4" />;
    case 'gram_panchayat':
      return <Trees className="w-4 h-4" />;
    default:
      return <Building2 className="w-4 h-4" />;
  }
}

export function DepartmentLocationSelector({
  value,
  onChange,
  onSave,
  savedBanner = false,
}: DepartmentLocationSelectorProps) {
  const { language, t, pick } = useLanguage();

  const selectedDept = useMemo(
    () => getDepartmentById(value.departmentId),
    [value.departmentId]
  );

  const deptOptions: SelectOption[] = useMemo(
    () =>
      KARNATAKA_DEPARTMENTS.map((d) => ({
        id: d.id,
        labelEn: d.nameEn,
        labelKn: d.nameKn,
      })),
    []
  );

  const districtOptions: SelectOption[] = useMemo(
    () =>
      KARNATAKA_DISTRICTS.map((d) => ({
        id: d.id,
        labelEn: d.nameEn,
        labelKn: d.nameKn,
        sublabel: `${d.division} Division`,
      })),
    []
  );

  const talukOptions: SelectOption[] = useMemo(() => {
    if (!value.districtId) return [];
    return getTaluksForDistrict(value.districtId).map((tk) => ({
      id: tk.id,
      labelEn: tk.nameEn,
      labelKn: tk.nameKn,
    }));
  }, [value.districtId]);

  const officeOptions: SelectOption[] = useMemo(() => {
    const list = getOfficesForSelection(
      value.departmentId,
      value.districtId,
      selectedDept?.requiresTaluk ? value.talukId : ''
    );
    return list.map((o) => ({
      id: o.id,
      labelEn: o.nameEn,
      labelKn: o.nameKn,
    }));
  }, [value.departmentId, value.districtId, value.talukId, selectedDept]);

  const handleDepartmentChange = (deptId: string) => {
    const nextDeptId = (deptId || 'other') as DepartmentId;
    const deptDef = getDepartmentById(nextDeptId);
    const nextTalukId = deptDef?.requiresTaluk ? value.talukId : '';
    const offices = getOfficesForSelection(nextDeptId, value.districtId, nextTalukId);
    const firstOffice = offices.length === 1 ? offices[0] : undefined;

    onChange({
      departmentId: nextDeptId,
      districtId: value.districtId,
      talukId: nextTalukId,
      officeId: firstOffice?.id || '',
      officeNameEn: firstOffice?.nameEn || '',
      officeNameKn: firstOffice?.nameKn || '',
      customOfficeName: '',
    });
  };

  const handleDistrictChange = (districtId: string) => {
    const taluks = districtId ? getTaluksForDistrict(districtId) : [];
    const firstTalukId = selectedDept?.requiresTaluk && taluks.length === 1 ? taluks[0].id : '';
    const offices = getOfficesForSelection(value.departmentId, districtId, firstTalukId);
    const firstOffice = offices.length === 1 ? offices[0] : undefined;

    onChange({
      ...value,
      districtId,
      talukId: firstTalukId,
      officeId: firstOffice?.id || '',
      officeNameEn: firstOffice?.nameEn || '',
      officeNameKn: firstOffice?.nameKn || '',
    });
  };

  const handleTalukChange = (talukId: string) => {
    const offices = getOfficesForSelection(value.departmentId, value.districtId, talukId);
    const firstOffice = offices.length === 1 ? offices[0] : undefined;
    onChange({
      ...value,
      talukId,
      officeId: firstOffice?.id || '',
      officeNameEn: firstOffice?.nameEn || '',
      officeNameKn: firstOffice?.nameKn || '',
    });
  };

  const handleOfficeChange = (officeId: string) => {
    const matched = officeOptions.find((o) => o.id === officeId);
    onChange({
      ...value,
      officeId,
      officeNameEn: matched?.labelEn || '',
      officeNameKn: matched?.labelKn || '',
      customOfficeName: officeId ? '' : value.customOfficeName,
    });
  };

  const showTalukField = Boolean(selectedDept?.requiresTaluk);
  const showManualOfficeInput =
    value.departmentId === 'other' ||
    (value.districtId &&
      (!showTalukField || value.talukId) &&
      officeOptions.length === 0) ||
    Boolean(value.customOfficeName);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelect
          label={t('selectDepartment')}
          options={deptOptions}
          value={value.departmentId}
          onChange={handleDepartmentChange}
          placeholder={t('selectDepartment')}
          searchPlaceholder={t('searchDepartmentPlaceholder')}
          icon={getDepartmentIcon(value.departmentId)}
          required
        />

        <SearchableSelect
          label={t('selectDistrict')}
          options={districtOptions}
          value={value.districtId}
          onChange={handleDistrictChange}
          placeholder={t('selectDistrict')}
          searchPlaceholder={t('searchDistrictPlaceholder')}
          icon={<MapPin className="w-4 h-4" />}
          required
        />

        {showTalukField && (
          <SearchableSelect
            label={t('selectTaluk')}
            options={talukOptions}
            value={value.talukId}
            onChange={handleTalukChange}
            placeholder={t('selectTaluk')}
            searchPlaceholder={t('searchTalukPlaceholder')}
            disabled={!value.districtId}
            disabledMessage={t('selectDistrictFirst')}
            icon={<MapPin className="w-4 h-4" />}
            required
          />
        )}

        <SearchableSelect
          label={t('selectOffice')}
          options={officeOptions}
          value={value.officeId}
          onChange={handleOfficeChange}
          placeholder={
            officeOptions.length === 0 && value.districtId
              ? pick('Use manual office name below', 'ಕೆಳಗೆ ಕಚೇರಿ ಹೆಸರನ್ನು ನಮೂದಿಸಿ')
              : t('selectOffice')
          }
          searchPlaceholder={t('searchOfficePlaceholder')}
          disabled={!value.districtId || (showTalukField && !value.talukId)}
          disabledMessage={
            !value.districtId
              ? t('selectDistrictFirst')
              : showTalukField && !value.talukId
                ? t('selectTalukFirst')
                : undefined
          }
          icon={getDepartmentIcon(value.departmentId)}
          required={!showManualOfficeInput}
        />
      </div>

      {selectedDept && (
        <p className="text-xs text-slate-600">
          {language === 'kn' ? selectedDept.descriptionKn : selectedDept.descriptionEn}
          {!showTalukField && ` · ${t('noTalukRequired')}`}
        </p>
      )}

      {(showManualOfficeInput || value.departmentId === 'gram_panchayat' || value.departmentId === 'police_station') && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t('enterCustomOffice')}
          </label>
          <input
            type="text"
            value={value.customOfficeName}
            onChange={(e) =>
              onChange({
                ...value,
                customOfficeName: e.target.value,
              })
            }
            placeholder={t('customOfficePlaceholder')}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#173B63]"
          />
        </div>
      )}

      {onSave && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
          {savedBanner ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              {t('selectionSaved')}
            </span>
          ) : (
            <span className="text-xs text-slate-500">
              {pick(
                'All uploads and scans will be tagged with this office.',
                'ಎಲ್ಲಾ ಅಪ್‌ಲೋಡ್‌ಗಳು ಮತ್ತು ಸ್ಕ್ಯಾನ್‌ಗಳನ್ನು ಈ ಕಚೇರಿಗೆ ಜೋಡಿಸಲಾಗುತ್ತದೆ.'
              )}
            </span>
          )}
          <button
            type="button"
            onClick={onSave}
            className="px-5 py-2.5 bg-[#173B63] hover:bg-[#112d4d] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t('saveSelection')}
          </button>
        </div>
      )}
    </div>
  );
}
