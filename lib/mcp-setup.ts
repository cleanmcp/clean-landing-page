// ---------------------------------------------------------------------------
// Shared MCP setup command generator
// ---------------------------------------------------------------------------

export type ConfigTab =
  | "claude-code"
  | "cursor"
  | "windsurf"
  | "gemini"
  | "cline"
  | "continue"
  | "claude-desktop"
  | "codex"
  | "antigravity";

export const AGENT_RULES_CONTENT = `# Clean MCP

This project uses Clean for code search. Always prefer these MCP tools over built-in file search, grep, or directory listing:

- \`search_code\` — Semantic code search across all indexed repositories
- \`get_file_tree\` — Repository directory structure
- \`get_source\` — Read source files from indexed repos
- \`expand_result\` — Get full source for truncated search results

Do not fall back to grep or manual file reading when these tools are available.`;

// Platforms that support agent rules files
const RULES_FILES: Partial<Record<ConfigTab, { path: string; append: boolean }>> = {
  "claude-code": { path: "CLAUDE.md", append: true },
  cursor: { path: ".cursorrules", append: false },
  windsurf: { path: ".windsurfrules", append: false },
};

// Platforms that use npx-based spawning (no terminal command, JSON only)
const NPX_ONLY_TABS: ConfigTab[] = ["claude-desktop", "antigravity"];

/**
 * Returns true if this tab supports a terminal setup command.
 * claude-desktop and antigravity use npx-based configs that don't
 * translate to a simple file-write command.
 */
export function hasTerminalCommand(tab: ConfigTab): boolean {
  return !NPX_ONLY_TABS.includes(tab);
}

/**
 * Returns true if this tab supports agent rules (auto-use file).
 */
export function hasAgentRules(tab: ConfigTab): boolean {
  return tab in RULES_FILES;
}

interface SetupParts {
  /** The full combined command */
  command: string;
  /** Whether config is written to a global path (warning about overwrite) */
  isGlobalConfig: boolean;
}

/**
 * Build a single combined shell command that writes the MCP config file
 * and (if supported) creates the agent rules file.
 */
export function getSetupCommand(
  tab: ConfigTab,
  mcpConfigJson: string,
  key: string,
  slug: string | null,
): SetupParts {
  const parts: string[] = [];
  let isGlobalConfig = false;

  // --- MCP config file ---
  switch (tab) {
    case "claude-code":
      parts.push(`cat > .mcp.json << 'CLEANEOF'\n${mcpConfigJson}\nCLEANEOF`);
      break;

    case "cursor":
      isGlobalConfig = true;
      parts.push(`mkdir -p ~/.cursor && cat > ~/.cursor/mcp.json << 'CLEANEOF'\n${mcpConfigJson}\nCLEANEOF`);
      break;

    case "windsurf":
      isGlobalConfig = true;
      parts.push(`mkdir -p ~/.codeium/windsurf && cat > ~/.codeium/windsurf/mcp_config.json << 'CLEANEOF'\n${mcpConfigJson}\nCLEANEOF`);
      break;

    case "gemini":
      isGlobalConfig = true;
      parts.push(`mkdir -p ~/.gemini && cat > ~/.gemini/settings.json << 'CLEANEOF'\n${mcpConfigJson}\nCLEANEOF`);
      break;

    case "cline":
      isGlobalConfig = true;
      parts.push(
        `# Cline stores MCP config in VS Code settings — paste the JSON below into\n` +
        `# Settings > Extensions > Cline > MCP Servers\n` +
        `cat > /tmp/clean-mcp-cline.json << 'CLEANEOF'\n${mcpConfigJson}\nCLEANEOF\n` +
        `echo "Config written to /tmp/clean-mcp-cline.json — paste into Cline settings"`
      );
      break;

    case "continue":
      isGlobalConfig = true;
      parts.push(`mkdir -p ~/.continue && cat > ~/.continue/config.json << 'CLEANEOF'\n${mcpConfigJson}\nCLEANEOF`);
      break;

    case "codex": {
      // Escape for TOML basic strings
      const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      const tomlLines = [
        `[mcp_servers.clean]`,
        `command = "npx"`,
        `args = ["-y", "mcp-remote", "https://api.tryclean.ai/mcp/sse", "--header", "Authorization:Bearer ${esc(key)}"${slug ? `, "--header", "X-Clean-Slug:${esc(slug)}"` : ""}]`,
      ].join("\n");
      isGlobalConfig = true;
      parts.push(`mkdir -p ~/.codex && cat > ~/.codex/config.toml << 'CLEANEOF'\n${tomlLines}\nCLEANEOF`);
      break;
    }

    default:
      break;
  }

  // --- Agent rules file ---
  const rulesConfig = RULES_FILES[tab];
  if (rulesConfig) {
    const op = rulesConfig.append ? ">>" : ">";
    const prefix = rulesConfig.append ? "\n" : "";
    parts.push(`cat ${op} ${rulesConfig.path} << 'CLEANEOF'\n${prefix}${AGENT_RULES_CONTENT}\nCLEANEOF`);
  }

  return {
    command: parts.join("\n\n"),
    isGlobalConfig,
  };
}
