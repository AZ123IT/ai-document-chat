import { readFileSync } from "node:fs";
import { join } from "node:path";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

describe("createServerSupabaseClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("creates a typed server client with the service role key", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-test-key";
    createClientMock.mockReturnValue({ from: vi.fn() });

    const { createServerSupabaseClient } = await import("./server");
    const result = createServerSupabaseClient();

    expect(result).toEqual({ from: expect.any(Function) });
    expect(createClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "server-only-test-key",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  });

  it("marks the service-role client module as server-only", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/supabase/server.ts"), {
      encoding: "utf8",
    });

    expect(source).toMatch(/^import "server-only";/);
  });

  it("rejects missing server Supabase configuration", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { createServerSupabaseClient } = await import("./server");

    expect(() => createServerSupabaseClient()).toThrow(
      "Missing NEXT_PUBLIC_SUPABASE_URL",
    );
  });
});
