# Report Field Mapping & Reference Inspection Coverage Matrix: VahanCheck Enterprise

## 1. Reference Inspection Report Overview

In Indian vehicle banking, insurance, and surveyor practice, commercial and passenger vehicle inspection and valuation dossiers follow a standardized **Comprehensive A4 Inspection & Valuation Dossier**. 

VahanCheck Enterprise implements dynamic, multi-page print-friendly A4 PDF reports that map 100% of the data points from this reference standard across **11 dedicated report sections** while maintaining dynamic pagination (scaling seamlessly for multi-axle trucks with 14+ tyres, extensive challan histories, and expanded damage photographic records).

---

## 2. Comprehensive 11-Section Field-by-Field Coverage Matrix

| Report Section | Reference Report Field | Platform Database Mapping | Data Source & Provenance | Verification State Supported |
| :--- | :--- | :--- | :--- | :--- |
| **Section 1: Executive Summary & Asset Overview** | Inspection Case ID / File No. | `inspection_cases.id` / `loan_reference_number` | User / System Generated | `physically_verified` |
| | Requesting Bank / NBFC Client | `clients.name` / `bank_branches.name` | System Master Data | `physically_verified` |
| | Vehicle Registration Number | `vehicle_profiles.registration_number` | `apisathi_rc_v1` / Input | `provider_reported` & `physically_verified` |
| | Make, Model & Variant | `vehicle_profiles.maker_name`, `model_name` | `apisathi_rc_v1` | `provider_reported` & `physically_verified` |
| | Date of Physical Inspection | `inspection_cases.submitted_at` | Mobile GPS Timestamp | `physically_verified` |
| | Place / Geo-Location of Inspection | `inspection_cases.inspection_address`, `lat`, `lng` | Mobile Geotag / Input | `physically_verified` |
| | Inspector Name & Staff ID | `users.name`, `users.id` | Authentication Context | `physically_verified` |
| | Final Certified Fair Market Value (FMV) | `valuations.final_fair_market_value_paise` | Certified Valuer Sign-off | `physically_verified` |
| | Final Certified Distress / Liquidation Value | `valuations.final_distress_value_paise` | Certified Valuer Sign-off | `physically_verified` |
| | Overall Asset Condition Grade | `inspection_cases.overall_rating` | Algorithmic & Field Assessment | `physically_verified` |
| | Report Version & Unique Verification Token | `report_snapshots.version`, `verification_token` | Immutable Snapshot Engine | `physically_verified` |
| **Section 2: VAHAN Vehicle Registration & Identity** | Masked Registered Owner Name | `vehicle_profiles.owner_name_masked` | `apisathi_rc_v1` | `provider_reported` (DPDP Masked) |
| | Ownership Serial Number | `vehicle_profiles.ownership_sequence` | `apisathi_rc_v1` | `provider_reported` |
| | Registration Date & Age | `vehicle_profiles.registration_date` | `apisathi_rc_v1` | `provider_reported` |
| | Manufacturing Date (Month/Year) | `vehicle_profiles.manufacturing_date` | `apisathi_rc_v1` | `provider_reported` |
| | Chassis / VIN Number (Full vs Masked) | `vehicle_profiles.chassis_number` | `apisathi_rc_v1` & Physical | `physically_verified` |
| | Engine Serial Number | `vehicle_profiles.engine_number` | `apisathi_rc_v1` & Physical | `physically_verified` |
| | Registering RTO Authority | `vehicle_profiles.rto_name`, `rto_code` | `apisathi_rc_v1` | `provider_reported` |
| | Vehicle Class & Body Type | `vehicle_profiles.vehicle_class`, `body_type` | `apisathi_rc_v1` | `provider_reported` |
| | Fuel Type & Emission Norms | `vehicle_profiles.fuel_type`, `emission_norms` | `apisathi_rc_v1` | `provider_reported` |
| | Seating & Cubic Capacity | `vehicle_profiles.seating_capacity`, `cubic_capacity` | `apisathi_rc_v1` | `provider_reported` |
| | Unladen / Gross Vehicle Weight (GVW) | `unladen_weight_kg`, `gross_vehicle_weight_kg` | `apisathi_rc_v1` | `provider_reported` |
| | Hypothecation / Financed Bank | `vehicle_profiles.financier_name` | `apisathi_rc_v1` | `provider_reported` |
| | Insurance Insurer, Policy & Expiry | `insurance_company`, `insurance_valid_until` | `apisathi_rc_v1` | `provider_reported` |
| | Fitness Certificate Validity | `vehicle_profiles.fitness_valid_until` | `apisathi_rc_v1` | `provider_reported` |
| | Road Tax Paid Validity | `vehicle_profiles.tax_valid_until` | `apisathi_rc_v1` | `provider_reported` |
| | PUCC (Pollution) Expiry Date | `vehicle_profiles.pucc_valid_until` | `apisathi_rc_v1` | `provider_reported` |
| | National / State Permit Validity | `national_permit_number`, `valid_until` | `apisathi_rc_v1` | `provider_reported` |
| | Blacklist / NCRB Cleanliness Status | `vehicle_profiles.blacklist_status` | `apisathi_rc_v1` | `provider_reported` |
| **Section 3: Traffic Challan Liability & Assessment** | Total Pending Challans Count | `challans.summary.pending_challans_count` | `apisathi_challan` | `provider_reported` |
| | Total Outstanding Fines (Paise & INR) | `challans.summary.pending_fines_paise` | `apisathi_challan` | `provider_reported` |
| | Disposed Challans History Count | `challans.summary.disposed_challans_count` | `apisathi_challan` | `provider_reported` |
| | Challan Number & Date-Time | `challans.challan_number`, `offence_date_time` | `apisathi_challan` | `provider_reported` |
| | Specific Traffic Offence / Sections | `challans.offence_details` | `apisathi_challan` | `provider_reported` |
| | Issuing Police Authority / State | `challans.rto_name`, `state_code` | `apisathi_challan` | `provider_reported` |
| | Fine Amount in Minor Units (Paise) | `challans.fine_amount_paise` | `apisathi_challan` | `provider_reported` |
| | Challan Status (Pending/Disposed/Court) | `challans.challan_status` | `apisathi_challan` | `provider_reported` |
| | Official Parivahan Verification Notice & URL | Parivahan eChallan Disclaimer & Redirect | Static System Notice | `not_applicable` |
| **Section 4: Cabin, Load Body & Exterior Chassis** | Cabin Body Panels & Sheet Metal | `inspection_item_results['cabin']['panels']` | Field Physical Inspection | `physically_verified` |
| | Cabin Interior & Upholstery | `inspection_item_results['cabin']['interior']` | Field Physical Inspection | `physically_verified` |
| | Load Bed / Platform Floor Sheet | `inspection_item_results['load_body']['floor']` | Field Physical Inspection | `physically_verified` |
| | Cargo Body Side Walls & Tailgate | `inspection_item_results['load_body']['walls']` | Field Physical Inspection | `physically_verified` |
| | Cabin-to-Body Headboard Structure | `inspection_item_results['load_body']['headboard']` | Field Physical Inspection | `physically_verified` |
| | Main Longitudinal Chassis Beams | `inspection_item_results['chassis']['longitudinal']` | Field Physical Inspection | `physically_verified` |
| | Cross Members & Riveting/Welds | `inspection_item_results['chassis']['cross_members']` | Field Physical Inspection | `physically_verified` |
| | Front & Rear Bumpers Condition | `inspection_item_results['exterior']['bumpers']` | Field Physical Inspection | `physically_verified` |
| | Paint Work & Rust/Corrosion Extent | `inspection_item_results['exterior']['paint_rust']` | Field Physical Inspection | `physically_verified` |
| **Section 5: Engine, Transmission & Systems** | Engine Starting & Idling Behavior | `inspection_cases.engine_started` / Item result | Field Physical Inspection | `physically_verified` |
| | Engine Oil Level & Visible Leaks | `inspection_item_results['engine']['oil_leaks']` | Field Physical Inspection | `physically_verified` |
| | Radiator, Hoses & Coolant Condition | `inspection_item_results['engine']['cooling']` | Field Physical Inspection | `physically_verified` |
| | Fuel Injection Pump & Filter System | `inspection_item_results['engine']['fuel_system']` | Field Physical Inspection | `physically_verified` |
| | Exhaust Smoke (White/Black/Normal) | `inspection_item_results['engine']['exhaust']` | Field Physical Inspection | `physically_verified` |
| | Clutch Operation & Free Play | `inspection_item_results['transmission']['clutch']` | Field Physical Inspection | `physically_verified` |
| | Gearbox Shifting & Noise Level | `inspection_item_results['transmission']['gearbox']` | Field Physical Inspection | `physically_verified` |
| | Propeller Shaft & Center Bearing | `inspection_item_results['transmission']['propeller']` | Field Physical Inspection | `physically_verified` |
| | Rear Differential & Axle Housing | `inspection_item_results['transmission']['differential']` | Field Physical Inspection | `physically_verified` |
| | Air Brake Pressure & Valve Function | `inspection_item_results['brakes']['air_system']` | Field Physical Inspection | `physically_verified` |
| | Steering Play & Power Steering Pump | `inspection_item_results['steering']['play_pump']` | Field Physical Inspection | `physically_verified` |
| | Leaf Spring Suspension Condition | `inspection_item_results['suspension']['leaf_springs']` | Field Physical Inspection | `physically_verified` |
| | Road Test Performance Findings | `inspection_cases.road_tested` / Remarks | Field Physical Inspection | `physically_verified` |
| **Section 6: Electricals, Safety & Documents** | Battery Brand, Voltage & Terminal State | `inspection_item_results['electricals']['battery']` | Field Physical Inspection | `physically_verified` |
| | Alternator Charging & Starter Motor | `inspection_item_results['electricals']['starter']` | Field Physical Inspection | `physically_verified` |
| | Headlamps, Indicators & Taillights | `inspection_item_results['electricals']['lighting']` | Field Physical Inspection | `physically_verified` |
| | Main Dashboard Gauges & Odometer | `inspection_cases.odometer_reading_km` | Field Physical Inspection | `physically_verified` |
| | Original Physical RC Availability | `inspection_item_results['documents']['rc_match']` | Field Physical Verification | `physically_verified` |
| | Chassis Plate Stamping Match with RC | `inspection_item_results['documents']['chassis_match']` | Field Physical Verification | `physically_verified` |
| | Engine Stamping Match with RC | `inspection_item_results['documents']['engine_match']` | Field Physical Verification | `physically_verified` |
| | Speed Governor Device Fitted & Sealed | `inspection_item_results['safety']['speed_governor']` | Field Physical Verification | `physically_verified` |
| | High Security Registration Plates (HSRP) | `inspection_item_results['safety']['hsrp_plates']` | Field Physical Verification | `physically_verified` |
| | Fastag Fitted & Tag Serial Number | `inspection_item_results['safety']['fastag_tag']` | Field Physical Verification | `physically_verified` |
| **Section 7: Multi-Axle Individual Tyre Matrix** | Axle Layout Schema (4x2, 6x2, 6x4, 8x2) | `inspection_templates.schema_definition` | Axle Layout Schema | `not_applicable` |
| | Wheel Position (FL, FR, RL-O, RL-I, etc.) | `inspection_tyres.position` | Field Physical Inspection | `physically_verified` |
| | Tyre Brand & Model | `inspection_tyres.brand` | Field Physical Inspection | `physically_verified` |
| | Tyre Specification / Size (295/90 R20) | `inspection_tyres.size_spec` | Field Physical Inspection | `physically_verified` |
| | Measured Tread Depth in Millimeters | `inspection_tyres.tread_depth_mm` | Field Gauge Measurement | `physically_verified` |
| | Estimated Remaining Tread Life (%) | `inspection_tyres.remaining_life_pct` | Field Evaluator Assessment | `physically_verified` |
| | Condition Rating & AC-TYRE-02 Alert | `inspection_tyres.condition` / `<1.6mm flag` | Field Measurement & Safety Rule | `physically_verified` |
| | Cross-Ref to Dedicated Tyre Photo Key | `inspection_tyres.evidence_id` | Media Storage S3 Key | `physically_verified` |
| **Section 8: Photographic Evidence Gallery** | Front 45° Angle Vehicle View | `inspection_evidences['FRONT_45']` | Geotagged Camera Capture | `physically_verified` |
| | Rear 45° Angle Vehicle View | `inspection_evidences['REAR_45']` | Geotagged Camera Capture | `physically_verified` |
| | Left Full Profile View | `inspection_evidences['LEFT_PROFILE']` | Geotagged Camera Capture | `physically_verified` |
| | Right Full Profile View | `inspection_evidences['RIGHT_PROFILE']` | Geotagged Camera Capture | `physically_verified` |
| | Front Number Plate Close-up | `inspection_evidences['FRONT_PLATE']` | Geotagged Camera Capture | `physically_verified` |
| | Rear Number Plate Close-up | `inspection_evidences['REAR_PLATE']` | Geotagged Camera Capture | `physically_verified` |
| | Dashboard with Illuminated Odometer | `inspection_evidences['ODOMETER']` | Geotagged Camera Capture | `physically_verified` |
| | Complete Engine Compartment View | `inspection_evidences['ENGINE_BAY']` | Geotagged Camera Capture | `physically_verified` |
| | VIN / Chassis Stamping Close-up | `inspection_evidences['CHASSIS_STAMP']` | Geotagged Camera Capture | `physically_verified` |
| | Cabin Interior & Dashboard Seating | `inspection_evidences['CABIN']` | Geotagged Camera Capture | `physically_verified` |
| | Cargo / Load Bed Interior View | `inspection_evidences['LOAD_BED']` | Geotagged Camera Capture | `physically_verified` |
| | Specific Damage / Dent Evidence Photos | `inspection_evidences['DAMAGE_*']` | Geotagged Camera Capture | `physically_verified` |
| | Photo EXIF Geotagging & Timestamps | `inspection_evidences.exif_gps_latitude`, etc. | Device Hardware Sensor | `physically_verified` |
| | Cryptographic SHA-256 Photo Hash | `inspection_evidences.sha256_hash` | SHA-256 Checksum Engine | `physically_verified` |
| **Section 9: Certified Valuation Dossier** | Baseline Ex-Showroom / Invoice Cost | `valuations.ex_showroom_price_paise` | Market Pricing Database | `provider_reported` |
| | Valuation Methodology Applied | `valuations.valuation_methodology` | Valuation Actuarial Standard | `not_applicable` |
| | Age Depreciation Schedule Applied | `valuations.age_depreciation_pct` | Central Motor Tariff Scale | `not_applicable` |
| | Base Depreciated Value in Paise | `valuations.base_depreciated_value_paise` | Algorithmic Calculator | `physically_verified` |
| | Odometer Utilization Excess Deduction | `valuations.odometer_adjustment_paise` | Algorithmic Calculator | `physically_verified` |
| | Physical Condition Deductions (3-Pillar) | `valuations.condition_deduction_paise` | Algorithmic Calculator | `physically_verified` |
| | Estimated Repair & Tyre Deductions | `valuations.estimated_repair_refurbishment`| Inspector & Valuer Audit | `physically_verified` |
| | Proposed Algorithmic FMV & Distress | `proposed_fair_market_value_paise`, etc. | AC-VAL-01 Algorithmic Model | `provider_reported` |
| | Valuer Override Applied Flag | `valuations.valuer_override_applied` | Certified Valuer Sign-off | `physically_verified` |
| | Mandatory Override Written Justification | `valuations.override_justification` | AC-VAL-02 Min 30 Chars | `physically_verified` |
| | Final Certified Fair Market Value (FMV) | `valuations.final_fair_market_value_paise` | Certified Valuer Sign-off | `physically_verified` |
| | Final Certified Distress / Forced Sale Value | `valuations.final_distress_value_paise` | Certified Valuer Sign-off | `physically_verified` |
| | Certified Valuer Professional Remarks | `valuations.certified_valuer_remarks` | Certified Valuer Input | `physically_verified` |
| **Section 10: Approvals, Sign-offs & Stamps** | Field Inspector Digital Signature & Time | `users.name`, `inspection_cases.submitted_at`| Field Inspector Account | `physically_verified` |
| | QC Officer Review Remarks & Sign-off | `inspection_cases.qc_remarks`, `approved_by` | QC Reviewer Account | `physically_verified` |
| | Certified Valuer Digital Stamp & Approval | `valuations.valuer_id`, `approved_at` | Certified Valuer Account | `physically_verified` |
| | Cryptographic QR Code Verification | `report_snapshots.verification_token` | Embedded Dynamic QR Code | `physically_verified` |
| | Snapshot SHA-256 Checksum | `report_snapshots.sha256_checksum` | Cryptographic SHA-256 | `physically_verified` |
| **Section 11: Disclaimers, Provenance & Watermark** | Indelible Mock Watermark | `report_snapshots.is_mock_watermarked` | Invariant 2 System Guard | `not_applicable` |
| | Field Provenance Dictionary Table | Detailed Table of Provenance Keys | Standard System Registry | `not_applicable` |
| | Central Legal Disclaimers & Caveats | Organization Custom Disclaimer | Master Legal Terms | `not_applicable` |
| | Parivahan Portal Integrity Statement | Official Parivahan Redirect URL | Standard Legal Policy | `not_applicable` |

---

## 3. Strict Verification & Provenance States

Every field displayed in VahanCheck PDF reports is tagged with one of the following authoritative states:
- `physically_verified`: Validated in-person by an inspector (e.g. chassis stamping, tyre tread depth, odometer).
- `provider_reported`: Ingested directly from authorized national registry gateways (APISathi VAHAN / eChallan).
- `user_input`: Declared by requesting client or bank underwriter (e.g. loan account number).
- `restricted`: Withheld by government privacy regulations (e.g. unmasked residential address).
- `unavailable`: External provider did not return the attribute.
- `not_checked`: Checkpoint was skipped during inspection (Never defaulted to "Pass" or "Good").
- `not_applicable`: Component not present on this vehicle category (e.g. "Cargo Headboard" on a passenger sedan).
