import { NextRequest, NextResponse } from "next/server";

const MOCK_EVIDENCES: Record<string, any[]> = {
  "case-001": [
    {
      id: "evi-001",
      inspection_case_id: "case-001",
      category: "FRONT_45",
      s3_key: "org-1111/inspections/case-001/FRONT_45_20261124_a1b2c3d4.webp",
      file_size_bytes: 1450280,
      mime_type: "image/webp",
      sha256_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      latitude: 18.5204,
      longitude: 73.8567,
      captured_at: "2026-11-24 10:15:30",
      inspector_name: "Suresh Patil",
      caption: "Front 3/4 perspective showing cab and bumper",
      is_damage_proof: false,
    },
    {
      id: "evi-002",
      inspection_case_id: "case-001",
      category: "ODOMETER",
      s3_key: "org-1111/inspections/case-001/ODOMETER_20261124_f5e6d7c8.webp",
      file_size_bytes: 982100,
      mime_type: "image/webp",
      sha256_hash: "b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8",
      latitude: 18.5205,
      longitude: 73.8568,
      captured_at: "2026-11-24 10:20:12",
      inspector_name: "Suresh Patil",
      caption: "Digital instrument cluster showing 45,210 km",
      is_damage_proof: false,
    },
    {
      id: "evi-003",
      inspection_case_id: "case-001",
      category: "DAMAGE",
      s3_key: "org-1111/inspections/case-001/DAMAGE_20261124_11223344.webp",
      file_size_bytes: 1120000,
      mime_type: "image/webp",
      sha256_hash: "c1c2c3c4c5c6c7c8c9c0d1d2d3d4d5d6d7d8d9d0e1e2e3e4e5e6e7e8e9e0f1f2",
      latitude: 18.5206,
      longitude: 73.8569,
      captured_at: "2026-11-24 10:25:45",
      inspector_name: "Suresh Patil",
      caption: "Rear tailgate dent with paint scratch",
      is_damage_proof: true,
    },
    {
      id: "evi-004",
      inspection_case_id: "case-001",
      category: "DOCUMENT",
      s3_key: "org-1111/inspections/case-001/DOCUMENT_20261124_99887766.webp",
      file_size_bytes: 2048500,
      mime_type: "image/webp",
      sha256_hash: "d4d5d6d7d8d9d0e1e2e3e4e5e6e7e8e9e0f1f2f3f4f5f6f7f8f9f0a1a2a3a4a5",
      latitude: 18.5204,
      longitude: 73.8567,
      captured_at: "2026-11-24 10:30:00",
      inspector_name: "Suresh Patil",
      caption: "Original physical RC Smart Card front side",
      is_damage_proof: false,
    },
  ],
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caseId = params.id;
  const list = MOCK_EVIDENCES[caseId] || MOCK_EVIDENCES["case-001"];

  return NextResponse.json({
    status: "success",
    message: "Evidence artifacts retrieved",
    data: list,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caseId = params.id;
  const body = await req.json();

  const newEvidence = {
    id: `evi-${Date.now()}`,
    inspection_case_id: caseId,
    category: body.category || "FRONT_45",
    s3_key: `org-1111/inspections/${caseId}/${body.category || "PHOTO"}_${Date.now()}.webp`,
    file_size_bytes: body.file_size_bytes || 1250000,
    mime_type: body.mime_type || "image/webp",
    sha256_hash: body.sha256_hash || "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
    latitude: body.latitude || 18.5204,
    longitude: body.longitude || 73.8567,
    captured_at: new Date().toISOString().replace("T", " ").split(".")[0],
    inspector_name: "Suresh Patil",
    caption: body.caption || "Inspection photographic proof",
    is_damage_proof: !!body.is_damage_proof,
  };

  if (!MOCK_EVIDENCES[caseId]) {
    MOCK_EVIDENCES[caseId] = [...(MOCK_EVIDENCES["case-001"] || [])];
  }
  MOCK_EVIDENCES[caseId].unshift(newEvidence);

  return NextResponse.json(
    {
      status: "success",
      message: "Evidence artifact uploaded and recorded",
      data: newEvidence,
    },
    { status: 201 }
  );
}
