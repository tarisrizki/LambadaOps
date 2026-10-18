'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Trash2, Plus, X, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ReferenceDataItem {
  id: number;
  name: string;
}

interface ReferenceDataTableProps {
  data: ReferenceDataItem[];
  isLoading: boolean;
  title: string;
  onCreate: (name: string) => void;
  onUpdate: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}

export function ReferenceDataTable({
  data,
  isLoading,
  title,
  onCreate,
  onUpdate,
  onDelete,
}: ReferenceDataTableProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editItemName, setEditItemName] = useState('');

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleCreate = () => {
    if (!newItemName.trim()) return;
    onCreate(newItemName.trim());
    setNewItemName('');
    setIsAdding(false);
  };

  const handleUpdate = (id: number) => {
    if (!editItemName.trim()) return;
    onUpdate(id, editItemName.trim());
    setEditingId(null);
    setEditItemName('');
  };

  const handleDelete = (id: number) => {
    onDelete(id);
    setDeletingId(null);
  };

  if (isLoading) {
    return <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsAdding(true)} disabled={isAdding} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add {title}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isAdding && (
              <TableRow>
                <TableCell className="font-medium">-</TableCell>
                <TableCell>
                  <Input 
                    value={newItemName} 
                    onChange={(e) => setNewItemName(e.target.value)} 
                    placeholder={`New ${title.toLowerCase()} name...`}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate();
                      if (e.key === 'Escape') setIsAdding(false);
                    }}
                  />
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="icon" variant="ghost" onClick={handleCreate} disabled={!newItemName.trim()}>
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsAdding(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {data.length === 0 && !isAdding ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  No {title.toLowerCase()}s found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <Input 
                        value={editItemName} 
                        onChange={(e) => setEditItemName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdate(item.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                    ) : (
                      item.name
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === item.id ? (
                      <div className="flex justify-end space-x-2">
                        <Button size="icon" variant="ghost" onClick={() => handleUpdate(item.id)} disabled={!editItemName.trim()}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : deletingId === item.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <span className="text-xs text-destructive mr-2">Are you sure?</span>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                          Yes
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDeletingId(null)}>
                          No
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => {
                            setEditingId(item.id);
                            setEditItemName(item.name);
                            setDeletingId(null);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => {
                            setDeletingId(item.id);
                            setEditingId(null);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
