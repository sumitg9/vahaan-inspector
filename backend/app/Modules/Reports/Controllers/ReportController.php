<?php

namespace App\Modules\Reports\Controllers;

use App\Modules\Reports\Services\ReportPdfRenderService;
use App\Modules\Reports\Services\ReportSnapshotService;
use App\Modules\Reports\Services\ReportVerificationService;
use App\Modules\Valuation\Exceptions\ValuationNotApprovedException;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ReportController
{
    protected ReportSnapshotService $snapshotService;
    protected ReportPdfRenderService $renderService;
    protected ReportVerificationService $verificationService;

    public function __construct(
        ?ReportSnapshotService $snapshotService = null,
        ?ReportPdfRenderService $renderService = null,
        ?ReportVerificationService $verificationService = null
    ) {
        $this->snapshotService = $snapshotService ?? new ReportSnapshotService();
        $this->renderService = $renderService ?? new ReportPdfRenderService();
        $this->verificationService = $verificationService ?? new ReportVerificationService();
    }

    /**
     * Generate and freeze an immutable A4 report snapshot.
     */
    public function generate(Request $request, string $id): JsonResponse
    {
        $orgId = $request->header('X-Organization-Id', 'org-11111111-1111-1111-1111-111111111111');
        $userId = $request->header('X-User-Id', 'usr-qc-01');

        try {
            $snapshot = $this->snapshotService->generateSnapshot($id, $orgId, $userId);

            return response()->json([
                'success' => true,
                'message' => 'Immutable report snapshot generated successfully.',
                'data' => $snapshot,
            ], 201);
        } catch (ValuationNotApprovedException $e) {
            return response()->json([
                'success' => false,
                'error_code' => $e->getErrorCode(),
                'message' => $e->getMessage(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error_code' => 'ERR_REPORT_GEN_FAILED',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Retrieve the latest frozen report snapshot for an inspection case.
     */
    public function latest(Request $request, string $id): JsonResponse
    {
        $orgId = $request->header('X-Organization-Id', 'org-11111111-1111-1111-1111-111111111111');
        $snapshot = $this->snapshotService->getLatestSnapshot($id, $orgId);

        if (!$snapshot) {
            return response()->json([
                'success' => false,
                'error_code' => 'ERR_REPORT_NOT_FOUND',
                'message' => "No approved report snapshot found for case '{$id}'. Please generate an initial snapshot.",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $snapshot,
        ]);
    }

    /**
     * Retrieve a specific historical version snapshot.
     */
    public function getVersion(Request $request, string $id, string $version): JsonResponse
    {
        $orgId = $request->header('X-Organization-Id', 'org-11111111-1111-1111-1111-111111111111');
        $snapshot = $this->snapshotService->getSnapshotByVersion($id, $version, $orgId);

        if (!$snapshot) {
            return response()->json([
                'success' => false,
                'error_code' => 'ERR_REPORT_VERSION_NOT_FOUND',
                'message' => "Report snapshot version '{$version}' not found for case '{$id}'.",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $snapshot,
        ]);
    }

    /**
     * Download or stream the printable A4 HTML / PDF report.
     */
    public function download(Request $request, string $id): Response|JsonResponse
    {
        $orgId = $request->header('X-Organization-Id', 'org-11111111-1111-1111-1111-111111111111');
        $snapshot = $this->snapshotService->getLatestSnapshot($id, $orgId);

        if (!$snapshot) {
            return response()->json([
                'success' => false,
                'error_code' => 'ERR_REPORT_NOT_FOUND',
                'message' => "Report not found for case '{$id}'.",
            ], 404);
        }

        $format = strtolower($request->query('format', 'html'));
        if ($format === 'pdf') {
            $pdf = $this->renderService->renderPdf($snapshot['snapshot_data']);
            return response($pdf, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => "attachment; filename=\"vahancheck_inspection_{$id}_v{$snapshot['version']}.pdf\"",
            ]);
        }

        $html = $this->renderService->renderHtml($snapshot['snapshot_data']);
        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }

    /**
     * Public QR Code Verification Endpoint (AC-REP-02).
     */
    public function verifyPublic(string $token): JsonResponse
    {
        $verification = $this->verificationService->verifyToken($token);

        if (!$verification) {
            return response()->json([
                'success' => false,
                'error_code' => 'ERR_INVALID_VERIFICATION_TOKEN',
                'message' => 'The scanned verification token was not recognized or has expired. Please ensure you are scanning an authentic VahanCheck QR code.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Authentic report snapshot verified successfully.',
            'data' => $verification,
        ]);
    }
}
