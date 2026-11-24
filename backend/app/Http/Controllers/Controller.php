<?php

namespace App\Http\Controllers;

abstract class Controller
{
    /**
     * Standard success response wrapper.
     */
    protected function success(mixed $data = [], string $message = 'Success', int $status = 200)
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    /**
     * Standard error response wrapper.
     */
    protected function error(string $message, int $status = 400, array $errors = [])
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }
}
