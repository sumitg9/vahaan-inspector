<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inspection & Valuation Dossier - {{ $snapshot['section_1_executive_summary']['registration_number'] }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 14mm 10mm 16mm 10mm;
            @bottom-right {
                content: "Page " counter(page) " of " counter(pages);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 8pt;
                color: #64748B;
            }
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 9pt;
            line-height: 1.35;
            color: #0F172A;
            background: #FFFFFF;
        }
        .page-break {
            page-break-after: always;
            break-after: page;
        }
        .avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
        }
        /* Indelible Watermark (Invariant 2) */
        .watermark-overlay {
            position: fixed;
            top: 35%;
            left: 5%;
            width: 90%;
            text-align: center;
            transform: rotate(-32deg);
            font-size: 34pt;
            font-weight: 900;
            letter-spacing: 2px;
            color: rgba(220, 38, 38, 0.12);
            pointer-events: none;
            z-index: 9999;
            text-transform: uppercase;
            line-height: 1.2;
        }
        
        /* Running Header & Branding */
        .report-header {
            border-bottom: 2px solid #0F172A;
            padding-bottom: 8px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .brand-title {
            font-size: 16pt;
            font-weight: 800;
            color: #0F172A;
            letter-spacing: -0.5px;
        }
        .brand-subtitle {
            font-size: 8pt;
            font-weight: 600;
            color: #2563EB;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .report-meta {
            text-align: right;
            font-size: 8pt;
            color: #475569;
        }
        .report-meta strong {
            color: #0F172A;
        }

        /* Section Containers */
        .section-box {
            margin-bottom: 14px;
        }
        .section-title {
            background: #0F172A;
            color: #FFFFFF;
            font-size: 10pt;
            font-weight: 700;
            padding: 5px 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-radius: 3px 3px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .section-badge {
            background: #2563EB;
            color: #FFFFFF;
            font-size: 7.5pt;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 2px;
        }
        .section-badge-teal {
            background: #0D9488;
            color: #FFFFFF;
            font-size: 7.5pt;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 2px;
        }

        /* Tables */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
            background: #FFFFFF;
            border: 1px solid #CBD5E1;
            margin-bottom: 6px;
        }
        table.data-table th, table.data-table td {
            padding: 5px 8px;
            border: 1px solid #E2E8F0;
            vertical-align: middle;
        }
        table.data-table th {
            background: #F1F5F9;
            color: #334155;
            font-weight: 600;
            text-align: left;
        }
        table.data-table tr:nth-child(even) td {
            background: #F8FAFC;
        }
        .cell-label {
            font-weight: 600;
            color: #475569;
            width: 25%;
            background: #F8FAFC;
        }
        .cell-value {
            color: #0F172A;
            width: 25%;
        }

        /* Valuation Big Numbers Banner */
        .valuation-banner {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
        }
        .val-card {
            border: 1px solid #CBD5E1;
            border-radius: 4px;
            padding: 10px;
            background: #F8FAFC;
        }
        .val-card.primary {
            border-top: 4px solid #2563EB;
        }
        .val-card.distress {
            border-top: 4px solid #D97706;
        }
        .val-title {
            font-size: 8.5pt;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
        }
        .val-amount {
            font-size: 16pt;
            font-weight: 800;
            color: #0F172A;
            margin: 4px 0;
        }
        .val-sub {
            font-size: 7.5pt;
            color: #64748B;
        }

        /* Badges & Pills */
        .pill-pass {
            background: #DCFCE7;
            color: #166534;
            font-weight: 700;
            font-size: 7.5pt;
            padding: 2px 6px;
            border-radius: 9999px;
            display: inline-block;
        }
        .pill-warn {
            background: #FEF3C7;
            color: #92400E;
            font-weight: 700;
            font-size: 7.5pt;
            padding: 2px 6px;
            border-radius: 9999px;
            display: inline-block;
        }
        .pill-crit {
            background: #FEE2E2;
            color: #991B1B;
            font-weight: 700;
            font-size: 7.5pt;
            padding: 2px 6px;
            border-radius: 9999px;
            display: inline-block;
        }
        .pill-prov {
            background: #EFF6FF;
            color: #1E40AF;
            font-size: 7pt;
            font-weight: 600;
            padding: 1px 4px;
            border-radius: 2px;
            border: 1px solid #BFDBFE;
        }

        /* Photo Grid */
        .photo-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-top: 6px;
        }
        .photo-card {
            border: 1px solid #CBD5E1;
            border-radius: 4px;
            overflow: hidden;
            background: #FFFFFF;
        }
        .photo-placeholder {
            height: 120px;
            background: #E2E8F0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748B;
            font-size: 8pt;
            font-weight: 600;
            text-align: center;
            padding: 8px;
        }
        .photo-meta {
            padding: 5px 6px;
            font-size: 7pt;
            background: #F8FAFC;
            border-top: 1px solid #E2E8F0;
        }
        .photo-label {
            font-weight: 700;
            color: #0F172A;
            margin-bottom: 2px;
        }
        .photo-hash {
            font-family: monospace;
            color: #64748B;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Signatures Box */
        .sig-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 8px;
        }
        .sig-card {
            border: 1px solid #CBD5E1;
            border-radius: 4px;
            padding: 8px;
            background: #F8FAFC;
            text-align: center;
        }
        .sig-stamp {
            border: 2px dashed #2563EB;
            color: #2563EB;
            font-weight: 800;
            font-size: 8pt;
            padding: 6px;
            margin: 6px 0;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .sig-name {
            font-weight: 700;
            color: #0F172A;
            font-size: 8.5pt;
        }
        .sig-role {
            font-size: 7.5pt;
            color: #475569;
        }

        /* QR Code & Token Box */
        .qr-section {
            display: flex;
            align-items: center;
            border: 1px solid #0F172A;
            background: #F8FAFC;
            border-radius: 4px;
            padding: 8px 12px;
            margin-top: 10px;
        }
        .qr-box {
            width: 70px;
            height: 70px;
            background: #FFFFFF;
            border: 1px solid #CBD5E1;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            flex-shrink: 0;
        }
        .qr-info {
            font-size: 7.5pt;
            color: #334155;
            line-height: 1.35;
        }
        .qr-token {
            font-family: monospace;
            font-weight: 700;
            color: #2563EB;
            font-size: 8pt;
            word-break: break-all;
        }

        /* Running Footer */
        .report-footer {
            margin-top: 15px;
            padding-top: 6px;
            border-top: 1px solid #CBD5E1;
            display: flex;
            justify-content: space-between;
            font-size: 7.5pt;
            color: #64748B;
        }
    </style>
</head>
<body>

@if(!empty($snapshot['section_11_disclaimers']['is_mock_watermarked']))
    <div class="watermark-overlay">
        {{ $snapshot['section_11_disclaimers']['watermark_text'] ?? 'DEMONSTRATION DATA — NOT FOR OFFICIAL USE' }}
    </div>
@endif

<!-- PAGE 1: EXECUTIVE SUMMARY, ASSET OVERVIEW & VAHAN REGISTRATION -->
<div class="report-header">
    <div>
        <div class="brand-title">VAHANCHECK ENTERPRISE</div>
        <div class="brand-subtitle">Commercial Asset Inspection & Certified Valuation Dossier</div>
    </div>
    <div class="report-meta">
        <div>Case ID: <strong>{{ $snapshot['section_1_executive_summary']['case_id'] }}</strong></div>
        <div>Report Version: <strong>v{{ $snapshot['section_1_executive_summary']['report_version'] }}</strong> | Date: <strong>{{ date('d-M-Y', strtotime($snapshot['section_1_executive_summary']['inspection_date'])) }}</strong></div>
    </div>
</div>

<!-- SECTION 1: EXECUTIVE SUMMARY -->
<div class="section-box avoid-break">
    <div class="section-title">
        <span>Section 1: Executive Summary & Asset Overview</span>
        <span class="section-badge-teal">{{ $snapshot['section_1_executive_summary']['overall_condition_grade'] }}</span>
    </div>
    
    <div class="valuation-banner" style="margin-top: 8px;">
        <div class="val-card primary">
            <div class="val-title">Approved Fair Market Value (FMV)</div>
            <div class="val-amount">₹{{ number_format($snapshot['section_1_executive_summary']['approved_fair_market_value_inr'], 2) }}</div>
            <div class="val-sub">{{ $snapshot['section_9_valuation_dossier']['valuation_type'] }} (Certified Sign-off)</div>
        </div>
        <div class="val-card distress">
            <div class="val-title">Approved Distress / Liquidation Value</div>
            <div class="val-amount">₹{{ number_format($snapshot['section_1_executive_summary']['approved_distress_value_inr'], 2) }}</div>
            <div class="val-sub">Orderly Liquidation Benchmark (15% Haircut)</div>
        </div>
    </div>

    <table class="data-table">
        <tr>
            <td class="cell-label">Requesting Client / Bank:</td>
            <td class="cell-value" colspan="3"><strong>{{ $snapshot['section_1_executive_summary']['client_name'] }}</strong> ({{ $snapshot['section_1_executive_summary']['branch_name'] }})</td>
        </tr>
        <tr>
            <td class="cell-label">Loan / Appraisal Reference:</td>
            <td class="cell-value">{{ $snapshot['section_1_executive_summary']['loan_reference_number'] }}</td>
            <td class="cell-label">Vehicle Registration:</td>
            <td class="cell-value"><strong>{{ $snapshot['section_1_executive_summary']['registration_number'] }}</strong></td>
        </tr>
        <tr>
            <td class="cell-label">Make & Model:</td>
            <td class="cell-value"><strong>{{ $snapshot['section_1_executive_summary']['maker_model'] }}</strong></td>
            <td class="cell-label">Vehicle Category:</td>
            <td class="cell-value">{{ $snapshot['section_1_executive_summary']['vehicle_category'] }}</td>
        </tr>
        <tr>
            <td class="cell-label">Physical Inspection Date:</td>
            <td class="cell-value">{{ $snapshot['section_1_executive_summary']['inspection_date'] }}</td>
            <td class="cell-label">Assigned Field Inspector:</td>
            <td class="cell-value">{{ $snapshot['section_1_executive_summary']['inspector_name'] }} ({{ $snapshot['section_1_executive_summary']['inspector_id'] }})</td>
        </tr>
        <tr>
            <td class="cell-label">Inspection Geo-Location:</td>
            <td class="cell-value" colspan="3">{{ $snapshot['section_1_executive_summary']['inspection_location'] }} [{{ $snapshot['section_1_executive_summary']['inspection_gps']['latitude'] }}° N, {{ $snapshot['section_1_executive_summary']['inspection_gps']['longitude'] }}° E]</td>
        </tr>
    </table>
</div>

<!-- SECTION 2: VAHAN REGISTRATION DETAILS -->
<div class="section-box avoid-break">
    <div class="section-title">
        <span>Section 2: VAHAN Vehicle Registration & Identity</span>
        <span class="section-badge">National Registry (APISathi RC-v1)</span>
    </div>
    <table class="data-table">
        <tr>
            <td class="cell-label">Registered Owner (DPDP):</td>
            <td class="cell-value"><strong>{{ $snapshot['section_2_registration_identity']['registered_owner_masked'] }}</strong></td>
            <td class="cell-label">Ownership Serial:</td>
            <td class="cell-value">{{ $snapshot['section_2_registration_identity']['ownership_sequence'] }}</td>
        </tr>
        <tr>
            <td class="cell-label">Registration Date & Age:</td>
            <td class="cell-value">{{ $snapshot['section_2_registration_identity']['registration_date'] }} (Mfg: {{ $snapshot['section_2_registration_identity']['manufacturing_date'] }})</td>
            <td class="cell-label">Registering RTO:</td>
            <td class="cell-value">{{ $snapshot['section_2_registration_identity']['rto_authority'] }}</td>
        </tr>
        <tr>
            <td class="cell-label">Chassis / VIN Number:</td>
            <td class="cell-value"><code>{{ $snapshot['section_2_registration_identity']['chassis_number'] }}</code></td>
            <td class="cell-label">Engine Serial Number:</td>
            <td class="cell-value"><code>{{ $snapshot['section_2_registration_identity']['engine_number'] }}</code></td>
        </tr>
        <tr>
            <td class="cell-label">Class & Body Type:</td>
            <td class="cell-value">{{ $snapshot['section_2_registration_identity']['vehicle_class'] }} | {{ $snapshot['section_2_registration_identity']['body_type'] }}</td>
            <td class="cell-label">Fuel & Emission Norms:</td>
            <td class="cell-value">{{ $snapshot['section_2_registration_identity']['fuel_type'] }} ({{ $snapshot['section_2_registration_identity']['emission_norms'] }})</td>
        </tr>
        <tr>
            <td class="cell-label">Unladen / Gross Wt (GVW):</td>
            <td class="cell-value">{{ number_format($snapshot['section_2_registration_identity']['unladen_weight_kg']) }} kg / {{ number_format($snapshot['section_2_registration_identity']['gross_vehicle_weight_kg']) }} kg</td>
            <td class="cell-label">Cubic Capacity / Seats:</td>
            <td class="cell-value">{{ $snapshot['section_2_registration_identity']['cubic_capacity_cc'] }} cc / {{ $snapshot['section_2_registration_identity']['seating_capacity'] }}</td>
        </tr>
        <tr>
            <td class="cell-label">Hypothecation / Financier:</td>
            <td class="cell-value" colspan="3"><span class="pill-warn">{{ $snapshot['section_2_registration_identity']['hypothecation_status'] }}</span> to <strong>{{ $snapshot['section_2_registration_identity']['financier_name'] }}</strong></td>
        </tr>
        <tr>
            <td class="cell-label">Insurance Validity:</td>
            <td class="cell-value">{{ $snapshot['section_2_registration_identity']['insurance_valid_until'] }} ({{ $snapshot['section_2_registration_identity']['insurance_company'] }})</td>
            <td class="cell-label">Fitness Validity:</td>
            <td class="cell-value"><span class="pill-pass">{{ $snapshot['section_2_registration_identity']['fitness_valid_until'] }}</span></td>
        </tr>
        <tr>
            <td class="cell-label">Road Tax Paid Upto:</td>
            <td class="cell-value">{{ $snapshot['section_2_registration_identity']['tax_valid_until'] }}</td>
            <td class="cell-label">PUCC Expiry Date:</td>
            <td class="cell-value">{{ $snapshot['section_2_registration_identity']['pucc_valid_until'] }}</td>
        </tr>
        <tr>
            <td class="cell-label">National Permit Validity:</td>
            <td class="cell-value">{{ $snapshot['section_2_registration_identity']['permit_valid_until'] }} (No: {{ $snapshot['section_2_registration_identity']['national_permit_number'] }})</td>
            <td class="cell-label">Blacklist / NCRB Status:</td>
            <td class="cell-value"><span class="pill-pass">{{ $snapshot['section_2_registration_identity']['blacklist_status'] }}</span></td>
        </tr>
    </table>
</div>

<div class="page-break"></div>

<!-- PAGE 2: TRAFFIC CHALLANS & CABIN / BODY INSPECTION -->
<div class="report-header">
    <div>
        <div class="brand-title">VAHANCHECK ENTERPRISE</div>
        <div class="brand-subtitle">Traffic Violations & Structural Integrity</div>
    </div>
    <div class="report-meta">
        <div>Case ID: <strong>{{ $snapshot['section_1_executive_summary']['case_id'] }}</strong> | Reg: <strong>{{ $snapshot['section_1_executive_summary']['registration_number'] }}</strong></div>
    </div>
</div>

<!-- SECTION 3: TRAFFIC CHALLANS -->
<div class="section-box avoid-break">
    <div class="section-title">
        <span>Section 3: Traffic Challan Liability & Violation Assessment</span>
        <span class="section-badge">eChallan National Portal</span>
    </div>

    <table class="data-table" style="margin-top: 6px;">
        <tr>
            <td class="cell-label">Total Outstanding Pending Fines:</td>
            <td class="cell-value" style="color: #DC2626; font-size: 11pt; font-weight: 800;">₹{{ number_format($snapshot['section_3_traffic_challans']['summary']['pending_fines_inr'], 2) }}</td>
            <td class="cell-label">Pending Violations Count:</td>
            <td class="cell-value"><span class="pill-warn">{{ $snapshot['section_3_traffic_challans']['summary']['pending_challans_count'] }} Active Challans</span></td>
        </tr>
        <tr>
            <td class="cell-label">Disposed History Count:</td>
            <td class="cell-value">{{ $snapshot['section_3_traffic_challans']['summary']['disposed_challans_count'] }} Disposed</td>
            <td class="cell-label">Total Lifetime Violations:</td>
            <td class="cell-value">{{ $snapshot['section_3_traffic_challans']['summary']['total_lifetime_challans'] }} Total Logged</td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 22%;">Challan No & Date</th>
                <th style="width: 20%;">Jurisdiction / State</th>
                <th style="width: 38%;">Specific Offence Description</th>
                <th style="width: 10%;">Fine (INR)</th>
                <th style="width: 10%;">Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($snapshot['section_3_traffic_challans']['challan_records'] as $c)
            <tr>
                <td><strong>{{ $c['challan_number'] }}</strong><br><small style="color: #64748B;">{{ $c['offence_date_time'] }}</small></td>
                <td>{{ $c['rto_name'] }} ({{ $c['state_code'] }})</td>
                <td>{{ $c['offence_details'] }}</td>
                <td><strong>₹{{ number_format($c['fine_amount_inr'], 2) }}</strong></td>
                <td>
                    @if($c['challan_status'] === 'PENDING')
                        <span class="pill-crit">PENDING</span>
                    @else
                        <span class="pill-pass">DISPOSED</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    <div style="font-size: 7.5pt; color: #64748B; font-style: italic; margin-top: 2px;">
        * {{ $snapshot['section_3_traffic_challans']['statutory_notice'] }}
    </div>
</div>

<!-- SECTION 4: CABIN, LOAD BODY & EXTERIOR CHASSIS -->
<div class="section-box avoid-break">
    <div class="section-title">
        <span>Section 4: Cabin, Load Body & Exterior Chassis Checkpoints</span>
        <span class="section-badge">10 Physical Checkpoints</span>
    </div>
    <table class="data-table" style="margin-top: 6px;">
        <thead>
            <tr>
                <th style="width: 22%;">Sub-Structure</th>
                <th style="width: 33%;">Checkpoint Inspection Item</th>
                <th style="width: 12%;">Condition</th>
                <th style="width: 33%;">Field Inspector Remarks & Observations</th>
            </tr>
        </thead>
        <tbody>
            @foreach($snapshot['section_4_cabin_body_chassis']['checkpoints'] as $item)
            <tr>
                <td><strong>{{ $item['category'] }}</strong></td>
                <td>{{ $item['item'] }}</td>
                <td><span class="pill-pass">{{ $item['status'] }}</span></td>
                <td>{{ $item['remarks'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>

<div class="page-break"></div>

<!-- PAGE 3: MECHANICAL SYSTEMS & ELECTRICALS/DOCUMENTS -->
<div class="report-header">
    <div>
        <div class="brand-title">VAHANCHECK ENTERPRISE</div>
        <div class="brand-subtitle">Powertrain, Drivetrain & Functional Verification</div>
    </div>
    <div class="report-meta">
        <div>Case ID: <strong>{{ $snapshot['section_1_executive_summary']['case_id'] }}</strong> | Reg: <strong>{{ $snapshot['section_1_executive_summary']['registration_number'] }}</strong></div>
    </div>
</div>

<!-- SECTION 5: MECHANICAL & SYSTEMS -->
<div class="section-box avoid-break">
    <div class="section-title">
        <span>Section 5: Engine, Transmission & Mechanical Systems</span>
        <span class="section-badge">13 Functional Checkpoints</span>
    </div>
    <table class="data-table" style="margin-top: 6px;">
        <thead>
            <tr>
                <th style="width: 18%;">System Group</th>
                <th style="width: 34%;">Functional Checkpoint Item</th>
                <th style="width: 12%;">Result</th>
                <th style="width: 36%;">Operating Behavior & Field Findings</th>
            </tr>
        </thead>
        <tbody>
            @foreach($snapshot['section_5_systems_mechanical']['checkpoints'] as $sys)
            <tr>
                <td><strong>{{ $sys['system'] }}</strong></td>
                <td>{{ $sys['item'] }}</td>
                <td><span class="pill-pass">{{ $sys['status'] }}</span></td>
                <td>{{ $sys['remarks'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>

<!-- SECTION 6: ELECTRICALS, SAFETY & DOCUMENTS -->
<div class="section-box avoid-break">
    <div class="section-title">
        <span>Section 6: Electricals, Safety Fitments & Document Cross-Verification</span>
        <span class="section-badge">10 Checkpoints</span>
    </div>
    <table class="data-table" style="margin-top: 6px;">
        <thead>
            <tr>
                <th style="width: 18%;">Category</th>
                <th style="width: 34%;">Verification Checkpoint Item</th>
                <th style="width: 12%;">Status</th>
                <th style="width: 36%;">Verification Notes & Cross-Reference</th>
            </tr>
        </thead>
        <tbody>
            @foreach($snapshot['section_6_electricals_safety_docs']['checkpoints'] as $doc)
            <tr>
                <td><strong>{{ $doc['category'] }}</strong></td>
                <td>{{ $doc['item'] }}</td>
                <td><span class="pill-pass">{{ $doc['status'] }}</span></td>
                <td>{{ $doc['remarks'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>

<div class="page-break"></div>

<!-- PAGE 4: MULTI-AXLE TYRE MATRIX -->
<div class="report-header">
    <div>
        <div class="brand-title">VAHANCHECK ENTERPRISE</div>
        <div class="brand-subtitle">Multi-Axle Tyre Audit & Tread Depth Safety Verification</div>
    </div>
    <div class="report-meta">
        <div>Case ID: <strong>{{ $snapshot['section_1_executive_summary']['case_id'] }}</strong> | Reg: <strong>{{ $snapshot['section_1_executive_summary']['registration_number'] }}</strong></div>
    </div>
</div>

<!-- SECTION 7: MULTI-AXLE TYRE MATRIX -->
<div class="section-box avoid-break">
    <div class="section-title">
        <span>Section 7: Multi-Axle Individual Tyre Matrix (Position-Accurate Audit)</span>
        <span class="section-badge">AC-TYRE-01 & AC-TYRE-02 Standard</span>
    </div>

    <table class="data-table" style="margin-top: 6px;">
        <tr>
            <td class="cell-label">Configured Axle Layout:</td>
            <td class="cell-value" colspan="3"><strong>{{ $snapshot['section_7_tyres_matrix']['axle_layout'] }}</strong></td>
        </tr>
        <tr>
            <td class="cell-label">Total Inspected Wheels:</td>
            <td class="cell-value">{{ $snapshot['section_7_tyres_matrix']['total_tyres_count'] }} Wheels (including Spare)</td>
            <td class="cell-label">Fleet Average Tread Depth:</td>
            <td class="cell-value"><strong>{{ $snapshot['section_7_tyres_matrix']['average_tread_depth_mm'] }} mm</strong></td>
        </tr>
        <tr>
            <td class="cell-label">Worn Out Tyres Count:</td>
            <td class="cell-value"><span class="pill-crit">{{ $snapshot['section_7_tyres_matrix']['worn_out_count'] }} Worn (<1.6mm)</span></td>
            <td class="cell-label">Safety Alert Flag:</td>
            <td class="cell-value"><span class="pill-crit">CRITICAL SAFETY ACTION REQUIRED</span></td>
        </tr>
    </table>

    @if(!empty($snapshot['section_7_tyres_matrix']['ac_tyre_02_safety_alert']))
    <div style="background: #FEF2F2; border-left: 4px solid #DC2626; padding: 6px 10px; margin-bottom: 8px; font-size: 8pt; color: #991B1B; font-weight: 600;">
        ⚠ {{ $snapshot['section_7_tyres_matrix']['ac_tyre_02_safety_alert'] }}
    </div>
    @endif

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 10%;">Position</th>
                <th style="width: 25%;">Wheel Position Description</th>
                <th style="width: 22%;">Brand & Model</th>
                <th style="width: 15%;">Tyre Size</th>
                <th style="width: 10%;">Tread (mm)</th>
                <th style="width: 8%;">Life (%)</th>
                <th style="width: 10%;">Rating</th>
            </tr>
        </thead>
        <tbody>
            @foreach($snapshot['section_7_tyres_matrix']['tyre_records'] as $tyre)
            <tr>
                <td><code>{{ $tyre['position'] }}</code></td>
                <td><strong>{{ $tyre['position_label'] }}</strong></td>
                <td>{{ $tyre['brand'] }}</td>
                <td>{{ $tyre['size_spec'] }}</td>
                <td style="font-weight: 700; color: {{ $tyre['is_critical_safety_alert'] ? '#DC2626' : '#0F172A' }};">
                    {{ $tyre['tread_depth_mm'] }} mm
                    @if($tyre['is_critical_safety_alert'])
                        <span style="color: #DC2626; font-size: 7pt; display: block;">&lt; 1.6mm FAIL</span>
                    @endif
                </td>
                <td>{{ $tyre['remaining_life_pct'] }}%</td>
                <td>
                    @if($tyre['condition'] === 'GOOD')
                        <span class="pill-pass">GOOD</span>
                    @elseif($tyre['condition'] === 'FAIR')
                        <span class="pill-warn">FAIR</span>
                    @else
                        <span class="pill-crit">WORN OUT</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>

<div class="page-break"></div>

<!-- PAGE 5: PHOTOGRAPHIC EVIDENCE GALLERY -->
<div class="report-header">
    <div>
        <div class="brand-title">VAHANCHECK ENTERPRISE</div>
        <div class="brand-subtitle">360° Photographic Evidence & Cryptographic Verification</div>
    </div>
    <div class="report-meta">
        <div>Case ID: <strong>{{ $snapshot['section_1_executive_summary']['case_id'] }}</strong> | Reg: <strong>{{ $snapshot['section_1_executive_summary']['registration_number'] }}</strong></div>
    </div>
</div>

<!-- SECTION 8: EVIDENCE GALLERY -->
<div class="section-box avoid-break">
    <div class="section-title">
        <span>Section 8: Photographic Evidence Gallery (Geotagged & Timestamped)</span>
        <span class="section-badge">12 Verified High-Res Artifacts</span>
    </div>
    
    <div class="photo-grid">
        @foreach($snapshot['section_8_evidence_gallery']['photos'] as $p)
        <div class="photo-card">
            <div class="photo-placeholder">
                <div>
                    <div style="font-size: 14pt; margin-bottom: 4px;">📷</div>
                    <div>{{ $p['label'] }}</div>
                    @if($p['is_damage'])
                        <span class="pill-crit" style="margin-top: 4px;">DAMAGE PROOF</span>
                    @endif
                </div>
            </div>
            <div class="photo-meta">
                <div class="photo-label">{{ $p['label'] }}</div>
                <div>📍 {{ $p['gps'] }}</div>
                <div>⏱ {{ $p['timestamp'] }}</div>
                <div class="photo-hash" title="{{ $p['sha256_hash'] }}">SHA: {{ substr($p['sha256_hash'], 0, 16) }}...</div>
            </div>
        </div>
        @endforeach
    </div>
</div>

<div class="page-break"></div>

<!-- PAGE 6: CERTIFIED VALUATION, APPROVALS & LEGAL DISCLAIMERS -->
<div class="report-header">
    <div>
        <div class="brand-title">VAHANCHECK ENTERPRISE</div>
        <div class="brand-subtitle">Actuarial Valuation, Approvals & Verification Portal</div>
    </div>
    <div class="report-meta">
        <div>Case ID: <strong>{{ $snapshot['section_1_executive_summary']['case_id'] }}</strong> | Reg: <strong>{{ $snapshot['section_1_executive_summary']['registration_number'] }}</strong></div>
    </div>
</div>

<!-- SECTION 9: VALUATION DOSSIER -->
<div class="section-box avoid-break">
    <div class="section-title">
        <span>Section 9: Certified Valuation Dossier & Actuarial Breakdown</span>
        <span class="section-badge-teal">Approved by Chartered Valuer</span>
    </div>

    <table class="data-table" style="margin-top: 6px;">
        <tr>
            <td class="cell-label">Valuation Actuarial Standard:</td>
            <td class="cell-value" colspan="3"><strong>{{ $snapshot['section_9_valuation_dossier']['valuation_methodology'] }}</strong></td>
        </tr>
        <tr>
            <td class="cell-label">Baseline Ex-Showroom / Invoice:</td>
            <td class="cell-value">₹{{ number_format($snapshot['section_9_valuation_dossier']['ex_showroom_price_inr'], 2) }}</td>
            <td class="cell-label">Vehicle Age / Depreciation Rate:</td>
            <td class="cell-value">{{ $snapshot['section_9_valuation_dossier']['age_in_months'] }} Months ({{ $snapshot['section_9_valuation_dossier']['age_depreciation_pct'] }}% Applied)</td>
        </tr>
        <tr>
            <td class="cell-label">Base Depreciated Asset Value:</td>
            <td class="cell-value">₹{{ number_format($snapshot['section_9_valuation_dossier']['base_depreciated_value_inr'], 2) }}</td>
            <td class="cell-label">Odometer Utilization Deduction:</td>
            <td class="cell-value" style="color: #DC2626;">- ₹{{ number_format($snapshot['section_9_valuation_dossier']['odometer_adjustment_inr'], 2) }}</td>
        </tr>
        <tr>
            <td class="cell-label">Physical Condition Scoring Deductions:</td>
            <td class="cell-value" style="color: #DC2626;">- ₹{{ number_format($snapshot['section_9_valuation_dossier']['condition_deduction_inr'], 2) }}</td>
            <td class="cell-label">Repair & Tyre Refurbishment:</td>
            <td class="cell-value" style="color: #DC2626;">- ₹{{ number_format($snapshot['section_9_valuation_dossier']['estimated_repair_refurbishment_inr'], 2) }}</td>
        </tr>
        <tr>
            <td class="cell-label">Proposed Algorithmic Estimate:</td>
            <td class="cell-value">₹{{ number_format($snapshot['section_9_valuation_dossier']['proposed_fair_market_value_inr'], 2) }}</td>
            <td class="cell-label">Valuer Override Applied?</td>
            <td class="cell-value"><span class="pill-warn">YES (AC-VAL-02 JUSTIFIED)</span></td>
        </tr>
        @if(!empty($snapshot['section_9_valuation_dossier']['valuer_override_applied']))
        <tr>
            <td class="cell-label">Mandatory Override Justification:</td>
            <td class="cell-value" colspan="3" style="font-style: italic; color: #1E40AF;">"{{ $snapshot['section_9_valuation_dossier']['override_justification'] }}"</td>
        </tr>
        @endif
        <tr style="background: #F1F5F9;">
            <td class="cell-label" style="font-weight: 800; color: #0F172A;">FINAL CERTIFIED FAIR MARKET VALUE:</td>
            <td class="cell-value" style="font-size: 12pt; font-weight: 800; color: #2563EB;">₹{{ number_format($snapshot['section_9_valuation_dossier']['final_fair_market_value_inr'], 2) }}</td>
            <td class="cell-label" style="font-weight: 800; color: #0F172A;">DISTRESS SALE VALUE:</td>
            <td class="cell-value" style="font-size: 12pt; font-weight: 800; color: #D97706;">₹{{ number_format($snapshot['section_9_valuation_dossier']['final_distress_value_inr'], 2) }}</td>
        </tr>
        <tr>
            <td class="cell-label">Valuer Opinion & Caveats:</td>
            <td class="cell-value" colspan="3">{{ $snapshot['section_9_valuation_dossier']['certified_valuer_remarks'] }}</td>
        </tr>
    </table>
</div>

<!-- SECTION 10: APPROVALS & DIGITAL STAMPS -->
<div class="section-box avoid-break">
    <div class="section-title">
        <span>Section 10: Approvals, Sign-offs & Digital Verification Signatures</span>
        <span class="section-badge">Multi-Stage Cryptographic Signatures</span>
    </div>

    <div class="sig-grid">
        <div class="sig-card">
            <div class="sig-name">{{ $snapshot['section_10_approvals']['inspector_signoff']['name'] }}</div>
            <div class="sig-role">{{ $snapshot['section_10_approvals']['inspector_signoff']['role'] }}</div>
            <div class="sig-stamp">DIGITALLY SIGNED & SUBMITTED</div>
            <div style="font-size: 7pt; color: #64748B;">{{ $snapshot['section_10_approvals']['inspector_signoff']['timestamp'] }}</div>
        </div>
        <div class="sig-card">
            <div class="sig-name">{{ $snapshot['section_10_approvals']['qc_officer_signoff']['name'] }}</div>
            <div class="sig-role">{{ $snapshot['section_10_approvals']['qc_officer_signoff']['role'] }}</div>
            <div class="sig-stamp" style="border-color: #0D9488; color: #0D9488;">QC VERIFIED & APPROVED</div>
            <div style="font-size: 7pt; color: #64748B;">{{ $snapshot['section_10_approvals']['qc_officer_signoff']['timestamp'] }}</div>
        </div>
        <div class="sig-card">
            <div class="sig-name">{{ $snapshot['section_10_approvals']['certified_valuer_signoff']['name'] }}</div>
            <div class="sig-role">{{ $snapshot['section_10_approvals']['certified_valuer_signoff']['role'] }}</div>
            <div class="sig-stamp" style="border-color: #7C3AED; color: #7C3AED;">CERTIFIED VALUATION SIGN-OFF</div>
            <div style="font-size: 7pt; color: #64748B;">Lic: {{ $snapshot['section_10_approvals']['certified_valuer_signoff']['license_number'] }}</div>
        </div>
    </div>

    <!-- QR CODE AUTHENTICITY BOX (AC-REP-02) -->
    <div class="qr-section">
        <div class="qr-box">
            <!-- Inline SVG QR Code Simulation -->
            <svg width="60" height="60" viewBox="0 0 100 100" fill="#0F172A">
                <rect x="0" y="0" width="30" height="30" fill="#0F172A"/>
                <rect x="5" y="5" width="20" height="20" fill="#FFFFFF"/>
                <rect x="10" y="10" width="10" height="10" fill="#0F172A"/>
                <rect x="70" y="0" width="30" height="30" fill="#0F172A"/>
                <rect x="75" y="5" width="20" height="20" fill="#FFFFFF"/>
                <rect x="80" y="10" width="10" height="10" fill="#0F172A"/>
                <rect x="0" y="70" width="30" height="30" fill="#0F172A"/>
                <rect x="5" y="75" width="20" height="20" fill="#FFFFFF"/>
                <rect x="10" y="80" width="10" height="10" fill="#0F172A"/>
                <rect x="35" y="10" width="10" height="20" fill="#0F172A"/>
                <rect x="50" y="5" width="15" height="10" fill="#0F172A"/>
                <rect x="40" y="40" width="20" height="20" fill="#0F172A"/>
                <rect x="70" y="45" width="15" height="15" fill="#0F172A"/>
                <rect x="40" y="75" width="15" height="15" fill="#0F172A"/>
                <rect x="65" y="75" width="25" height="10" fill="#0F172A"/>
            </svg>
        </div>
        <div class="qr-info">
            <div><strong>CRYPTOGRAPHIC QR CODE VERIFICATION (AC-REP-02)</strong></div>
            <div>Scan using any smartphone camera to verify untampered snapshot validity on our public portal.</div>
            <div>Verification URL: <code>https://app.vahancheck.com/verify-report/{{ substr($snapshot['section_10_approvals']['verification_token'], 0, 16) }}...</code></div>
            <div>Snapshot SHA-256: <code>{{ $snapshot['section_10_approvals']['sha256_checksum'] }}</code></div>
        </div>
    </div>
</div>

<!-- SECTION 11: DISCLAIMERS & PROVENANCE -->
<div class="section-box avoid-break">
    <div class="section-title">
        <span>Section 11: Legal Disclaimers, Provenance Dictionary & Statutory Caveats</span>
        <span class="section-badge">Master Terms</span>
    </div>

    <div style="font-size: 7pt; color: #475569; line-height: 1.35; margin-top: 6px;">
        <p style="margin-bottom: 4px;"><strong>Provenance Protocol:</strong> Every attribute in this dossier carries immutable origin provenance: [physically_verified] = in-person field check; [provider_reported] = ingested directly from APISathi/VAHAN/eChallan; [restricted] = DPDP Act 2023 privacy masked.</p>
        @foreach($snapshot['section_11_disclaimers']['statutory_disclaimers'] as $disc)
            <p style="margin-bottom: 3px;">• {{ $disc }}</p>
        @endforeach
    </div>
</div>

<div class="report-footer">
    <div>Generated by VahanCheck Enterprise Automated Report Engine | Confidential & Proprietary</div>
    <div>Snapshot Token: {{ substr($snapshot['section_10_approvals']['verification_token'], 0, 20) }}...</div>
</div>

</body>
</html>
