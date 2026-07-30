import { Badge } from '@/components/ui/badge';
import { assetStatusEnum } from '../schemas';
import { z } from 'zod';

type AssetStatus = z.infer<typeof assetStatusEnum>;

interface AssetStatusBadgeProps {
  status: AssetStatus;
}

export function AssetStatusBadge({ status }: AssetStatusBadgeProps) {
  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>;
    case 'repair':
      return <Badge variant="secondary" className="bg-yellow-500 text-black hover:bg-yellow-600">In Repair</Badge>;
    case 'lost':
      return <Badge variant="destructive">Lost</Badge>;
    case 'retired':
      return <Badge variant="outline" className="text-gray-500 border-gray-300">Retired</Badge>;
    case 'disposed':
      return <Badge variant="secondary" className="bg-gray-800 text-white hover:bg-gray-900">Disposed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
