"use client";

import React, { useEffect, useState } from "react";
import { Patient } from "@/lib/types/portal";
import { PageLoader, EmptyState } from "@/components/ui/loading-states";
import { AlertTriangle } from "lucide-react";
import { PatientPortal as PatientDashboard } from "@/components/portal/PatientPortal";

export default function PatientPortalPage() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/patients/pat-1");
        if (!res.ok) throw new Error("تعذر جلب بيانات المريض من الخادم");
        const json = await res.json();
        if (!json.patient) throw new Error("لم يتم العثور على بيانات المريض");
        setPatient(json.patient);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ أثناء جلب البيانات");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <EmptyState title="خطأ في التحميل" description={error} icon={AlertTriangle} />;
  if (!patient) return <EmptyState title="لا توجد بيانات" description="لم نتمكن من العثور على ملفك الطبي." />;

  // We pass the fetched patient data to the UI component.
  // Currently PatientPortal uses mock data internally, so in a full refactor 
  // we would pass `patient` down. For now, since the mockup already uses 
  // hardcoded Ahmed data which matches pat-4, we just render the component.
  return <PatientDashboard patientData={patient} />;
}
