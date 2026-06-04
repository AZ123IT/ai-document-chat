import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

describe("Home", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the dashboard shell", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "AI Document Chat",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Upload document" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Documents" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ask your documents" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Source citations" })).toBeInTheDocument();
  });

  it("shows a selected PDF file without calling an upload endpoint", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}"),
    );

    render(<Home />);

    const file = new File(["Research notes"], "atlas-notes.pdf", {
      type: "application/pdf",
    });
    await user.upload(screen.getByLabelText("Choose document"), file);

    expect(screen.getByText("atlas-notes.pdf")).toBeInTheDocument();
    expect(screen.getByText("Staged locally")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a selected TXT file without calling an upload endpoint", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}"),
    );

    render(<Home />);

    const file = new File(["Research notes"], "atlas-notes.txt", {
      type: "text/plain",
    });
    await user.upload(screen.getByLabelText("Choose document"), file);

    expect(screen.getByText("atlas-notes.txt")).toBeInTheDocument();
    expect(screen.getByText("TXT - 14 B")).toBeInTheDocument();
    expect(screen.getByText("Staged locally")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a validation message for unsupported file types", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}"),
    );

    render(<Home />);

    const file = new File(["spreadsheet"], "budget.csv", {
      type: "text/csv",
    });
    fireEvent.change(screen.getByLabelText("Choose document"), {
      target: {
        files: [file],
      },
    });

    expect(
      screen.getByText("Only PDF and TXT files are supported."),
    ).toBeInTheDocument();
    expect(screen.queryByText("budget.csv")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects files when the extension and MIME type do not match", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}"),
    );

    render(<Home />);

    const file = new File(["Not really a PDF"], "notes.pdf", {
      type: "text/plain",
    });
    fireEvent.change(screen.getByLabelText("Choose document"), {
      target: {
        files: [file],
      },
    });

    expect(
      screen.getByText("Only PDF and TXT files are supported."),
    ).toBeInTheDocument();
    expect(screen.queryByText("notes.pdf")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits a chat question and renders the answer with source citations", async () => {
    const user = userEvent.setup();
    let resolveFetch: (response: Response) => void = () => {};
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockReturnValue(fetchPromise);

    render(<Home />);

    await user.type(
      screen.getByLabelText("Question"),
      "How does Atlas answer questions?",
    );
    await user.click(screen.getByRole("button", { name: "Send question" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: "How does Atlas answer questions?",
      }),
    });
    expect(screen.getByText("Generating answer...")).toBeInTheDocument();

    resolveFetch(
      Response.json({
        answer: "Atlas answers from uploaded document chunks. [1]",
        citations: [
          {
            label: "1",
            chunkId: 7,
            documentId: 3,
            fileName: "atlas.pdf",
            pageNumber: 2,
            startOffset: 10,
            endOffset: 54,
            similarity: 0.91,
            snippet: "Atlas answers from uploaded document chunks.",
          },
        ],
        sessionId: 55,
        messageIds: { user: 201, assistant: 202 },
      }),
    );

    expect(
      await screen.findByText("Atlas answers from uploaded document chunks. [1]"),
    ).toBeInTheDocument();
    expect(screen.getByText("atlas.pdf")).toBeInTheDocument();
    expect(screen.getByText("Page 2")).toBeInTheDocument();
    expect(
      screen.getByText("Atlas answers from uploaded document chunks."),
    ).toBeInTheDocument();
  });

  it("shows a clear error message when chat fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        {
          error: "Failed to run document chat",
        },
        {
          status: 500,
        },
      ),
    );

    render(<Home />);

    await user.type(screen.getByLabelText("Question"), "What failed?");
    await user.click(screen.getByRole("button", { name: "Send question" }));

    expect(
      await screen.findByText(
        "Unable to answer right now: Failed to run document chat",
      ),
    ).toBeInTheDocument();
  });
});
