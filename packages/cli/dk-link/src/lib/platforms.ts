export interface AgentPlatform {
	id: string;
	label: string;
	skillsDir: string;
}

export const AGENT_PLATFORMS: AgentPlatform[] = [
	{ id: 'claude', label: 'Claude', skillsDir: '.claude' },
	{ id: 'github-copilot', label: 'GitHub Copilot', skillsDir: '.github/instructions' },
];
