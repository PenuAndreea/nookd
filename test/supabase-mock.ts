/**
 * A minimal stand-in for a Supabase PostgrestQueryBuilder: every chain method
 * (`.select()`, `.eq()`, `.order()`, ...) returns itself, and the chain is
 * awaitable — `await builder` resolves to `result`, matching how `src/api/*`
 * either awaits the whole chain directly or terminates it with `.single()`/
 * `.maybeSingle()`.
 *
 * Usage: `(supabase.from as jest.Mock).mockReturnValue(queryResult({ data, error: null }))`
 * after `jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }))`.
 */
export function queryResult<T>(result: { data: T; error: null } | { data: null; error: unknown }) {
    const builder: Record<string, jest.Mock> = {};

    const chainMethods = [
        'select', 'insert', 'upsert', 'update', 'delete',
        'eq', 'neq', 'not', 'in', 'is', 'gte', 'lte', 'order', 'limit',
    ];
    for (const method of chainMethods) {
        builder[method] = jest.fn(() => builder);
    }

    builder.single = jest.fn(() => Promise.resolve(result));
    builder.maybeSingle = jest.fn(() => Promise.resolve(result));
    // Makes `await builder` work when a caller never terminates the chain
    // with .single()/.maybeSingle() (e.g. `const { data, error } = await query`).
    (builder as unknown as PromiseLike<typeof result>).then = (onFulfilled) =>
        Promise.resolve(result).then(onFulfilled);

    return builder;
}
