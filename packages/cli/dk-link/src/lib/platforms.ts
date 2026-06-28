export interface AgentPlatform {
  agentsDir: string;
  id: string;
  label: string;
  skillsDir: string;
}

export const AGENT_PLATFORMS: Array<AgentPlatform> = [
  { agentsDir: '.claude', id: 'claude', label: 'Claude', skillsDir: '.claude' },
  { agentsDir: '.github', id: 'copilot', label: 'GitHub Copilot', skillsDir: '.agents' },
  { agentsDir: '.opencode', id: 'opencode', label: 'OpenCode', skillsDir: '.agents' },
];
