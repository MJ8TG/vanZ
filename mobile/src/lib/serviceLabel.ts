/** Localized label for a job's service_type (falls back to the raw value). */
export function serviceLabel(type: string | null | undefined, t: (key: string) => string): string {
  const map: Record<string, string> = {
    parcel: 'createJob.svcParcel',
    furniture: 'createJob.svcFurniture',
    moving: 'createJob.svcMoving',
    express: 'createJob.svcExpress',
    office: 'createJob.svcOffice',
    intercity: 'createJob.svcIntercity',
  };
  return type && map[type] ? t(map[type]) : (type || 'Mission');
}
