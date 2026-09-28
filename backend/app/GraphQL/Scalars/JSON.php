<?php

namespace App\GraphQL\Scalars;

use GraphQL\Error\Error;
use GraphQL\Language\AST\Node;
use GraphQL\Type\Definition\ScalarType;

/** Output-only JSON scalar for widget config; input is never accepted. */
class JSON extends ScalarType
{
    public function serialize($value): mixed
    {
        return $value;
    }

    public function parseValue($value): mixed
    {
        throw new Error('JSON is an output-only scalar.');
    }

    public function parseLiteral(Node $valueNode, ?array $variables = null): mixed
    {
        throw new Error('JSON is an output-only scalar.');
    }
}
