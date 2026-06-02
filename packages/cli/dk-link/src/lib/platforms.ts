export interface AgentPlatform {
	id: string;
	label: string;
	skillsDir: string;
	agentsDir: string;
}

export const AGENT_PLATFORMS: AgentPlatform[] = [
	{ agentsDir: '.claude', id: 'claude', label: 'Claude', skillsDir: '.claude' },
	{ agentsDir: '.github', id: 'copilot', label: 'GitHub Copilot', skillsDir: '.agents' },
	{ agentsDir: '.opencode', id: 'opencode', label: 'OpenCode', skillsDir: '.agents' },
];
