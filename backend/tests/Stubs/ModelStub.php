<?php

namespace Illuminate\Support {
    if (!class_exists('Illuminate\Support\Str')) {
        class Str
        {
            public static function random(int $length = 16): string
            {
                return substr(bin2hex(random_bytes((int) ceil($length / 2))), 0, $length);
            }

            public static function uuid(): string
            {
                return sprintf(
                    '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                    mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                    mt_rand(0, 0xffff),
                    mt_rand(0, 0x0fff) | 0x4000,
                    mt_rand(0, 0x3fff) | 0x8000,
                    mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
                );
            }
        }
    }

    if (!class_exists('Illuminate\Support\Collection')) {
        class Collection implements \ArrayAccess, \Countable, \IteratorAggregate
        {
            protected array $items = [];
            public function __construct(array $items = []) { $this->items = array_values($items); }
            public function map(callable $callback) {
                return new static(array_map($callback, $this->items));
            }
            public function filter(?callable $callback = null) {
                return new static(array_values(array_filter($this->items, $callback)));
            }
            public function toArray(): array {
                return array_map(function ($item) {
                    return is_object($item) && method_exists($item, 'toArray') ? $item->toArray() : $item;
                }, $this->items);
            }
            public function all(): array { return $this->items; }
            public function count(): int { return count($this->items); }
            public function first() { return $this->items[0] ?? null; }
            public function offsetExists($offset): bool { return isset($this->items[$offset]); }
            public function offsetGet($offset): mixed { return $this->items[$offset] ?? null; }
            public function offsetSet($offset, $value): void { if (is_null($offset)) { $this->items[] = $value; } else { $this->items[$offset] = $value; } }
            public function offsetUnset($offset): void { unset($this->items[$offset]); }
            public function getIterator(): \Traversable { return new \ArrayIterator($this->items); }
        }
    }
}

namespace Illuminate\Support\Facades {
    if (!class_exists('Illuminate\Support\Facades\DB')) {
        class DB
        {
            public static function transaction(callable $callback)
            {
                return call_user_func($callback);
            }
        }
    }
}

namespace Illuminate\Database\Eloquent\Concerns {
    if (!trait_exists('Illuminate\Database\Eloquent\Concerns\HasUuids')) {
        trait HasUuids {}
    }
}

namespace Illuminate\Database\Eloquent\Factories {
    if (!trait_exists('Illuminate\Database\Eloquent\Factories\HasFactory')) {
        trait HasFactory {}
    }
}

namespace Illuminate\Database\Eloquent\Relations {
    if (!class_exists('Illuminate\Database\Eloquent\Relations\BelongsTo')) {
        class BelongsTo
        {
            public function get()
            {
                return null;
            }
        }
    }

    if (!class_exists('Illuminate\Database\Eloquent\Relations\HasMany')) {
        class HasMany
        {
            public function get()
            {
                return [];
            }
        }
    }
}

namespace Illuminate\Database\Eloquent {
    if (!class_exists('Illuminate\Database\Eloquent\Builder')) {
        class Builder
        {
            public function where($col, $val = null)
            {
                return $this;
            }

            public function getModel()
            {
                return new class {
                    public function getTable()
                    {
                        return 'table';
                    }
                };
            }
        }
    }

    if (!trait_exists('Illuminate\Database\Eloquent\SoftDeletes')) {
        trait SoftDeletes {}
    }

