export interface AgentPlatform {
	id: string;
	label: string;
	skillsDir: string;
	agentsDir: string;
}

export const AGENT_PLATFORMS: AgentPlatform[] = [
	{ agentsDir: '.claude', id: 'claude', label: 'Claude', skillsDir: '.claude' },
	{ agentsDir: '.github', id: 'github-copilot', label: 'GitHub Copilot', skillsDir: '.agents' },
];
