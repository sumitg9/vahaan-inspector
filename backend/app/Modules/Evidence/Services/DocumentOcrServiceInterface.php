<?php

namespace App\Modules\Evidence\Services;

interface DocumentOcrServiceInterface
{
    /**
     * Perform OCR extraction on a document artifact.
     *
     * @param string $documentType e.g., RC_SMART_CARD, INSURANCE_POLICY, PUC_CERTIFICATE, FITNESS_CERTIFICATE
     * @param string $s3Key S3 object key or file path of document
     * @param array $options Configuration and hints
     * @return array Extracted metadata and structured fields
     */
    public function extractDocumentData(string $documentType, string $s3Key, array $options = []): array;
}