    if (!class_exists('Illuminate\Database\Eloquent\Model')) {
        #[\AllowDynamicProperties]
        abstract class Model
        {
            protected static array $storage = [];

            protected $attributes = [];
            protected $fillable = [];
            protected $casts = [];
            protected array $conditions = [];

            public function __construct(array $attributes = [])
            {
                $this->attributes = $attributes;
                foreach ($attributes as $key => $val) {
                    $this->$key = $val;
                }
            }

            public function __get(string $name)
            {
                return $this->attributes[$name] ?? null;
            }

            public function __set(string $name, $value): void
            {
                $this->attributes[$name] = $value;
                $this->$name = $value;
            }

            public function __isset(string $name): bool
            {
                return isset($this->attributes[$name]);
            }

            public static function boot(): void {}
            public static function booted(): void {}
            public static function addGlobalScope($name, $scope): void {}
            public static function creating($callback): void {}
            public static function created($callback): void {}
            public static function updating($callback): void {}
            public static function updated($callback): void {}

            public function getTable(): string
            {
                $class = static::class;
                $parts = explode('\\', $class);
                return strtolower(end($parts)) . 's';
            }

            public static function __callStatic($method, $parameters)
            {
                $instance = new static();
                return $instance->__call($method, $parameters);
            }

            public function __call($method, $parameters)
            {
                if (in_array($method, ['with', 'whereIn', 'lockForUpdate', 'orderBy', 'limit'])) {
                    return $this;
                }
                return $this;
            }

            public static function query()
            {
                return new static();
            }

            public static function where($col, $val = null)
            {
                $instance = new static();
                $instance->conditions[$col] = $val;
                return $instance;
            }

            public function whereNull(string $col)
            {
                $this->conditions[$col] = null;
                return $this;
            }

            public function lockForUpdate()
            {
                return $this;
            }

            public function orderBy($col, $dir = 'asc')
            {
                return $this;
            }

            public function limit($n)
            {
                return $this;
            }

            public function get()
            {
                $items = self::$storage[static::class] ?? [];
                $filtered = [];
                foreach ($items as $item) {
                    $matches = true;
                    foreach ($this->conditions as $col => $expected) {
                        $actual = $item->attributes[$col] ?? $item->$col ?? null;
                        if ($expected === null) {
                            if ($actual !== null) {
                                $matches = false;
                                break;
                            }
                        } else {
                            if ($actual != $expected) {
                                $matches = false;
                                break;
                            }
                        }
                    }
                    if ($matches) {
                        $filtered[] = $item;
                    }
                }
                return new \Illuminate\Support\Collection($filtered);
            }

            public function first()
            {
                $res = $this->get();
                return $res[0] ?? null;
            }

            public function firstOrFail()
            {
                $res = $this->first();
                if (!$res) {
                    throw new \Exception("Record not found");
                }
                return $res;
            }

            public function count(): int
            {
                return count($this->get());
            }

            public static function find($id)
            {
                return self::$storage[static::class][$id] ?? new static(['id' => $id]);
            }

            public static function create(array $attrs)
            {
                $instance = new static($attrs);
                $instance->save();
                return $instance;
            }

            public function fill(array $attributes = []): self
            {
                foreach ($attributes as $k => $v) {
                    $this->attributes[$k] = $v;
                    $this->$k = $v;
                }
                return $this;
            }

            public function belongsTo($related, $foreignKey = null, $ownerKey = null)
            {
                return new \Illuminate\Database\Eloquent\Relations\BelongsTo();
            }

            public function hasMany($related, $foreignKey = null, $localKey = null)
            {
                return new \Illuminate\Database\Eloquent\Relations\HasMany();
            }

            public function save(): bool
            {
                if (empty($this->id)) {
                    $this->id = (string) \Illuminate\Support\Str::uuid();
                }
                self::$storage[static::class][$this->id] = $this;
                return true;
            }

            public function update(array $attributes = []): bool
            {
                foreach ($attributes as $k => $v) {
                    $this->attributes[$k] = $v;
                    $this->$k = $v;
                }
                return $this->save();
            }

            public function toArray(): array
            {
                return $this->attributes;
            }
        }
    }
}

namespace Laravel\Sanctum {
    if (!trait_exists('Laravel\Sanctum\HasApiTokens')) {
        trait HasApiTokens {}
    }
}

namespace Illuminate\Notifications {
    if (!trait_exists('Illuminate\Notifications\Notifiable')) {
        trait Notifiable {}
    }
}

namespace Illuminate\Foundation\Auth {
    if (!class_exists('Illuminate\Foundation\Auth\User')) {
        class User extends \Illuminate\Database\Eloquent\Model {}
    }
}

namespace {
    if (!function_exists('auth')) {
        function auth()
        {
            return new class {
                public function check(): bool
                {
                    return false;
                }
                public function user()
                {
                    return null;
                }
            };
        }
    }

    if (!function_exists('now')) {
        function now()
        {
            return new class {
                public function toISOString(): string { return date('c'); }
                public function toDateTimeString(): string { return date('Y-m-d H:i:s'); }
                public function format(string $f): string { return date($f); }
                public function __toString(): string { return date('Y-m-d H:i:s'); }
            };
        }
    }

    if (!function_exists('collect')) {
        function collect(array $items = [])
        {
            return new \Illuminate\Support\Collection($items);
        }
    }
}
