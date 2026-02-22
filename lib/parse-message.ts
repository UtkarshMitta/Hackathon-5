/** Parses streamed agent text into structured blocks of tool calls and markdown content */

export type MessageBlock =
  | { type: 'tool-call'; toolName: string; isLast: boolean }
  | { type: 'content'; text: string };

/**
 * Parse raw assistant text into ordered blocks.
 * Tool calls look like: [Calling tool: scanPortfolio...]
 * Everything else is markdown content.
 */
export function parseMessageBlocks(raw: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  const lines = raw.split('\n');
  let contentBuffer = '';
  const toolCallRegex = /^\[Calling tool: (\w+)\.\.\.\]$/;

  for (const line of lines) {
    const match = line.trim().match(toolCallRegex);
    if (match) {
      // Flush content buffer first
      if (contentBuffer.trim()) {
        blocks.push({ type: 'content', text: contentBuffer.trim() });
        contentBuffer = '';
      }
      blocks.push({ type: 'tool-call', toolName: match[1], isLast: false });
    } else {
      contentBuffer += line + '\n';
    }
  }

  // Flush remaining content
  if (contentBuffer.trim()) {
    blocks.push({ type: 'content', text: contentBuffer.trim() });
  }

  // Mark all tool-call blocks as not-last except the last one (for active animation)
  const toolCalls = blocks.filter((b) => b.type === 'tool-call');
  if (toolCalls.length > 0) {
    // If there is content after the last tool call, all tools are complete
    const lastBlock = blocks[blocks.length - 1];
    const allComplete = lastBlock.type === 'content';
    for (const tc of toolCalls) {
      if (tc.type === 'tool-call') {
        tc.isLast = false; // default complete
      }
    }
    // If still streaming (no content after last tool call), mark the last tool as active
    if (!allComplete && toolCalls.length > 0) {
      const lastTool = toolCalls[toolCalls.length - 1];
      if (lastTool.type === 'tool-call') {
        lastTool.isLast = true;
      }
    }
  }

  return blocks;
}
