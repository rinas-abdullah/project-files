-- CreateEnum
CREATE TYPE "RoleKey" AS ENUM ('SUPER_ADMIN', 'EMS_ADMIN', 'EMS_DISPATCH', 'PARAMEDIC', 'ED_ADMIN', 'ED_NURSE', 'ED_DOCTOR', 'HOSPITAL_COORDINATOR', 'OPERATIONS_ANALYST', 'AUDITOR');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('PLATFORM', 'EMS', 'HOSPITAL');

-- CreateEnum
CREATE TYPE "AmbulanceStatus" AS ENUM ('AVAILABLE', 'DISPATCHED', 'ON_SCENE', 'TRANSPORTING', 'AT_HOSPITAL', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "ConnectionState" AS ENUM ('ONLINE', 'DEGRADED', 'OFFLINE');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('TRAFFIC_ACCIDENT', 'MEDICAL_EMERGENCY', 'CARDIAC', 'STROKE', 'TRAUMA', 'FIRE', 'MASS_CASUALTY', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('DISPATCHED', 'ON_SCENE', 'TRANSPORTING', 'ARRIVED', 'HANDOVER', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EncounterStatus" AS ENUM ('CREATED', 'ACTIVE', 'PRE_ALERT_SENT', 'ACKNOWLEDGED', 'PREPARING', 'APPROACHING', 'ARRIVED', 'HANDOVER', 'COMPLETED', 'CANCELLED', 'DIVERTED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('P1', 'P2', 'P3', 'P4');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ConditionTrend" AS ENUM ('STABLE', 'IMPROVING', 'DETERIORATING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IdentityStatus" AS ENUM ('UNIDENTIFIED', 'PENDING', 'VERIFIED', 'FAILED', 'MANUAL');

-- CreateEnum
CREATE TYPE "VitalType" AS ENUM ('HEART_RATE', 'BLOOD_PRESSURE', 'SPO2', 'RESPIRATORY_RATE', 'TEMPERATURE', 'GCS', 'BLOOD_GLUCOSE');

-- CreateEnum
CREATE TYPE "VitalSource" AS ENUM ('MANUAL', 'MONITOR', 'SIMULATED');

-- CreateEnum
CREATE TYPE "VitalStatus" AS ENUM ('NORMAL', 'ABNORMAL', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ClinicalEventType" AS ENUM ('CASE_CREATED', 'IDENTITY_DETECTED', 'IDENTITY_MATCHED', 'HEALTH_RECORD_RETRIEVED', 'VITALS_RECORDED', 'MEDICATION_GIVEN', 'INTERVENTION_PERFORMED', 'PHOTO_UPLOADED', 'CLINICAL_NOTE', 'CONDITION_CHANGED', 'PRIORITY_CHANGED', 'TRIAGE_ASSESSED', 'TRIAGE_DECIDED', 'DESTINATION_SELECTED', 'DESTINATION_RECOMMENDED', 'HOSPITAL_NOTIFIED', 'HOSPITAL_ACKNOWLEDGED', 'PREPARATION_UPDATED', 'READINESS_CHANGED', 'DESTINATION_CHANGED', 'APPROACHING', 'GEOFENCE_ENTERED', 'ARRIVED', 'REGISTRATION_UPDATED', 'HANDOVER_STARTED', 'HANDOVER_ACCEPTED', 'HANDOVER_COMPLETED', 'AMBULANCE_RELEASED', 'CASE_CANCELLED');

-- CreateEnum
CREATE TYPE "InterventionType" AS ENUM ('OXYGEN', 'IV_ACCESS', 'AIRWAY', 'ECG', 'CPR', 'IMMOBILIZATION', 'BLEEDING_CONTROL', 'DEFIBRILLATION', 'OTHER');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "MediaCategory" AS ENUM ('INJURY', 'WOUND', 'BURN', 'SCENE', 'MEDICAL_DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReadinessStatus" AS ENUM ('NOT_STARTED', 'REVIEWING', 'PREPARING', 'READY', 'LIMITED', 'RESOURCE_CONSTRAINT');

-- CreateEnum
CREATE TYPE "PrepItem" AS ENUM ('TEAM_NOTIFIED', 'BED_PREPARING', 'TRAUMA_TEAM_ACTIVATED', 'STROKE_TEAM_ACTIVATED', 'CATH_LAB_ALERTED', 'ISOLATION_REQUIRED', 'SPECIALIST_REQUESTED', 'BLOOD_BANK_ALERTED', 'CT_PREPARATION', 'OR_PREPARATION');

-- CreateEnum
CREATE TYPE "CapabilityType" AS ENUM ('TRAUMA_CENTER', 'STROKE', 'CATH_LAB', 'ICU', 'PEDIATRIC', 'BURN_UNIT', 'CT', 'MRI', 'OPERATING_ROOM', 'BLOOD_BANK', 'ISOLATION', 'CARDIOLOGY', 'NEUROLOGY');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('ED_CAPACITY', 'AVAILABLE_BEDS', 'ICU_BEDS', 'TRAUMA_BAY', 'CT_STATUS', 'CATH_LAB', 'OR_STATUS', 'SPECIALISTS');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('AVAILABLE', 'LIMITED', 'UNAVAILABLE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ArrivalPhase" AS ENUM ('EN_ROUTE', 'APPROACHING', 'ARRIVING', 'ARRIVED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('NOT_STARTED', 'PRE_REGISTRATION_READY', 'REGISTRATION_SENT', 'REGISTRATION_CONFIRMED', 'REGISTRATION_FAILED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'RETRYING', 'FAILED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "TriageDecision" AS ENUM ('PENDING', 'CONFIRMED', 'OVERRIDDEN');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "HandoverStatus" AS ENUM ('STARTED', 'ACCEPTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('CRITICAL_DETERIORATION', 'LOW_SPO2', 'FALLING_BP', 'ABNORMAL_HEART_RATE', 'NO_HOSPITAL_ACK', 'ETA_UNDER_5', 'DESTINATION_CHANGE', 'RESOURCE_UNAVAILABLE', 'TRIAGE_PRIORITY_CHANGED', 'GEOFENCE_ENTERED', 'LONG_HANDOVER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_CASE', 'CRITICAL_UPDATE', 'HOSPITAL_ACK', 'RESOURCE_STATUS_CHANGE', 'DESTINATION_RECOMMENDATION', 'DESTINATION_CHANGED', 'ARRIVAL', 'HANDOVER_COMPLETE');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('CONNECTED', 'SANDBOX', 'SIMULATED', 'NOT_CONNECTED', 'NOT_CONFIGURED', 'ERROR');

-- CreateEnum
CREATE TYPE "DestinationSource" AS ENUM ('MANUAL', 'RECOMMENDATION', 'DIVERSION');

-- CreateTable
CREATE TABLE "Role" (
    "key" "RoleKey" NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "permissions" TEXT[],

    CONSTRAINT "Role_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "type" "OrgType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "RoleKey" NOT NULL,
    "organizationId" TEXT NOT NULL,
    "hospitalId" TEXT,
    "ambulanceId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "edCapacity" INTEGER NOT NULL DEFAULT 30,
    "geofenceRadiusM" INTEGER NOT NULL DEFAULT 600,
    "approachRadiusM" INTEGER NOT NULL DEFAULT 3000,
    "arrivalRadiusM" INTEGER NOT NULL DEFAULT 80,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalCapability" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "capability" "CapabilityType" NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HospitalCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalResource" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "total" INTEGER,
    "available" INTEGER,
    "note" TEXT,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ambulance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "callSign" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "unitType" TEXT NOT NULL DEFAULT 'ALS',
    "status" "AmbulanceStatus" NOT NULL DEFAULT 'AVAILABLE',
    "connection" "ConnectionState" NOT NULL DEFAULT 'ONLINE',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "baseLat" DOUBLE PRECISION NOT NULL,
    "baseLng" DOUBLE PRECISION NOT NULL,
    "baseName" TEXT NOT NULL,
    "heading" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "speedKmh" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastPositionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ambulance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "description" TEXT,
    "isMassCasualty" BOOLEAN NOT NULL DEFAULT false,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbulanceMission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "ambulanceId" TEXT NOT NULL,
    "status" "MissionStatus" NOT NULL DEFAULT 'DISPATCHED',
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "onSceneAt" TIMESTAMP(3),
    "departedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "handoverAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "availableAt" TIMESTAMP(3),
    "arrivalPhase" "ArrivalPhase" NOT NULL DEFAULT 'EN_ROUTE',
    "routeJson" JSONB,
    "routeIndex" INTEGER NOT NULL DEFAULT 0,
    "routeProvider" TEXT,
    "etaSeconds" INTEGER,
    "distanceMeters" INTEGER,
    "etaUpdatedAt" TIMESTAMP(3),
    "leadUserId" TEXT,

    CONSTRAINT "AmbulanceMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "temporaryId" TEXT,
    "isUnknown" BOOLEAN NOT NULL DEFAULT false,
    "fullName" TEXT,
    "sex" "Sex" NOT NULL DEFAULT 'UNKNOWN',
    "age" INTEGER,
    "ageEstimated" BOOLEAN NOT NULL DEFAULT false,
    "nationalIdEnc" TEXT,
    "nationalIdHash" TEXT,
    "nationalIdLast4" TEXT,
    "phoneEnc" TEXT,
    "phoneLast4" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mergedIntoId" TEXT,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientIdentity" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" "IdentityStatus" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "externalRef" TEXT,
    "message" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthProfile" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "bloodType" TEXT,
    "allergies" JSONB NOT NULL,
    "chronicConditions" JSONB NOT NULL,
    "medicalAlerts" JSONB NOT NULL,
    "medicationHistory" JSONB NOT NULL,
    "criticalDiagnoses" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientEncounter" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "status" "EncounterStatus" NOT NULL DEFAULT 'CREATED',
    "priority" "Priority" NOT NULL DEFAULT 'P3',
    "conditionTrend" "ConditionTrend" NOT NULL DEFAULT 'STABLE',
    "chiefComplaint" TEXT NOT NULL,
    "mechanism" TEXT,
    "notes" TEXT,
    "destinationHospitalId" TEXT,
    "readinessStatus" "ReadinessStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "preAlertSentAt" TIMESTAMP(3),
    "preAlertDelivery" "DeliveryStatus",
    "acknowledgedAt" TIMESTAMP(3),
    "approachingAt" TIMESTAMP(3),
    "geofenceEnteredAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "handoverStartedAt" TIMESTAMP(3),
    "handoverCompletedAt" TIMESTAMP(3),
    "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "registrationRef" TEXT,
    "completeness" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "PatientEncounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalSign" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "encounterId" TEXT NOT NULL,
    "type" "VitalType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "value2" DOUBLE PRECISION,
    "unit" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "VitalSource" NOT NULL DEFAULT 'MANUAL',
    "status" "VitalStatus" NOT NULL DEFAULT 'NORMAL',
    "recordedById" TEXT,

    CONSTRAINT "VitalSign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalEvent" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "encounterId" TEXT NOT NULL,
    "type" "ClinicalEventType" NOT NULL,
    "detail" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorRole" "RoleKey",

    CONSTRAINT "ClinicalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intervention" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "encounterId" TEXT NOT NULL,
    "type" "InterventionType" NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedById" TEXT,
    "performedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "Intervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "encounterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "administeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "administeredById" TEXT,
    "administeredBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAttachment" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "category" "MediaCategory" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT,
    "caption" TEXT,
    "uploadedById" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "source" "DestinationSource" NOT NULL DEFAULT 'MANUAL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "selectedById" TEXT,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationHistory" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "fromHospitalId" TEXT,
    "toHospitalId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "changedById" TEXT,
    "changedByName" TEXT,
    "changedByRole" "RoleKey",
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DestinationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationRecommendation" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "recommendedHospitalId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "requiredCapabilities" JSONB NOT NULL,
    "ranking" JSONB NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT,
    "requestedByName" TEXT,
    "decidedById" TEXT,
    "decidedByName" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DestinationRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalPreparation" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "item" "PrepItem" NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "updatedByName" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalPreparation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acknowledgment" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "role" "RoleKey" NOT NULL,
    "note" TEXT,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Acknowledgment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriageAssessment" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "suggestedPriority" "Priority" NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "factors" JSONB NOT NULL,
    "missingData" JSONB NOT NULL,
    "inputs" JSONB NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "decision" "TriageDecision" NOT NULL DEFAULT 'PENDING',
    "finalPriority" "Priority",
    "overrideReason" TEXT,
    "decidedById" TEXT,
    "decidedByName" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TriageAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Handover" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "status" "HandoverStatus" NOT NULL DEFAULT 'STARTED',
    "summary" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedById" TEXT,
    "startedByName" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "acceptedById" TEXT,
    "acceptedByName" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "completedByName" TEXT,
    "receivingNotes" TEXT,

    CONSTRAINT "Handover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "encounterId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "message" TEXT NOT NULL,
    "data" JSONB,
    "dedupeKey" TEXT,
    "encounterId" TEXT,
    "hospitalId" TEXT,
    "ambulanceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "role" "RoleKey",
    "orgId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "IntegrationStatus" NOT NULL,
    "description" TEXT NOT NULL,
    "endpoint" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_code_key" ON "Organization"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_organizationId_key" ON "Hospital"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_code_key" ON "Hospital"("code");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalCapability_hospitalId_capability_key" ON "HospitalCapability"("hospitalId", "capability");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalResource_hospitalId_type_key" ON "HospitalResource"("hospitalId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Ambulance_callSign_key" ON "Ambulance"("callSign");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_code_key" ON "Incident"("code");

-- CreateIndex
CREATE INDEX "Incident_reportedAt_idx" ON "Incident"("reportedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AmbulanceMission_code_key" ON "AmbulanceMission"("code");

-- CreateIndex
CREATE INDEX "AmbulanceMission_ambulanceId_status_idx" ON "AmbulanceMission"("ambulanceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_temporaryId_key" ON "Patient"("temporaryId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_nationalIdHash_key" ON "Patient"("nationalIdHash");

-- CreateIndex
CREATE UNIQUE INDEX "HealthProfile_patientId_key" ON "HealthProfile"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientEncounter_code_key" ON "PatientEncounter"("code");

-- CreateIndex
CREATE INDEX "PatientEncounter_status_idx" ON "PatientEncounter"("status");

-- CreateIndex
CREATE INDEX "PatientEncounter_destinationHospitalId_status_idx" ON "PatientEncounter"("destinationHospitalId", "status");

-- CreateIndex
CREATE INDEX "PatientEncounter_createdAt_idx" ON "PatientEncounter"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VitalSign_clientId_key" ON "VitalSign"("clientId");

-- CreateIndex
CREATE INDEX "VitalSign_encounterId_type_recordedAt_idx" ON "VitalSign"("encounterId", "type", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalEvent_clientId_key" ON "ClinicalEvent"("clientId");

-- CreateIndex
CREATE INDEX "ClinicalEvent_encounterId_occurredAt_idx" ON "ClinicalEvent"("encounterId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Intervention_clientId_key" ON "Intervention"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Medication_clientId_key" ON "Medication"("clientId");

-- CreateIndex
CREATE INDEX "Destination_encounterId_active_idx" ON "Destination"("encounterId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalPreparation_encounterId_hospitalId_item_key" ON "HospitalPreparation"("encounterId", "hospitalId", "item");

-- CreateIndex
CREATE UNIQUE INDEX "Handover_encounterId_key" ON "Handover"("encounterId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "Alert_dedupeKey_key" ON "Alert"("dedupeKey");

-- CreateIndex
CREATE INDEX "Alert_status_createdAt_idx" ON "Alert"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_key_key" ON "Integration"("key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_fkey" FOREIGN KEY ("role") REFERENCES "Role"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_ambulanceId_fkey" FOREIGN KEY ("ambulanceId") REFERENCES "Ambulance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospital" ADD CONSTRAINT "Hospital_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalCapability" ADD CONSTRAINT "HospitalCapability_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalResource" ADD CONSTRAINT "HospitalResource_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ambulance" ADD CONSTRAINT "Ambulance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbulanceMission" ADD CONSTRAINT "AmbulanceMission_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbulanceMission" ADD CONSTRAINT "AmbulanceMission_ambulanceId_fkey" FOREIGN KEY ("ambulanceId") REFERENCES "Ambulance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientIdentity" ADD CONSTRAINT "PatientIdentity_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthProfile" ADD CONSTRAINT "HealthProfile_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientEncounter" ADD CONSTRAINT "PatientEncounter_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientEncounter" ADD CONSTRAINT "PatientEncounter_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "AmbulanceMission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientEncounter" ADD CONSTRAINT "PatientEncounter_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientEncounter" ADD CONSTRAINT "PatientEncounter_destinationHospitalId_fkey" FOREIGN KEY ("destinationHospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "PatientEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvent" ADD CONSTRAINT "ClinicalEvent_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "PatientEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "PatientEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "PatientEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAttachment" ADD CONSTRAINT "MediaAttachment_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "PatientEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "PatientEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationHistory" ADD CONSTRAINT "DestinationHistory_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "PatientEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationHistory" ADD CONSTRAINT "DestinationHistory_fromHospitalId_fkey" FOREIGN KEY ("fromHospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationHistory" ADD CONSTRAINT "DestinationHistory_toHospitalId_fkey" FOREIGN KEY ("toHospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationRecommendation" ADD CONSTRAINT "DestinationRecommendation_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "PatientEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationRecommendation" ADD CONSTRAINT "DestinationRecommendation_recommendedHospitalId_fkey" FOREIGN KEY ("recommendedHospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalPreparation" ADD CONSTRAINT "HospitalPreparation_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "PatientEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalPreparation" ADD CONSTRAINT "HospitalPreparation_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acknowledgment" ADD CONSTRAINT "Acknowledgment_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "PatientEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acknowledgment" ADD CONSTRAINT "Acknowledgment_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageAssessment" ADD CONSTRAINT "TriageAssessment_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "PatientEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Handover" ADD CONSTRAINT "Handover_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "PatientEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Handover" ADD CONSTRAINT "Handover_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "PatientEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "PatientEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_ambulanceId_fkey" FOREIGN KEY ("ambulanceId") REFERENCES "Ambulance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
