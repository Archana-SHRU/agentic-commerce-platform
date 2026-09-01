import { SupportAgent } from '../types'

export const supportAgents: SupportAgent[] = [
  {
    id: 'agent-1',
    name: 'Priya Sharma',
    avatar: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=3B82F6&color=fff&size=128&bold=true',
    status: 'available',
    specialism: 'Electronics',
    rating: 4.9,
  },
  {
    id: 'agent-2',
    name: 'Rajesh Kumar',
    avatar: 'https://ui-avatars.com/api/?name=Rajesh+Kumar&background=8B5CF6&color=fff&size=128&bold=true',
    status: 'busy',
    specialism: 'Fashion & Lifestyle',
    rating: 4.7,
  },
  {
    id: 'agent-3',
    name: 'Anjali Verma',
    avatar: 'https://ui-avatars.com/api/?name=Anjali+Verma&background=EC4899&color=fff&size=128&bold=true',
    status: 'available',
    specialism: 'General Support',
    rating: 4.8,
  },
  {
    id: 'agent-4',
    name: 'Vikram Singh',
    avatar: 'https://ui-avatars.com/api/?name=Vikram+Singh&background=F97316&color=fff&size=128&bold=true',
    status: 'offline',
    specialism: 'Technical Support',
    rating: 4.6,
  },
]

export const getAvailableAgents = (): SupportAgent[] => {
  return supportAgents.filter((agent) => agent.status === 'available')
}

export const getAgentById = (id: string): SupportAgent | undefined => {
  return supportAgents.find((agent) => agent.id === id)
}
