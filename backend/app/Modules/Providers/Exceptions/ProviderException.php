<?php

namespace App\Modules\Providers\Exceptions;

use Exception;
use Throwable;

/**
 * Base Exception for all upstream gateway and provider failures.
 * Sanitizes sensitive credentials and internal stack traces.
 */
class ProviderException extends Exception
{
    protected ?string $provider;
    protected ?string $registrationNumber;
    protected int $httpStatusCode;

    public function __construct(
        string $message = "Upstream vehicle data provider error",
        int $code = 502,
        ?string $provider = null,
        ?string $registrationNumber = null,
        ?Throwable $previous = null
    ) {
        $this->provider = $provider;
        $this->registrationNumber = $registrationNumber;
        $this->httpStatusCode = $code >= 400 && $code <= 599 ? $code : 502;
        parent::__construct($message, $this->httpStatusCode, $previous);
    }

    public function getProvider(): ?string
    {
        return $this->provider;
    }

    public function getRegistrationNumber(): ?string
    {
        return $this->registrationNumber;
    }

    public function getHttpStatusCode(): int
    {
        return $this->httpStatusCode;
    }
}

class ProviderTimeoutException extends ProviderException
{
    protected int $timeoutSeconds;

    public function __construct(string $provider, string $registrationNumber, int $timeoutSeconds = 8)
    {
        $this->timeoutSeconds = $timeoutSeconds;
        parent::__construct(
            "Gateway timeout communicating with {$provider} upstream for registration {$registrationNumber} after {$timeoutSeconds}s",
            504,
            $provider,
            $registrationNumber
        );
    }

    public function getTimeoutSeconds(): int
    {
        return $this->timeoutSeconds;
    }
}

class ProviderRateLimitException extends ProviderException
{
    protected int $retryAfterSeconds;

    public function __construct(string $provider, int $retryAfterSeconds = 60)
    {
        $this->retryAfterSeconds = $retryAfterSeconds;
        parent::__construct(
            "Upstream rate limit exceeded for provider {$provider}. Retry after {$retryAfterSeconds} seconds.",
            429,
            $provider
        );
    }

    public function getRetryAfter(): int
    {
        return $this->retryAfterSeconds;
    }
}

class ProviderUnavailableException extends ProviderException
{
    public function __construct(string $provider, string $reason = "Service unavailable or provider credit balance exhausted")
    {
        parent::__construct("Provider {$provider} unavailable: {$reason}", 503, $provider);
    }
}

class VehicleNotFoundException extends ProviderException
{
    public function __construct(string $provider, string $registrationNumber)
    {
        parent::__construct("Vehicle registration {$registrationNumber} not found in central transport registry", 404, $provider, $registrationNumber);
    }
}

class ProviderConfigurationException extends ProviderException
{
    public function __construct(string $message)
    {
        parent::__construct($message, 502);
    }
}
