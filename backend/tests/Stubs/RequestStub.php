<?php

namespace Illuminate\Http;

if (!class_exists('Illuminate\Http\Request')) {
    class Request
    {
        protected array $parameters = [];
        protected $userResolver = null;

        public function __construct(array $parameters = [])
        {
            $this->parameters = $parameters;
        }

        public static function create(string $uri, string $method = 'GET', array $parameters = []): self
        {
            return new self($parameters);
        }

        public function setUserResolver(callable $callback): self
        {
            $this->userResolver = $callback;
            return $this;
        }

        public function user()
        {
            return $this->userResolver ? call_user_func($this->userResolver) : null;
        }

        public function all(): array
        {
            return $this->parameters;
        }

        public function input(string $key, $default = null)
        {
            return $this->parameters[$key] ?? $default;
        }

        public function validate(array $rules): array
        {
            return $this->parameters;
        }

        public function ip(): string
        {
            return '127.0.0.1';
        }

        public function userAgent(): string
        {
            return 'VahanCheck-Test/1.0';
        }

        public function query(?string $key = null, $default = null)
        {
            if ($key === null) {
                return $this->parameters;
            }
            return $this->parameters[$key] ?? $default;
        }

        public function has(string $key): bool
        {
            return isset($this->parameters[$key]);
        }

        public function only($keys): array
        {
            return array_intersect_key($this->parameters, array_flip((array) $keys));
        }
    }
}
