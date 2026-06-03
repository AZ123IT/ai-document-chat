import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("introduces the AI Document Chat project foundation", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "AI Document Chat",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Upload documents, ask questions, and get grounded answers with source citations.",
      ),
    ).toBeInTheDocument();
  });
});
