# Future TODOs

- **Send current plan in regenerate request**: Include the current plan JSON in the `POST /api/sections/:id/plan/regenerate` payload and pass it to the regeneration prompt, so the AI can see what the user already has and make targeted adjustments instead of generating from scratch.
- **Improve embedding chunking**: Ensure the text chunking algorithm never splits a word into two separate chunks — always break at word boundaries.
- **Smarter problem-aware retrieval**: Make the embedding and retrieval process more efficient by ensuring each problem is always placed in its own chunk(s). When a chunk belonging to a problem is retrieved via similarity search, return the entire problem (and its solution, if available) rather than just the matched chunk.
- **Improve the made-up user message for "sent" state**: Make the synthetic first user message more natural so the LLM response feels organic — ideally the AI starts by briefly summarizing what the student will learn in the session before diving in.
- **Fix chat language matching**: The AI is not following the instruction to match the language of the last user message. Investigate and fix the language detection/switching behavior in chat responses.
- **Fix text reset on tool calls**: When the LLM makes a tool call, the streamed text resets and the message isn't fully shown. The partial content before the tool call gets lost.
- **Hide tool calls from the user**: Tool calls (e.g., `searchStudentMaterials`) should be invisible to the user — the AI response should appear as a seamless stream of text with no indication that a tool was invoked.
