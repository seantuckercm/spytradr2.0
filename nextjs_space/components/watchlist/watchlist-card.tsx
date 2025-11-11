
// components/watchlist/watchlist-card.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteWatchlistButton } from './delete-watchlist-button';

interface WatchlistCardProps {
  watchlist: {
    id: string;
    name: string;
    description?: string | null;
    isActive: boolean;
    items: any[];
    createdAt: Date;
    updatedAt: Date;
  };
}

export function WatchlistCard({ watchlist }: WatchlistCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-xl flex items-center gap-2">
            {watchlist.isActive ? (
              <Eye className="h-4 w-4 text-green-500" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
            {watchlist.name}
          </CardTitle>
          {watchlist.description && (
            <CardDescription>{watchlist.description}</CardDescription>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/watchlists/${watchlist.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DeleteWatchlistButton watchlistId={watchlist.id} watchlistName={watchlist.name}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DeleteWatchlistButton>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{watchlist.items.length} pairs</span>
            <Badge variant={watchlist.isActive ? "default" : "secondary"}>
              {watchlist.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href={`/watchlists/${watchlist.id}`}>
                View Details
              </Link>
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Updated {new Date(watchlist.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
