import { Badge } from '@/components/ui/badge';
import type { AssignmentType } from '../types';

interface AssignmentTypeBadgeProps {
  type: AssignmentType;
}

export function AssignmentTypeBadge({ type }: AssignmentTypeBadgeProps) {
  switch (type) {
    case 'individual':
      return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Individual</Badge>;
    case 'shared':
      return <Badge variant="secondary" className="bg-purple-600 text-white hover:bg-purple-700">Shared</Badge>;
    case 'unassigned':
      return <Badge variant="outline" className="text-gray-500 border-gray-300">Unassigned</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}
