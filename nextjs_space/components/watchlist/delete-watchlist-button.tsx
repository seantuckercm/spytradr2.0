
// components/watchlist/delete-watchlist-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteWatchlist } from '@/actions/watchlist-actions';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface DeleteWatchlistButtonProps {
  watchlistId: string;
  watchlistName: string;
  children: React.ReactNode;
}

export function DeleteWatchlistButton({ 
  watchlistId, 
  watchlistName, 
  children 
}: DeleteWatchlistButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsLoading(true);
    
    const result = await deleteWatchlist({ watchlistId });
    
    if (result.success) {
      toast({
        title: 'Watchlist deleted',
        description: `${watchlistName} has been permanently deleted.`,
      });
      setOpen(false);
      router.refresh();
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the 
            watchlist "{watchlistName}" and all its items.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Deleting...
              </>
            ) : (
              'Delete Watchlist'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
