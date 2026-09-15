<?php

namespace App\Services;

use App\Models\Metric;
use Illuminate\Validation\ValidationException;

class EntryWriter
{
    /**
     * Convert a generic submitted value into the correct typed entry columns
     * for the given metric, validating type and range.
     *
     * @param  string  $field  Dot/array key used in validation error messages.
     * @return array{value_numeric: float|null, value_scale: int|null, value_boolean: bool|null}
     *
     * @throws ValidationException
     */
    public function columnsFor(Metric $metric, mixed $value, string $field = 'value'): array
    {
        $columns = [
            'value_numeric' => null,
            'value_scale' => null,
            'value_boolean' => null,
        ];

        switch ($metric->type) {
            case 'numeric':
                if (! is_numeric($value)) {
                    $this->fail($field, 'The value must be a number.');
                }
                $columns['value_numeric'] = (float) $value;
                break;

            case 'scale':
                if (! is_numeric($value) || (int) $value != $value) {
                    $this->fail($field, 'The value must be a whole number.');
                }
                $int = (int) $value;
                if ($int < $metric->scale_min || $int > $metric->scale_max) {
                    $this->fail($field, "The value must be between {$metric->scale_min} and {$metric->scale_max}.");
                }
                $columns['value_scale'] = $int;
                break;

            case 'boolean':
                $columns['value_boolean'] = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? (bool) $value;
                break;
        }

        return $columns;
    }

    /**
     * @throws ValidationException
     */
    private function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}
